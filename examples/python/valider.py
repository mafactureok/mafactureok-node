"""Validate one invoice with the MaFactureOK API from Python (requests only).

    pip install requests
    MAFACTUREOK_CLE=mfok_live_... python valider.py facture.pdf
"""
import json
import os
import sys

import requests

BASE_URL = os.environ.get("MAFACTUREOK_BASE_URL", "https://mafactureok.com")
CLE = os.environ.get("MAFACTUREOK_CLE", "")
if not CLE:
    sys.exit("MAFACTUREOK_CLE manquante : clé gratuite sur https://mafactureok.com/api")

chemin = sys.argv[1] if len(sys.argv) > 1 else "../factures/invalide/ubl-invoice-invalid-payable-total.xml"
with open(chemin, "rb") as f:
    reponse = requests.post(
        f"{BASE_URL}/api/public/v1/valider-facture",
        headers={"Authorization": f"Bearer {CLE}", "Content-Type": "application/octet-stream"},
        data=f.read(),
        timeout=60,
    )

if reponse.status_code == 429:
    sys.exit(f"Quota atteint, réessayez dans {reponse.headers.get('Retry-After')} s")
if reponse.status_code == 401:
    sys.exit("Clé invalide : " + reponse.json().get("detail", ""))
reponse.raise_for_status()

rapport = reponse.json()
print(f"{rapport['verdict']} : {rapport['titre']}")
for anomalie in rapport["anomalies"]:
    print(f"- [{anomalie['gravite']}] {anomalie['titre']} ({anomalie['ou']}) : {anomalie['correction']}")
for entreprise in rapport.get("entreprises", []):
    print(f"- {entreprise['role']} : {entreprise['etat']}, TVA {entreprise['tva']}")
if "X-Quota-Remaining" in reponse.headers:
    print(f"{reponse.headers['X-Quota-Remaining']}/{reponse.headers['X-Quota-Limit']} validations restantes aujourd'hui")
sys.exit({"valide": 0, "a_verifier": 1, "invalide": 2, "non_analyse": 3}[rapport["verdict"]])
