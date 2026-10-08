# Exemples

## Factures (`factures/`)

Six factures électroniques entièrement synthétiques, créées pour la démonstration : noms,
adresses et contacts fictifs, domaines `example.invalid`, identifiants numériques issus du
jeu d'exemple public FNFE. Aucune valeur commerciale, fiscale ou juridique.

| Fichier | Format | Résultat attendu | Mutation volontaire |
| --- | --- | --- | --- |
| `valide/ubl-invoice-valid.xml` | UBL 2.1 EN16931 | valide | aucune |
| `valide/cii-invoice-valid.xml` | CII D22B EN16931 | valide | aucune |
| `valide/facturx-valide.pdf` | Factur-X 1.09.2 EN16931 (PDF/A-3b) | valide | aucune |
| `invalide/ubl-invoice-invalid-payable-total.xml` | UBL 2.1 | invalide | BT-115 vaut 1199 au lieu de 1200 (BR-CO-16) |
| `invalide/cii-invoice-invalid-payable-total.xml` | CII D22B | invalide | BT-115 vaut 1199 au lieu de 1200 (BR-CO-16) |
| `invalide/facturx-invalide.pdf` | Factur-X 1.09.2 | invalide | SIREN et TVA vendeur absents, cadre de facturation absent, adresses électroniques absentes, total TTC 750 au lieu de 720 |

Sur une instance réelle, les fichiers « valides » peuvent ressortir `a_verifier` : leurs
SIREN de démonstration n'existent pas au registre officiel, ce que le rapport signale dans
`entreprises`. C'est voulu, et `attendus.json` l'admet.

## Rapports enregistrés (`resultats/`)

Un rapport par facture, produit par le moteur réel (références FNFE France RFE 1.4.0.03,
EN 16931, Factur-X 1.09.2, UBL 2.1, CII D22B), vérification des entreprises désactivée.
Ils servent de fixtures aux tests du SDK et montrent la forme exacte du contrat.

## Code

- `typescript/` : un fichier, un dossier, des tiers (`npx tsx <fichier>.ts`).
- `python/valider.py` : la même validation avec `requests`, sans SDK.
- `curl.sh` : les trois endpoints en ligne de commande.
- `node scripts/live-check.mjs` (à la racine) rejoue les six factures sur l'instance réelle et
  compare verdicts et règles bloquantes à `attendus.json`.
