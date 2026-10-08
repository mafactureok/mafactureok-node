// npm install @mafactureok/sdk ; MAFACTUREOK_CLE=mfok_live_... npx tsx valider-un-fichier.ts facture.pdf
import { MaFactureOK, MaFactureOKError } from "@mafactureok/sdk";

const client = new MaFactureOK({ cle: process.env.MAFACTUREOK_CLE ?? "" });
const chemin = process.argv[2] ?? "../factures/invalide/facturx-invalide.pdf";

try {
  const rapport = await client.valider({ chemin });
  console.log(`${rapport.verdict} : ${rapport.titre}`);
  for (const a of rapport.anomalies) console.log(`- [${a.gravite}] ${a.titre} (${a.ou}) : ${a.correction}`);
  for (const e of rapport.entreprises ?? []) console.log(`- ${e.role} : ${e.etat}, TVA ${e.tva}`);
  if (rapport.quota) console.log(`${rapport.quota.restant}/${rapport.quota.limite} validations restantes aujourd'hui`);
} catch (error) {
  if (error instanceof MaFactureOKError && error.code === "quota_atteint") {
    console.error(`Quota atteint, réessayez dans ${error.retryAfterSeconds} s`);
  } else {
    throw error;
  }
}
