import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const KEY = "mfok_live_" + "B".repeat(32);
const cli = new URL("../dist/cli.js", import.meta.url).pathname;
const invalide = JSON.parse(readFileSync(new URL("../examples/resultats/ubl-invoice-invalid-payable-total.json", import.meta.url), "utf8"));
const valide = JSON.parse(readFileSync(new URL("../examples/resultats/ubl-invoice-valid.json", import.meta.url), "utf8"));

/** A stand-in for the API: keyed, one digest per file size, so the CLI is exercised end to end. */
function startServer() {
  const server = createServer((req, res) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const body = Buffer.concat(chunks);
      const send = (status, payload, headers = {}) => {
        res.writeHead(status, { "content-type": "application/json", ...headers });
        res.end(JSON.stringify(payload));
      };
      if (req.headers.authorization !== `Bearer ${KEY}`) return send(401, { erreur: "cle_invalide", detail: "Demandez une clé" });
      if (req.url === "/api/public/v1/moi") return send(200, { version: "1.0", plan: "beta", email: "z***@exemple.fr", cree_le: "2026-10-08T09:00:00Z", quotas: { validations_par_jour: 100, identifiants_par_jour: 200, identifiants_par_appel: 25 }, usage: { total: 2 } });
      if (req.url === "/api/public/v1/valider-facture") {
        const digest = body.includes("1199") ? invalide : valide;
        return send(200, digest, { "x-quota-limit": "100", "x-quota-remaining": "97" });
      }
      send(404, { erreur: "not_found" });
    });
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve({ server, baseUrl: `http://127.0.0.1:${server.address().port}` })));
}

/** Asynchronous on purpose: the stand-in server lives in this process, a blocking spawn would starve it. */
function run(args, env = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [cli, ...args], { env: { ...process.env, MAFACTUREOK_CLE: "", ...env } });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("close", (status) => resolve({ status, stdout, stderr }));
  });
}

test("valider prints a readable report and exits with the verdict code; --json prints one line per file", async () => {
  const { server, baseUrl } = await startServer();
  try {
    const ok = await run(["valider", "examples/factures/valide/ubl-invoice-valid.xml", "--base-url", baseUrl], { MAFACTUREOK_CLE: KEY });
    // The recorded fixture may say a_verifier (demo SIREN unknown at the registry): exit 0 or 2 accordingly.
    assert.equal(ok.status, valide.verdict === "valide" ? 0 : 1, ok.stderr);
    assert.match(ok.stdout, /ubl-invoice-valid\.xml : (VALIDE|A_VERIFIER)/);
    assert.match(ok.stdout, /quota : 97\/100/);
    const ko = await run(["valider", "examples/factures/invalide/ubl-invoice-invalid-payable-total.xml", "examples/factures/valide/ubl-invoice-valid.xml", "--cle", KEY, "--base-url", baseUrl, "--json"]);
    assert.equal(ko.status, 2, ko.stderr);
    const lines = ko.stdout.trim().split("\n").map((l) => JSON.parse(l));
    assert.equal(lines.length, 2);
    assert.equal(lines[0].verdict, "invalide");
    assert.ok(lines[0].fichier.endsWith("ubl-invoice-invalid-payable-total.xml"));
    const human = await run(["valider", "examples/factures/invalide/ubl-invoice-invalid-payable-total.xml", "--cle", KEY, "--base-url", baseUrl]);
    assert.match(human.stdout, /\[bloquante\].*BR-CO-16/);
  } finally {
    server.close();
  }
});

test("moi, a wrong key, a missing key and --help", async () => {
  const { server, baseUrl } = await startServer();
  try {
    const moi = await run(["moi", "--cle", KEY, "--base-url", baseUrl]);
    assert.equal(moi.status, 0, moi.stderr);
    assert.match(moi.stdout, /100 validations\/jour/);
    const wrong = await run(["moi", "--cle", "mfok_live_" + "C".repeat(32), "--base-url", baseUrl]);
    assert.equal(wrong.status, 4);
    assert.match(wrong.stderr, /cle_invalide/);
    const missing = await run(["valider", "x.xml", "--base-url", baseUrl]);
    assert.equal(missing.status, 4);
    assert.match(missing.stderr, /MAFACTUREOK_CLE/);
    const help = await run(["--help"]);
    assert.equal(help.status, 0);
    assert.match(help.stdout, /mafactureok valider/);
    assert.equal((await run(["--version"])).stdout.trim(), JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version);
  } finally {
    server.close();
  }
});
