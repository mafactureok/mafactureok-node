import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { MaFactureOK, MaFactureOKError } from "../dist/index.js";

const KEY = "mfok_live_" + "A".repeat(32);
const digest = JSON.parse(readFileSync(new URL("../examples/resultats/ubl-invoice-invalid-payable-total.json", import.meta.url), "utf8"));

function fakeFetch(handler) {
  const calls = [];
  const fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return handler(String(url), init);
  };
  return { fetch, calls };
}
const json = (status, body, headers = {}) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });

test("the constructor refuses a missing or malformed key", () => {
  assert.throws(() => new MaFactureOK({ cle: "" }), (e) => e instanceof MaFactureOKError && e.code === "cle_invalide");
  assert.throws(() => new MaFactureOK({ cle: "abc" }), (e) => e.code === "cle_invalide");
  assert.ok(new MaFactureOK({ cle: KEY }));
});

test("valider sends the bytes with the key and returns the digest plus quota", async () => {
  const { fetch, calls } = fakeFetch(() => json(200, digest, { "x-quota-limit": "100", "x-quota-remaining": "99" }));
  const client = new MaFactureOK({ cle: KEY, fetch, baseUrl: "https://exemple.test/" });
  const bytes = readFileSync(new URL("../examples/factures/invalide/ubl-invoice-invalid-payable-total.xml", import.meta.url));
  const rapport = await client.valider(bytes);
  assert.equal(rapport.verdict, "invalide");
  assert.deepEqual(rapport.quota, { limite: 100, restant: 99 });
  assert.equal(calls[0].url, "https://exemple.test/api/public/v1/valider-facture");
  assert.equal(calls[0].init.method, "POST");
  assert.equal(calls[0].init.headers.authorization, `Bearer ${KEY}`);
  assert.equal(calls[0].init.headers["content-type"], "application/octet-stream");
  assert.match(calls[0].init.headers["user-agent"], /^mafactureok-sdk\//);
  assert.equal(calls[0].init.body.byteLength, bytes.byteLength);
});

test("valider accepts { chemin }, a Blob and an ArrayBuffer, and refuses an empty file", async () => {
  const { fetch } = fakeFetch(() => json(200, digest));
  const client = new MaFactureOK({ cle: KEY, fetch });
  const chemin = new URL("../examples/factures/valide/ubl-invoice-valid.xml", import.meta.url).pathname;
  assert.equal((await client.valider({ chemin })).verdict, "invalide");
  assert.equal((await client.valider(new Blob(["<x/>"]))).quota, undefined);
  assert.equal((await client.valider(new TextEncoder().encode("<x/>").buffer)).verdict, "invalide");
  await assert.rejects(client.valider(new Uint8Array()), (e) => e.code === "fichier_vide");
});

test("HTTP errors map to typed codes: 401, 429 with Retry-After, 413, 502 with the partial report", async () => {
  const cases = [
    [json(401, { erreur: "cle_invalide", detail: "Demandez une clé" }), "cle_invalide", (e) => assert.equal(e.detail, "Demandez une clé")],
    [json(429, { erreur: "quota_atteint" }, { "retry-after": "3600" }), "quota_atteint", (e) => assert.equal(e.retryAfterSeconds, 3600)],
    [json(413, { erreur: "fichier_trop_grand" }), "fichier_trop_grand", (e) => assert.equal(e.status, 413)],
    [json(502, { erreur: "analyse_indisponible", rapport: { ...digest, verdict: "non_analyse" } }), "analyse_indisponible", (e) => assert.equal(e.rapport.verdict, "non_analyse")],
    [new Response("<html>", { status: 503 }), "reponse_inattendue", (e) => assert.equal(e.status, 503)],
  ];
  for (const [response, code, check] of cases) {
    const client = new MaFactureOK({ cle: KEY, fetch: async () => response });
    await assert.rejects(client.valider(new Uint8Array([1])), (e) => {
      assert.ok(e instanceof MaFactureOKError);
      assert.equal(e.code, code);
      check(e);
      return true;
    });
  }
});

test("network failures and timeouts are reported as reseau", async () => {
  const down = new MaFactureOK({ cle: KEY, fetch: async () => { throw new TypeError("fetch failed"); } });
  await assert.rejects(down.moi(), (e) => e.code === "reseau" && e.cause instanceof TypeError);
  const slow = new MaFactureOK({ cle: KEY, timeoutMs: 20, fetch: (_url, init) => new Promise((_, reject) => init.signal.addEventListener("abort", () => reject(init.signal.reason))) });
  await assert.rejects(slow.moi(), (e) => e.code === "reseau" && /20 ms/.test(e.message));
});

test("verifierTiers posts JSON and moi is a GET without body", async () => {
  const { fetch, calls } = fakeFetch((url) =>
    url.endsWith("/moi")
      ? json(200, { version: "1.0", plan: "beta", email: "z***@exemple.fr", cree_le: "2026-10-08T09:00:00Z", quotas: { validations_par_jour: 100, identifiants_par_jour: 200, identifiants_par_appel: 25 }, usage: { total: 0 } })
      : json(200, { version: "1.0", verifie_le: "2026-10-08T10:00:00Z", resultats: [{ identifiant: "456500537", existe: true, etat: "actif", signal: "ok", action: null }] }),
  );
  const client = new MaFactureOK({ cle: KEY, fetch });
  const tiers = await client.verifierTiers(["456500537"]);
  assert.equal(tiers.resultats[0].signal, "ok");
  assert.deepEqual(JSON.parse(calls[0].init.body), { identifiants: ["456500537"] });
  assert.equal(calls[0].init.headers["content-type"], "application/json");
  const moi = await client.moi();
  assert.equal(moi.quotas.validations_par_jour, 100);
  assert.equal(calls[1].init.method, "GET");
  assert.equal(calls[1].init.body, undefined);
  await assert.rejects(client.verifierTiers([]), (e) => e.code === "identifiant_invalide");
});
