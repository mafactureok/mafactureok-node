// Runs the synthetic examples against a live instance and compares verdicts
// and blocking rules with examples/attendus.json. Needs MAFACTUREOK_CLE.
// Usage: node scripts/live-check.mjs [--base-url https://...]
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MaFactureOK, MaFactureOKError } from "../dist/index.js";

const baseUrlIndex = process.argv.indexOf("--base-url");
const baseUrl = baseUrlIndex === -1 ? undefined : process.argv[baseUrlIndex + 1];
const cle = process.env.MAFACTUREOK_CLE ?? "";
if (cle === "") {
  console.error("MAFACTUREOK_CLE is required (free key: https://mafactureok.com/api).");
  process.exit(4);
}
const client = new MaFactureOK({ cle, ...(baseUrl === undefined ? {} : { baseUrl }) });
const attendus = JSON.parse(readFileSync(join(process.cwd(), "examples", "attendus.json"), "utf8"));
let failures = 0;
for (const item of attendus.fichiers) {
  const chemin = join(process.cwd(), "examples", "factures", item.fichier);
  try {
    const rapport = await client.valider({ chemin });
    const bloquantes = [...new Set(rapport.anomalies.filter((a) => a.gravite === "bloquante").flatMap((a) => a.regles))].sort();
    const verdictOk = item.verdicts.includes(rapport.verdict);
    const reglesOk = JSON.stringify(bloquantes) === JSON.stringify([...item.regles_bloquantes].sort());
    const status = verdictOk && reglesOk ? "ok" : "MISMATCH";
    if (status !== "ok") failures += 1;
    console.log(`${status} ${item.fichier}: verdict=${rapport.verdict} (attendu ${item.verdicts.join("|")}), bloquantes=${bloquantes.join(",") || "-"}${rapport.quota ? `, quota ${rapport.quota.restant}/${rapport.quota.limite}` : ""}`);
  } catch (error) {
    failures += 1;
    console.log(`ERROR ${item.fichier}: ${error instanceof MaFactureOKError ? `${error.code} ${error.message}` : String(error)}`);
  }
}
const moi = await client.moi();
console.log(`moi: plan ${moi.plan}, ${moi.quotas.validations_par_jour} validations/jour, usage total ${moi.usage.total}`);
process.exit(failures === 0 ? 0 : 1);
