#!/usr/bin/env node
import { basename } from "node:path";
import { MaFactureOK } from "./client.js";
import { MaFactureOKError } from "./errors.js";
import type { RapportValidation, Verdict } from "./types.js";
import { VERSION } from "./version.js";

const USAGE = `mafactureok ${VERSION} : pré-contrôle de factures électroniques françaises.

Usage :
  mafactureok valider <fichier...>   Valide des fichiers Factur-X, UBL ou CII
  mafactureok tiers <SIREN|SIRET...> Vérifie des identifiants au registre officiel
  mafactureok moi                    Affiche le plan, les quotas et l'usage de la clé

Options :
  --cle <mfok_live_...>  Clé d'API (sinon variable MAFACTUREOK_CLE)
  --json                 Sortie JSON brute (une ligne par résultat)
  --base-url <origine>   Autre instance (défaut : https://mafactureok.com)
  --help, --version

Codes de sortie (valider) : 0 valide, 1 a_verifier, 2 invalide, 3 non_analyse, 4 erreur (le pire des fichiers).
Clé gratuite par email : https://mafactureok.com/api`;

/** Ordered by severity so that several files report the worst one. */
const EXIT: Record<Verdict, number> = { valide: 0, a_verifier: 1, invalide: 2, non_analyse: 3 };

interface Args {
  command: string | undefined;
  positional: string[];
  cle: string | undefined;
  json: boolean;
  baseUrl: string | undefined;
  help: boolean;
  version: boolean;
}

function parse(argv: string[]): Args {
  const args: Args = { command: undefined, positional: [], cle: undefined, json: false, baseUrl: undefined, help: false, version: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i] as string;
    if (a === "--json") args.json = true;
    else if (a === "--help" || a === "-h") args.help = true;
    else if (a === "--version" || a === "-v") args.version = true;
    else if (a === "--cle") args.cle = argv[(i += 1)];
    else if (a.startsWith("--cle=")) args.cle = a.slice(6);
    else if (a === "--base-url") args.baseUrl = argv[(i += 1)];
    else if (a.startsWith("--base-url=")) args.baseUrl = a.slice(11);
    else if (a.startsWith("-")) throw new Error(`Option inconnue : ${a}`);
    else if (args.command === undefined) args.command = a;
    else args.positional.push(a);
  }
  return args;
}

function printRapport(name: string, r: RapportValidation): void {
  const lines = [`${name} : ${r.verdict.toUpperCase()} (${r.titre})`];
  if (r.format !== undefined) lines.push(`  format : ${r.format}${r.profil === undefined ? "" : `, profil ${r.profil}`}`);
  if (r.motif_non_analyse !== undefined) lines.push(`  motif : ${r.motif_non_analyse}`);
  if (r.synthese !== undefined) lines.push(`  ${r.synthese}`);
  for (const a of r.anomalies) {
    lines.push(`  [${a.gravite}] ${a.titre} (${a.ou}; ${a.regles.join(", ")})`);
    lines.push(`      ${a.sens}`);
    lines.push(`      Correction : ${a.correction}${a.valeur_proposee === undefined ? "" : ` Valeur proposée : ${a.valeur_proposee}`}`);
  }
  for (const e of r.entreprises ?? []) {
    lines.push(`  ${e.role}${e.nom_officiel === undefined ? "" : ` (${e.nom_officiel})`} : ${e.etat}${e.signaux.length === 0 ? "" : `, ${e.signaux.join(", ")}`}, TVA ${e.tva}`);
  }
  if (r.entreprises_non_verifiees !== undefined) lines.push(`  entreprises : ${r.entreprises_non_verifiees}`);
  if (r.quota !== undefined) lines.push(`  quota : ${r.quota.restant}/${r.quota.limite} validations restantes aujourd'hui`);
  console.log(lines.join("\n"));
}

async function main(argv: string[]): Promise<number> {
  const args = parse(argv);
  if (args.version) {
    console.log(VERSION);
    return 0;
  }
  if (args.help || args.command === undefined) {
    console.log(USAGE);
    return args.help ? 0 : 4;
  }
  const cle = args.cle ?? process.env.MAFACTUREOK_CLE ?? "";
  const client = new MaFactureOK({ cle, ...(args.baseUrl === undefined ? {} : { baseUrl: args.baseUrl }) });

  if (args.command === "moi") {
    const moi = await client.moi();
    if (args.json) console.log(JSON.stringify(moi));
    else {
      console.log(`Clé ${moi.email} (plan ${moi.plan}, créée le ${moi.cree_le})`);
      console.log(`  ${moi.quotas.validations_par_jour} validations/jour, ${moi.quotas.identifiants_par_jour} identifiants/jour (${moi.quotas.identifiants_par_appel} par appel)`);
      console.log(`  usage total : ${moi.usage.total}${moi.usage.derniere_utilisation === undefined ? "" : `, dernier appel ${moi.usage.derniere_utilisation}`}`);
    }
    return 0;
  }
  if (args.command === "tiers") {
    if (args.positional.length === 0) throw new Error("Au moins un SIREN ou SIRET est attendu.");
    const reponse = await client.verifierTiers(args.positional);
    if (args.json) console.log(JSON.stringify(reponse));
    else {
      for (const r of reponse.resultats) {
        console.log(`${r.identifiant} : ${r.signal} (${r.etat})${r.raison_sociale === undefined ? "" : ` ${r.raison_sociale}`}${r.tva === undefined ? "" : `, TVA ${r.tva.statut}`}${r.action === null ? "" : `\n  ${r.action}`}`);
      }
    }
    return reponse.resultats.some((r) => r.signal === "alerte") ? 1 : reponse.resultats.some((r) => r.signal !== "ok") ? 2 : 0;
  }
  if (args.command === "valider") {
    if (args.positional.length === 0) throw new Error("Au moins un fichier est attendu.");
    let worst = 0;
    for (const chemin of args.positional) {
      const rapport = await client.valider({ chemin });
      if (args.json) console.log(JSON.stringify({ fichier: chemin, ...rapport }));
      else printRapport(basename(chemin), rapport);
      worst = Math.max(worst, EXIT[rapport.verdict]);
    }
    return worst;
  }
  throw new Error(`Commande inconnue : ${args.command}\n\n${USAGE}`);
}

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (error: unknown) => {
    if (error instanceof MaFactureOKError) {
      console.error(`Erreur ${error.code} : ${error.message}${error.retryAfterSeconds === undefined ? "" : ` Réessayez dans ${error.retryAfterSeconds} s.`}`);
      if (error.rapport !== undefined) console.error(JSON.stringify(error.rapport));
    } else {
      console.error(error instanceof Error ? error.message : String(error));
    }
    process.exit(4);
  },
);
