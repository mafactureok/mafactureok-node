# MaFactureOK SDK : valider une facture électronique (Factur-X, UBL, CII) en Node.js

[![npm](https://img.shields.io/npm/v/%40mafactureok%2Fsdk)](https://www.npmjs.com/package/@mafactureok/sdk)
[![CI](https://github.com/mafactureok/mafactureok-node/actions/workflows/ci.yml/badge.svg)](https://github.com/mafactureok/mafactureok-node/actions/workflows/ci.yml)
[![Licence MIT](https://img.shields.io/badge/licence-MIT-blue.svg)](LICENSE)
[![Node.js 20+](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)

SDK Node.js, ligne de commande et exemples open source pour **[MaFactureOK](https://mafactureok.com)**, le
**validateur gratuit de factures électroniques françaises**. Il contrôle un fichier **Factur-X**, **UBL 2.1** ou
**CII D22B** contre la norme **EN 16931** et les règles françaises **FNFE France RFE** (BR-FR), puis vérifie les
entreprises de la facture : **SIREN et SIRET au registre officiel**, **numéro de TVA intracommunautaire** (VIES).
Une clé d'API gratuite, une ligne de commande, un rapport en français avec la correction de chaque anomalie.

**[Site mafactureok.com](https://mafactureok.com)** ·
[Documentation de l'API](https://mafactureok.com/api) ·
[Obtenir une clé d'API gratuite](https://mafactureok.com/api) ·
[Contrat OpenAPI 3.1](https://mafactureok.com/api/public/v1/openapi.json) ·
[Vérifier une facture électronique en ligne](https://mafactureok.com/facture-recue) ·
[Vérifier un SIRET](https://mafactureok.com/verifier-siret) ·
[Vérifier un numéro de TVA intracommunautaire](https://mafactureok.com/verifier-tva-intracommunautaire) ·
[Codes de rejet des factures électroniques](https://mafactureok.com/codes-rejet) ·
[Plateformes agréées](https://mafactureok.com/plateformes-agreees) ·
[Blog facturation électronique](https://mafactureok.com/blog)

## Sommaire

- [MaFactureOK, le produit : tout ce que fait le service](#mafactureok-le-produit--tout-ce-que-fait-le-service)
- [Pourquoi valider une facture électronique avant de l'envoyer](#pourquoi-valider-une-facture-électronique-avant-de-lenvoyer)
- [Valider une facture Factur-X en une ligne de commande](#valider-une-facture-factur-x-en-une-ligne-de-commande)
- [Installer le SDK Node.js](#installer-le-sdk-nodejs)
- [Valider une facture depuis TypeScript ou JavaScript](#valider-une-facture-depuis-typescript-ou-javascript)
- [Vérifier un SIREN, un SIRET ou un numéro de TVA avant de facturer](#vérifier-un-siren-un-siret-ou-un-numéro-de-tva-avant-de-facturer)
- [Gérer les erreurs et les quotas](#gérer-les-erreurs-et-les-quotas)
- [Ligne de commande mafactureok](#ligne-de-commande-mafactureok)
- [Python, curl, Make, n8n : l'API sans SDK](#python-curl-make-n8n--lapi-sans-sdk)
- [Exemples de factures Factur-X, UBL et CII](#exemples-de-factures-factur-x-ubl-et-cii)
- [Questions fréquentes](#questions-fréquentes)
- [English: Factur-X, UBL and CII invoice validation API for France](#english-factur-x-ubl-and-cii-invoice-validation-api-for-france)

## MaFactureOK, le produit : tout ce que fait le service

[MaFactureOK](https://mafactureok.com) est un service en ligne gratuit, sans compte, qui vérifie une facture
électronique **en deux temps** : le fichier est-il une facture électronique valide, et l'entreprise qui facture
existe-t-elle vraiment. Aucune facture n'est conservée. Ce SDK en est la version programmable ; voici l'ensemble du
produit tel qu'il est utilisable sur le site.

| Besoin | Ce que fait MaFactureOK | Sur le site |
| --- | --- | --- |
| **J'ai reçu une facture** | Dépôt du fichier Factur-X, UBL ou CII : verdict, anomalies expliquées en français avec la correction attendue et l'emplacement (BT/BG), puis contrôle du fournisseur au registre officiel (actif, cessé, introuvable, nom et adresse cohérents) et de son numéro de TVA (VIES). | [Vérifier une facture reçue](https://mafactureok.com/facture-recue) |
| **J'en ai plusieurs** | Lot de factures (jusqu'à 10 fichiers, 60 Mo) avec un rapport de synthèse par lot, exportable. | [Vérifier une facture reçue](https://mafactureok.com/facture-recue) |
| **Je veux le fichier corrigé** | Quand les corrections sont dérivables (totaux, mentions), MaFactureOK propose le XML corrigé, à revalider avant envoi. Validation et correction restent deux actes distincts. | [Demander une facture corrigée](https://mafactureok.com/facture-recue) |
| **Je prépare une facture** | Vérifier un client avant de facturer (SIREN, SIRET, TVA intracommunautaire), et la liste de ce que la facture doit contenir : les quatre mentions nouvelles depuis le 1er septembre 2026, les montants tels que l'administration les attend, les mentions légales habituelles. | [Vérifier un client avant de facturer](https://mafactureok.com/preparer-une-facture) |
| **Tout mon portefeuille clients** | Import d'un export .xlsx ou .csv (lu dans le navigateur) et vérification des identifiants en masse : cessés, introuvables, TVA invalide, à corriger. | [Vérifier un portefeuille clients](https://mafactureok.com/preparer-une-facture) |
| **Ma facture a été rejetée** | Comprendre le message de rejet, la différence entre rejetée, refusée et en attente, et ce qu'il faut faire (corriger et renvoyer, ou émettre un avoir). | [Facture rejetée : que faire ?](https://mafactureok.com/facture-rejetee) · [Codes de rejet](https://mafactureok.com/codes-rejet) |
| **Mon PDF n'est pas encore une facture électronique** | Conversion d'un PDF classique en Factur-X : analyse du PDF, brouillon éditable, génération du PDF/A-3 avec XML embarqué, revalidé par le même moteur. | [Convertir un PDF en Factur-X](https://mafactureok.com/pdf-vers-factur-x) |
| **Un identifiant à vérifier** | Vérification unitaire d'un SIRET ou d'un numéro de TVA intracommunautaire. | [Vérifier un SIRET](https://mafactureok.com/verifier-siret) · [Vérifier une TVA intracommunautaire](https://mafactureok.com/verifier-tva-intracommunautaire) |
| **Choisir sa plateforme agréée** | La liste officielle des plateformes agréées (ex-PDP) publiée par la DGFiP, consultable par nom et triable par date, avec une fiche par plateforme. | [Plateformes agréées](https://mafactureok.com/plateformes-agreees) |
| **Comprendre** | Ce que nous vérifions et ce que nous ne vérifions pas, exemples de factures commentés, glossaire de la facture électronique, questions fréquentes, guides du blog (mentions obligatoires 2026, TPE et micro-entreprises, avoirs, piste d'audit fiable, Chorus Pro). | [Ce que nous vérifions](https://mafactureok.com/ce-que-nous-verifions) · [Exemples](https://mafactureok.com/exemples) · [Glossaire](https://mafactureok.com/glossaire) · [FAQ](https://mafactureok.com/faq) · [Blog](https://mafactureok.com/blog) |
| **Automatiser** | API publique avec clé gratuite, ce SDK Node.js et sa ligne de commande, tutoriel Make et n8n, serveur MCP pour ChatGPT, Claude et les clients compatibles. | [API](https://mafactureok.com/api) · [Make et n8n](https://mafactureok.com/api/tutoriel-make) · [Serveur MCP](https://mafactureok.com/serveur-mcp) |

Ce que MaFactureOK ne fait pas, volontairement : il n'est pas une plateforme agréée et ne transmet aucune
facture, ne prouve pas la réalité d'une livraison ou d'une prestation, ne détermine pas le taux de TVA applicable à
une opération, ne vérifie pas la propriété d'un IBAN ni la solvabilité d'un fournisseur, et ne délivre aucune
certification juridique.

## Pourquoi valider une facture électronique avant de l'envoyer

La réforme de la **facturation électronique** impose aux entreprises françaises de recevoir, puis d'émettre, des
factures aux formats structurés Factur-X, UBL ou CII via une **plateforme agréée** (anciennement PDP). Une facture
mal formée ou incohérente est **rejetée** par la plateforme, avec un [code de rejet](https://mafactureok.com/codes-rejet)
qu'il faut comprendre, corriger, puis renvoyer. MaFactureOK est un **pré-contrôle technique et métier avant dépôt** :
il reproduit les contrôles de forme (XSD, schématrons EN 16931, règles BR-FR, conteneur PDF/A-3 pour Factur-X) et y
ajoute ce que le format seul ne dit pas : le fournisseur existe-t-il, est-il encore actif, son numéro de TVA est-il
valide. Le service n'est pas une plateforme agréée et ne transmet aucune facture ; il vous dit, avant, ce qui sera
refusé et comment le corriger. Détail des contrôles :
[ce que MaFactureOK vérifie](https://mafactureok.com/ce-que-nous-verifions).

Ce dépôt contient le SDK Node.js officiel, la ligne de commande, les types TypeScript générés depuis le
[contrat OpenAPI](https://mafactureok.com/api/public/v1/openapi.json), six factures d'exemple et leurs rapports.
Sans dépendance, ESM, Node.js 20 ou plus, licence MIT.

## Valider une facture Factur-X en une ligne de commande

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

La clé d'API est **gratuite et immédiate** : saisissez votre email sur
[mafactureok.com/api](https://mafactureok.com/api), elle arrive par email et reste stable. Le fichier est analysé
puis supprimé par le service, jamais conservé ni journalisé
([politique de confidentialité](https://mafactureok.com/confidentialite)).

## Installer le SDK Node.js

```bash
npm install @mafactureok/sdk
```

## Valider une facture depuis TypeScript ou JavaScript

```ts
import { MaFactureOK, MaFactureOKError } from "@mafactureok/sdk";
import { readFile } from "node:fs/promises";

const client = new MaFactureOK({ cle: process.env.MAFACTUREOK_CLE! });

const rapport = await client.valider(await readFile("facture.pdf"));
// ou : await client.valider({ chemin: "facture.pdf" }) ; un Blob ou un ArrayBuffer conviennent aussi
console.log(rapport.verdict);              // "valide" | "a_verifier" | "invalide" | "non_analyse"
for (const a of rapport.anomalies) {
  console.log(a.gravite, a.titre, a.ou, a.correction, a.regles);   // ex. "bloquante", …, "BT-115", …, ["BR-CO-16"]
}
for (const e of rapport.entreprises ?? []) {
  console.log(e.role, e.etat, e.tva, e.signaux);                   // registre officiel + VIES
}
console.log(rapport.quota);                // { limite: 100, restant: 99 }
```

Le rapport (`ValiderFactureDigest`) est le même que celui du site, sous forme de données : verdict, titre et
description en français, format et profil détectés, référentiels appliqués (FNFE France RFE 1.4.0.03, EN 16931,
Factur-X 1.09.2, UBL 2.1, CII D22B), anomalies avec gravité, sens, correction, valeur proposée, emplacement
(terme métier BT/BG) et règles concernées, état des entreprises. Schéma JSON :
`contracts/valider-facture-v1.schema.json`.

## Vérifier un SIREN, un SIRET ou un numéro de TVA avant de facturer

```ts
const { resultats } = await client.verifierTiers(["456500537", "897865184"]);
for (const r of resultats) {
  // r.signal : "ok" | "avertissement" | "alerte" | "indetermine" ; r.etat : actif, cesse, inconnu, …
  console.log(r.identifiant, r.signal, r.etat, r.raison_sociale, r.tva?.statut, r.action);
}
```

Chaque identifiant revient avec son existence au registre officiel, son état (actif, cessé, établissement fermé,
diffusion restreinte), la raison sociale et l'adresse officielles, le numéro de TVA et son statut VIES, et un
`signal` prêt à router dans une automatisation. `indetermine` est le seul cas où relancer a un sens. Les mêmes
vérifications existent en ligne : [vérifier un SIRET](https://mafactureok.com/verifier-siret),
[vérifier une TVA intracommunautaire](https://mafactureok.com/verifier-tva-intracommunautaire),
[vérifier un client avant de facturer](https://mafactureok.com/preparer-une-facture).

## Gérer les erreurs et les quotas

Toute réponse hors contrat lève une `MaFactureOKError` dont `code` dit ce qui s'est passé :

| `code` | Quand | À faire |
| --- | --- | --- |
| `cle_invalide` | clé absente, mal formée, révoquée ou inconnue (HTTP 401) | vérifier la clé ; en redemander une sur [/api](https://mafactureok.com/api) |
| `quota_atteint` | quota du jour épuisé (429) | attendre `retryAfterSeconds` |
| `fichier_trop_grand` | plus de 15 Mo (413) | |
| `fichier_vide` | corps vide (400) | |
| `analyse_indisponible` | le moteur n'a pas répondu (502) ; `rapport` contient un digest `non_analyse` | relancer plus tard |
| `reseau` | pas de réponse HTTP (DNS, connexion, délai `timeoutMs`, abandon) | relancer |
| `reponse_inattendue` | une réponse que le contrat ne décrit pas | ouvrir une issue |

Quotas de la bêta gratuite : 100 validations et 200 identifiants vérifiés par jour et par clé, lisibles à tout
moment avec `client.moi()` (hors quota) et dans les en-têtes `x-quota-limit` / `x-quota-remaining`. Règle du
retry : relancez sur `quota_atteint` (en respectant `retryAfterSeconds`), `reseau` et `analyse_indisponible` ; un
verdict `invalide` ou `a_verifier` décrit le fond, réessayer ne le changera pas.

Options du client :

```ts
new MaFactureOK({
  cle: "mfok_live_…",                   // requis
  baseUrl: "https://mafactureok.com",  // autre instance
  timeoutMs: 60_000,                   // délai par appel
  fetch: globalThis.fetch,             // fetch de remplacement (tests, proxy)
});
await client.valider(fichier, { signal: AbortSignal.timeout(10_000) });
```

## Ligne de commande mafactureok

```bash
mafactureok valider facture.pdf autre.xml     # un rapport lisible par fichier
mafactureok valider facture.pdf --json         # une ligne JSON par fichier, pour vos scripts
mafactureok tiers 456500537 897865184          # SIREN ou SIRET
mafactureok moi                                # plan, quotas, usage
```

La clé vient de `--cle` ou de la variable `MAFACTUREOK_CLE`. Codes de sortie de `valider` : 0 valide,
1 a_verifier, 2 invalide, 3 non_analyse, 4 erreur (le pire des fichiers), pratiques dans un script, un hook de
pré-envoi ou une intégration continue.

## Python, curl, Make, n8n : l'API sans SDK

L'API est un simple POST du fichier avec l'en-tête `Authorization: Bearer`. `examples/python/valider.py` le fait
avec `requests` en quinze lignes, `examples/curl.sh` avec curl, et le
[tutoriel Make et n8n](https://mafactureok.com/api/tutoriel-make) montre le nœud HTTP pas à pas. Le contrat OpenAPI
permet de générer un client dans n'importe quel langage. Pour ChatGPT, Claude et les clients compatibles, le
[serveur MCP de MaFactureOK](https://mafactureok.com/serveur-mcp) expose les mêmes vérifications sans clé.

## Exemples de factures Factur-X, UBL et CII

`examples/factures/` contient six factures entièrement synthétiques, trois valides et trois invalides avec une
mutation volontaire chacune (BR-CO-16, mentions BR-FR manquantes, total TTC faux), et `examples/resultats/` leurs
rapports produits par le moteur réel. `node scripts/live-check.mjs` rejoue les six sur l'instance en production
et compare verdicts et règles bloquantes à `examples/attendus.json` ; le workflow `contract-live.yml` le fait
chaque semaine. D'autres exemples commentés sont sur le site :
[exemples de factures électroniques](https://mafactureok.com/exemples).

## Questions fréquentes

**MaFactureOK est-il une plateforme agréée ?** Non. C'est un pré-contrôle avant dépôt : il ne transmet aucune
facture et ne remplace pas la [plateforme agréée](https://mafactureok.com/plateformes-agreees) que vous choisissez.

**Quels formats de facture électronique sont acceptés ?** Factur-X (PDF/A-3 avec XML CII embarqué, profils
EN16931 et au-delà), UBL 2.1 et CII D22B en XML natif. ZUGFeRD étant le jumeau allemand de Factur-X, un fichier
ZUGFeRD est lu de la même façon ; seules les règles françaises BR-FR lui seront spécifiques.

**Quelles règles sont vérifiées ?** Les schémas XSD, les schématrons EN 16931, les règles françaises FNFE France
RFE (BR-FR, référentiel 1.4.0.03 épinglé), la conformité PDF/A-3 du conteneur Factur-X, puis les contrôles
d'entreprise (registre officiel, VIES). Liste détaillée : [ce que nous vérifions](https://mafactureok.com/ce-que-nous-verifions).

**Que signifie le code de rejet que j'ai reçu ?** Le site explique chaque code et la règle BR associée :
[codes de rejet](https://mafactureok.com/codes-rejet), et la page
[comprendre un rejet de facture](https://mafactureok.com/facture-rejetee).

**Mes factures sont-elles conservées ?** Non. Le fichier est analysé puis supprimé, il n'est ni stocké ni
journalisé. Seuls un compteur d'usage et la date de dernière utilisation sont associés à la clé.
[Politique de confidentialité](https://mafactureok.com/confidentialite).

**Combien ça coûte ?** Le service est gratuit en bêta, avec les quotas indiqués plus haut.

**Puis-je convertir un PDF classique en Factur-X ?** Oui, en ligne :
[convertir un PDF en Factur-X](https://mafactureok.com/pdf-vers-factur-x).

**Et les nouvelles mentions obligatoires ?** Le [blog](https://mafactureok.com/blog) suit la réforme : mentions
obligatoires 2026, facture électronique pour les TPE et micro-entreprises, avoirs, piste d'audit fiable.

## English: Factur-X, UBL and CII invoice validation API for France

**MaFactureOK** is a free online **e-invoicing validator for France**. This repository is its official
**Node.js SDK and CLI**: validate a **Factur-X** (ZUGFeRD-compatible), **UBL 2.1** or **CII D22B** invoice against
**EN 16931** and the French **FNFE France RFE** business rules (BR-FR), check the PDF/A-3 container, and verify
the companies on the invoice against the official French business registry (**SIREN / SIRET**) and **VIES VAT**
validation. One free API key, one command, a structured report that names every failing rule (`BR-CO-16`,
`BR-FR-10`, …) with its business term (`BT-115`) and the fix. The service analyses the file and discards it;
nothing is stored. It is a pre-submission check, not an accredited platform (PDP).

```bash
MAFACTUREOK_CLE=mfok_live_your_key npx @mafactureok/sdk valider invoice.pdf
```

The API and its reports are in French (`verdict`, `anomalies`, `correction`), the types are generated from the
[OpenAPI 3.1 contract](https://mafactureok.com/api/public/v1/openapi.json). Get a key and read the docs at
[mafactureok.com/api](https://mafactureok.com/api).

## Contribuer

Issues et pull requests bienvenues : voir `CONTRIBUTING.md`. Vulnérabilité : `SECURITY.md`.
Support : support@mafactureok.com.
