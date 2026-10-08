// Checks SIREN/SIRET before invoicing and routes on the signal.
// MAFACTUREOK_CLE=mfok_live_... npx tsx verifier-tiers.ts 456500537 897865184
import { MaFactureOK } from "@mafactureok/sdk";

const client = new MaFactureOK({ cle: process.env.MAFACTUREOK_CLE ?? "" });
const identifiants = process.argv.slice(2);
if (identifiants.length === 0) throw new Error("Donnez au moins un SIREN ou SIRET.");

const { resultats } = await client.verifierTiers(identifiants);
for (const r of resultats) {
  switch (r.signal) {
    case "ok":
      console.log(`${r.identifiant} ok : ${r.raison_sociale ?? ""} (TVA ${r.tva?.statut ?? "non vérifiée"})`);
      break;
    case "indetermine":
      console.log(`${r.identifiant} à relancer plus tard : ${r.action}`);
      break;
    default:
      console.log(`${r.identifiant} ${r.signal} (${r.etat}) : ${r.action}`);
  }
}
