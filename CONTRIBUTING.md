# Contributing

```bash
nvm use            # Node 24 for development; the package supports Node >= 20
npm install        # also installs the git hooks (core.hooksPath = .githooks)
npm run typecheck
npm test           # build + node --test
npm run check:hygiene
```

- The public API contract is owned by the service. `npm run sync:contract` copies it from the
  application checkout (`MAFACTUREOK_APP_DIR`) and regenerates `src/generated/openapi.ts`;
  never edit that file by hand.
- Keep the SDK dependency-free. Everything runs on `fetch` and `node:fs`.
- Commit messages: one line, imperative, no body, no trailer, no AI attribution. The
  `commit-msg` hook enforces it. Commits are authored as the project identity
  (`contact@mafactureok.com`), enforced by the `pre-commit` hook.
- Never add a real invoice to the repository, even for a test: the six synthetic files under
  `examples/factures/` are the only documents allowed.
- Releases: bump `package.json` and `src/version.ts`, add a `CHANGELOG.md` entry, tag `vX.Y.Z`
  and push the tag; `release.yml` publishes to npm with provenance.
