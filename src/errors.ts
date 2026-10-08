import type { ValiderFactureDigest } from "./types.js";

export type CodeErreur =
  /** A key was sent but it is not active: typo, revoked, or never issued. */
  | "cle_invalide"
  /** Daily quota of the key, or the anonymous budget, is exhausted. See `retryAfterSeconds`. */
  | "quota_atteint"
  | "fichier_trop_grand"
  | "fichier_vide"
  /** The engine did not answer; `rapport` carries a `non_analyse` digest. */
  | "analyse_indisponible"
  | "corps_invalide"
  | "identifiant_invalide"
  | "trop_identifiants"
  | "indisponible"
  /** No HTTP answer at all (DNS, connection, timeout, abort). */
  | "reseau"
  /** An HTTP answer the contract does not describe. */
  | "reponse_inattendue";

const KNOWN: ReadonlySet<string> = new Set<CodeErreur>([
  "cle_invalide",
  "quota_atteint",
  "fichier_trop_grand",
  "fichier_vide",
  "analyse_indisponible",
  "corps_invalide",
  "identifiant_invalide",
  "trop_identifiants",
  "indisponible",
]);

export class MaFactureOKError extends Error {
  override readonly name = "MaFactureOKError";
  readonly code: CodeErreur;
  readonly status: number | undefined;
  readonly detail: string | undefined;
  /** Seconds to wait before retrying, on `quota_atteint`. */
  readonly retryAfterSeconds: number | undefined;
  /** On `analyse_indisponible`: the `non_analyse` report the API still returned. */
  readonly rapport: ValiderFactureDigest | undefined;

  constructor(
    code: CodeErreur,
    message: string,
    extra: { status?: number; detail?: string; retryAfterSeconds?: number; rapport?: ValiderFactureDigest; cause?: unknown } = {},
  ) {
    super(message, extra.cause === undefined ? undefined : { cause: extra.cause });
    this.code = code;
    this.status = extra.status;
    this.detail = extra.detail;
    this.retryAfterSeconds = extra.retryAfterSeconds;
    this.rapport = extra.rapport;
  }

  /** Builds the error for a non-2xx answer whose body follows the `{ erreur, detail? }` contract. */
  static fromResponse(status: number, body: unknown, retryAfter: string | null): MaFactureOKError {
    const record = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
    const erreur = typeof record.erreur === "string" ? record.erreur : undefined;
    const detail = typeof record.detail === "string" ? record.detail : undefined;
    const code: CodeErreur = erreur !== undefined && KNOWN.has(erreur) ? (erreur as CodeErreur) : "reponse_inattendue";
    const retry = retryAfter === null ? undefined : Number(retryAfter);
    const rapport = code === "analyse_indisponible" && typeof record.rapport === "object" && record.rapport !== null ? (record.rapport as ValiderFactureDigest) : undefined;
    const message =
      code === "reponse_inattendue"
        ? `MaFactureOK a répondu ${status}${erreur === undefined ? "" : ` (${erreur})`}.`
        : `MaFactureOK : ${code}${detail === undefined ? "" : ` (${detail})`}`;
    return new MaFactureOKError(code, message, {
      status,
      detail,
      ...(retry !== undefined && Number.isFinite(retry) ? { retryAfterSeconds: retry } : {}),
      ...(rapport === undefined ? {} : { rapport }),
    });
  }
}
