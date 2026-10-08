# Security

Report a vulnerability in this SDK or in the MaFactureOK service to
**support@mafactureok.com**. Please do not open a public issue for it. You will get an
acknowledgement within five working days.

Scope reminders:

- the SDK sends your API key as `Authorization: Bearer` to `https://mafactureok.com` only
  (or to the `baseUrl` you set); it never logs the key or the invoice;
- keys are free and revocable: requesting a new one on https://mafactureok.com/api revokes the
  previous ones for the same email;
- never commit a key. The repository's pre-commit hook and `scripts/check-hygiene.sh` reject
  anything shaped like a live key.
