# @mafactureok/sdk

**English.** Node.js SDK and command line for [MaFactureOK](https://mafactureok.com), the free
pre-check of French electronic invoices: Factur-X, UBL 2.1 and CII D22B validated against the
official FNFE France RFE rules (EN 16931, BR-FR), plus SIREN/SIRET and VAT checks against the
official registries. One free API key, requested by email on
[mafactureok.com/api](https://mafactureok.com/api), and one line to validate an invoice. Files
are analysed then discarded by the service, never stored. The rest of this README is in French,
like the product; the API itself speaks French (`verdict`, `anomalies`, `correction`).

---

SDK Node.js et ligne de commande pour **MaFactureOK**, le pré-contrôle gratuit de factures
électroniques françaises. Même moteur que le site : XSD, schématrons EN 16931, règles
françaises BR-FR (référentiel FNFE France RFE 1.4.0.03), conteneur PDF/A-3 pour Factur-X, et
vérification des entreprises de la facture au registre officiel et auprès de VIES.

- Sans dépendance, TypeScript, ESM, Node.js 20 ou plus.
- Les types sont générés depuis le contrat OpenAPI 3.1 publié par le service
  (`contracts/openapi-public-v1.json`, aussi servi sur
  [mafactureok.com/api/public/v1/openapi.json](https://mafactureok.com/api/public/v1/openapi.json)).
- Six factures d'exemple synthétiques et leurs rapports dans `examples/`.
- Licence MIT. Le service, lui, reste un service en ligne gratuit en bêta.

## En une ligne

```bash
MAFACTUREOK_CLE=mfok_live_votre_cle npx @mafactureok/sdk valider facture.pdf
```

```text
facture.pdf : INVALIDE (Facture non conforme)
  format : Factur-X, profil EN16931
  [bloquante] Montant à payer incohérent (BT-115; BR-CO-16)
      Le total à payer ne correspond pas au total TTC moins le montant déjà réglé.
      Correction : Recalculez BT-115 à partir de BT-112 et BT-113. Valeur proposée : 1200.00
  Vendeur (DALKIA) : ok, TVA valide
  quota : 99/100 validations restantes aujourd'hui
```

La clé est gratuite et immédiate : saisissez votre email sur
[mafactureok.com/api](https://mafactureok.com/api), elle arrive par email et reste stable.

## Installation

```bash
npm install @mafactureok/sdk
```

## Utilisation

```ts
import { MaFactureOK, MaFactureOKError } from "@mafactureok/sdk";
import { readFile } from "node:fs/promises";

const client = new MaFactureOK({ cle: process.env.MAFACTUREOK_CLE! });

const rapport = await client.valider(await readFile("facture.pdf"));
// ou : await client.valider({ chemin: "facture.pdf" }) ; un Blob ou un ArrayBuffer conviennent aussi
console.log(rapport.verdict);              // "valide" | "a_verifier" | "invalide" | "non_analyse"
for (const a of rapport.anomalies) {
  console.log(a.gravite, a.titre, a.ou, a.correction, a.regles);
}
for (const e of rapport.entreprises ?? []) {
  console.log(e.role, e.etat, e.tva, e.signaux);
}
console.log(rapport.quota);                // { limite: 100, restant: 99 }
```

Les trois méthodes :

| Méthode | Endpoint | Ce qu'elle renvoie |
| --- | --- | --- |
| `valider(fichier)` | `POST /api/public/v1/valider-facture` | le rapport digéré (`ValiderFactureDigest`) et le quota restant |
| `verifierTiers(identifiants)` | `POST /api/public/v1/verifier-tiers` | un résultat par SIREN/SIRET : état, raison sociale, adresse, TVA, `signal` à router |
| `moi()` | `GET /api/public/v1/moi` | le plan, les quotas et l'usage de la clé (hors quota) |

### Erreurs

Toute réponse hors contrat lève une `MaFactureOKError` dont `code` dit ce qui s'est passé :

| `code` | Quand | À faire |
| --- | --- | --- |
| `cle_invalide` | clé absente, mal formée, révoquée ou inconnue (HTTP 401) | vérifier la clé ; en redemander une sur `/api` |
| `quota_atteint` | quota du jour épuisé (429) | attendre `retryAfterSeconds` |
| `fichier_trop_grand` | plus de 15 Mo (413) | |
| `fichier_vide` | corps vide (400) | |
| `analyse_indisponible` | le moteur n'a pas répondu (502) ; `rapport` contient un digest `non_analyse` | relancer plus tard |
| `reseau` | pas de réponse HTTP (DNS, connexion, délai `timeoutMs`, abandon) | relancer |
| `reponse_inattendue` | une réponse que le contrat ne décrit pas | ouvrir une issue |

Règle du retry : relancez sur `quota_atteint` (en respectant `retryAfterSeconds`), `reseau` et
`analyse_indisponible`. Un verdict `invalide` ou `a_verifier` décrit le fond : réessayer ne le
changera pas.

### Options

```ts
new MaFactureOK({
  cle: "mfok_live_…",                   // requis
  baseUrl: "https://mafactureok.com",  // autre instance
  timeoutMs: 60_000,                   // délai par appel
  fetch: globalThis.fetch,             // fetch de remplacement (tests, proxy)
});
await client.valider(fichier, { signal: AbortSignal.timeout(10_000) });
```

## Ligne de commande

```bash
mafactureok valider facture.pdf autre.xml     # un rapport lisible par fichier
mafactureok valider facture.pdf --json         # une ligne JSON par fichier
mafactureok tiers 456500537 897865184          # SIREN ou SIRET
mafactureok moi                                # plan, quotas, usage
```

La clé vient de `--cle` ou de la variable `MAFACTUREOK_CLE`. Codes de sortie de `valider` :
0 valide, 1 a_verifier, 2 invalide, 3 non_analyse, 4 erreur (le pire des fichiers), pratiques
dans un script ou une CI.

## Python, curl, Make, n8n

Pas besoin du SDK : l'API est un simple POST du fichier. `examples/python/valider.py` le fait
avec `requests` en quinze lignes, `examples/curl.sh` avec curl, et
[mafactureok.com/api/tutoriel-make](https://mafactureok.com/api/tutoriel-make) montre le nœud
HTTP de Make. Le contrat OpenAPI permet de générer un client dans n'importe quel langage.

## Exemples et vérification continue

`examples/factures/` contient six factures entièrement synthétiques (trois valides, trois
invalides avec une mutation volontaire chacune) et `examples/resultats/` leurs rapports produits
par le moteur réel. `node scripts/live-check.mjs` rejoue les six sur l'instance en production
et compare verdicts et règles bloquantes à `examples/attendus.json` ; le workflow
`contract-live.yml` le fait chaque semaine.

## Ce que le service fait et ne fait pas

MaFactureOK est un pré-contrôle technique et métier avant dépôt : il n'est pas une plateforme
agréée, ne transmet aucune facture, ne prouve pas la réalité d'une prestation, ne détermine pas
le taux de TVA applicable et ne délivre aucune certification juridique. Confidentialité :
[mafactureok.com/confidentialite](https://mafactureok.com/confidentialite).

## Contribuer

Issues et pull requests bienvenues : voir `CONTRIBUTING.md`. Vulnérabilité : `SECURITY.md`.
Support : support@mafactureok.com.
