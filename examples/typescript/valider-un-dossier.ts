// Validates every .pdf and .xml of a folder, two at a time, and exits 1 if any is invalid.
// MAFACTUREOK_CLE=mfok_live_... npx tsx valider-un-dossier.ts ../factures
import { readdir } from "node:fs/promises";
import { extname, join } from "node:path";
import { MaFactureOK, type Verdict } from "@mafactureok/sdk";

const client = new MaFactureOK({ cle: process.env.MAFACTUREOK_CLE ?? "" });
const dossier = process.argv[2] ?? "../factures";

async function* fichiers(dir: string): AsyncGenerator<string> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* fichiers(path);
    else if ([".pdf", ".xml"].includes(extname(entry.name).toLowerCase())) yield path;
  }
}

const resultats: { fichier: string; verdict: Verdict }[] = [];
const queue: string[] = [];
for await (const f of fichiers(dossier)) queue.push(f);
await Promise.all(
  Array.from({ length: 2 }, async () => {
    for (let f = queue.shift(); f !== undefined; f = queue.shift()) {
      const rapport = await client.valider({ chemin: f });
      resultats.push({ fichier: f, verdict: rapport.verdict });
      console.log(`${rapport.verdict.padEnd(11)} ${f}`);
    }
  }),
);
process.exit(resultats.some((r) => r.verdict === "invalide") ? 1 : 0);
