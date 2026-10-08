#!/usr/bin/env sh
# Validate one invoice and check two identifiers with curl.
#   MAFACTUREOK_CLE=mfok_live_... sh curl.sh factures/invalide/facturx-invalide.pdf
set -eu
: "${MAFACTUREOK_CLE:?clé gratuite sur https://mafactureok.com/api}"
BASE="${MAFACTUREOK_BASE_URL:-https://mafactureok.com}"
FICHIER="${1:-factures/invalide/facturx-invalide.pdf}"

curl -sS -D - -X POST "$BASE/api/public/v1/valider-facture" \
  -H "Authorization: Bearer $MAFACTUREOK_CLE" \
  -H "Content-Type: application/octet-stream" \
  --data-binary @"$FICHIER"
echo
curl -sS -X POST "$BASE/api/public/v1/verifier-tiers" \
  -H "Authorization: Bearer $MAFACTUREOK_CLE" \
  -H "Content-Type: application/json" \
  -d '{ "identifiants": ["456500537", "897865184"] }'
echo
curl -sS "$BASE/api/public/v1/moi" -H "Authorization: Bearer $MAFACTUREOK_CLE"
echo
