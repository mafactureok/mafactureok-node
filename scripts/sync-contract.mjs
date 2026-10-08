// Copies the public API contract from the application repository and
// regenerates the TypeScript types. The application repository is private;
// set MAFACTUREOK_APP_DIR to its checkout (default: ../factureValidator).
import { copyFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";

const app = process.env.MAFACTUREOK_APP_DIR ?? join(process.cwd(), "..", "factureValidator");
for (const name of ["openapi-public-v1.json", "valider-facture-v1.schema.json"]) {
  const source = join(app, "contracts", name);
  if (!existsSync(source)) {
    console.error(`sync-contract: ${source} not found (set MAFACTUREOK_APP_DIR).`);
    process.exit(1);
  }
  copyFileSync(source, join(process.cwd(), "contracts", name));
  console.log(`copied ${name}`);
}
execSync("npm run --silent generate:types", { stdio: "inherit" });
