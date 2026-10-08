# Python

Pas de paquet PyPI pour l'instant : l'API HTTP se consomme en quinze lignes avec `requests`
(`valider.py`). Même contrat, mêmes codes et mêmes en-têtes que le SDK Node.js ; le fichier est
envoyé tel quel en corps binaire. Types et schéma : `contracts/openapi-public-v1.json`
(OpenAPI 3.1), exploitable avec `openapi-python-client` si vous voulez un client généré.

```bash
pip install requests
MAFACTUREOK_CLE=mfok_live_... python valider.py ../factures/invalide/facturx-invalide.pdf
```

Codes de sortie : 0 valide, 1 a_verifier, 2 invalide, 3 non_analyse.
