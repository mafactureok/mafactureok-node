import { readFile } from "node:fs/promises";
import { MaFactureOKError } from "./errors.js";
import type { FichierFacture, Moi, Quota, RapportValidation, ValiderFactureDigest, VerifierTiersReponse } from "./types.js";
import { VERSION } from "./version.js";

export const DEFAULT_BASE_URL = "https://mafactureok.com";
const KEY_SHAPE = /^mfok_live_[A-Za-z0-9]{20,64}$/;

export interface MaFactureOKOptions {
  /** Your `mfok_live_…` key, free from https://mafactureok.com/api. Required: the SDK never calls the API anonymously. */
  cle: string;
  /** Another origin (a preview, a local instance). Defaults to the production site. */
  baseUrl?: string;
  /** Per-request timeout; the engine answers in a few seconds, the registry checks may add a few more. */
  timeoutMs?: number;
  /** Replace the global `fetch` (tests, proxies, instrumentation). */
  fetch?: typeof fetch;
}

export interface OptionsAppel {
  signal?: AbortSignal;
}

/**
 * Client for the public MaFactureOK API v1. One instance per key; it keeps no
 * state. Every method either returns the typed answer or throws a
 * `MaFactureOKError` whose `code` tells what happened.
 */
export class MaFactureOK {
  readonly #cle: string;
  readonly #base: string;
  readonly #timeoutMs: number;
  readonly #fetch: typeof fetch;

  constructor(options: MaFactureOKOptions) {
    const cle = options.cle?.trim() ?? "";
    if (cle === "") throw new MaFactureOKError("cle_invalide", "Une clé est requise : demandez-la gratuitement sur https://mafactureok.com/api (MAFACTUREOK_CLE).");
    if (!KEY_SHAPE.test(cle)) throw new MaFactureOKError("cle_invalide", "La clé doit avoir la forme mfok_live_… telle que reçue par email.");
    this.#cle = cle;
    this.#base = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.#timeoutMs = options.timeoutMs ?? 60_000;
    this.#fetch = options.fetch ?? globalThis.fetch;
    if (typeof this.#fetch !== "function") throw new MaFactureOKError("reseau", "Aucune implémentation de fetch : Node.js 20 ou plus est requis.");
  }

  /**
   * Validates one invoice file (Factur-X PDF, UBL 2.1 or CII D22B XML) and
   * returns the French digest: verdict, anomalies with their correction and
   * location, state of the companies on the invoice. The file is analysed
   * then discarded by the service, never stored.
   */
  async valider(fichier: FichierFacture, options: OptionsAppel = {}): Promise<RapportValidation> {
    const body = await toBody(fichier);
    if (body.byteLength === 0) throw new MaFactureOKError("fichier_vide", "Le fichier est vide.");
    const response = await this.#request("POST", "/api/public/v1/valider-facture", { body, contentType: "application/octet-stream", signal: options.signal });
    const digest = (await this.#json(response)) as ValiderFactureDigest;
    if (typeof digest !== "object" || digest === null || typeof digest.verdict !== "string") {
      throw new MaFactureOKError("reponse_inattendue", "Réponse sans verdict.", { status: response.status });
    }
    const quota = quotaFromHeaders(response.headers);
    return quota === undefined ? digest : { ...digest, quota };
  }

  /** Checks SIREN (9 digits) or SIRET (14 digits) identifiers against the official registry and VIES. */
  async verifierTiers(identifiants: readonly string[], options: OptionsAppel = {}): Promise<VerifierTiersReponse> {
    if (identifiants.length === 0) throw new MaFactureOKError("identifiant_invalide", "Au moins un SIREN ou SIRET est attendu.");
    const response = await this.#request("POST", "/api/public/v1/verifier-tiers", {
      body: JSON.stringify({ identifiants: [...identifiants] }),
      contentType: "application/json",
      signal: options.signal,
    });
    return (await this.#json(response)) as VerifierTiersReponse;
  }

  /** The key's plan, quotas and usage. Free: does not count against any quota. */
  async moi(options: OptionsAppel = {}): Promise<Moi> {
    const response = await this.#request("GET", "/api/public/v1/moi", { signal: options.signal });
    return (await this.#json(response)) as Moi;
  }

  async #request(method: "GET" | "POST", path: string, init: { body?: BodyInit; contentType?: string; signal?: AbortSignal }): Promise<Response> {
    const headers: Record<string, string> = {
      authorization: `Bearer ${this.#cle}`,
      accept: "application/json",
      "user-agent": `mafactureok-sdk/${VERSION} node/${process.versions.node}`,
    };
    if (init.contentType !== undefined) headers["content-type"] = init.contentType;
    const timeout = AbortSignal.timeout(this.#timeoutMs);
    const signal = init.signal === undefined ? timeout : AbortSignal.any([init.signal, timeout]);
    let response: Response;
    try {
      response = await this.#fetch(`${this.#base}${path}`, { method, headers, body: init.body, signal });
    } catch (cause) {
      const aborted = timeout.aborted ? `aucune réponse en ${this.#timeoutMs} ms` : "appel interrompu ou réseau indisponible";
      throw new MaFactureOKError("reseau", `MaFactureOK injoignable : ${aborted}.`, { cause });
    }
    if (response.ok) return response;
    const body = await response.json().catch(() => undefined);
    throw MaFactureOKError.fromResponse(response.status, body, response.headers.get("retry-after"));
  }

  async #json(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch (cause) {
      throw new MaFactureOKError("reponse_inattendue", "Réponse non JSON.", { status: response.status, cause });
    }
  }
}

function quotaFromHeaders(headers: Headers): Quota | undefined {
  const limite = Number(headers.get("x-quota-limit"));
  const restant = Number(headers.get("x-quota-remaining"));
  if (!headers.has("x-quota-limit") || !Number.isFinite(limite) || !Number.isFinite(restant)) return undefined;
  return { limite, restant };
}

async function toBody(fichier: FichierFacture): Promise<Uint8Array<ArrayBuffer>> {
  if (fichier instanceof Uint8Array) return fichier.buffer instanceof ArrayBuffer ? (fichier as Uint8Array<ArrayBuffer>) : new Uint8Array(fichier);
  if (fichier instanceof ArrayBuffer) return new Uint8Array(fichier);
  if (typeof Blob !== "undefined" && fichier instanceof Blob) return new Uint8Array(await fichier.arrayBuffer());
  if (typeof fichier === "object" && fichier !== null && "chemin" in fichier && typeof fichier.chemin === "string") {
    return new Uint8Array(await readFile(fichier.chemin));
  }
  throw new MaFactureOKError("fichier_vide", "Fichier attendu : Uint8Array, ArrayBuffer, Blob ou { chemin }.");
}
