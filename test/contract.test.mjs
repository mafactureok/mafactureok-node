import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";

const schema = JSON.parse(readFileSync(new URL("../contracts/valider-facture-v1.schema.json", import.meta.url), "utf8"));
const openapi = JSON.parse(readFileSync(new URL("../contracts/openapi-public-v1.json", import.meta.url), "utf8"));
const attendus = JSON.parse(readFileSync(new URL("../examples/attendus.json", import.meta.url), "utf8"));

/** Minimal structural check (no validator dependency): required keys, enums, closed objects. */
function check(value, node, path = "$") {
  if (node.const !== undefined) assert.equal(value, node.const, path);
  if (node.enum !== undefined) assert.ok(node.enum.includes(value), `${path} = ${value}`);
  const types = Array.isArray(node.type) ? node.type : node.type === undefined ? [] : [node.type];
  if (types.length > 0) {
    const actual = value === null ? "null" : Array.isArray(value) ? "array" : Number.isInteger(value) && types.includes("integer") ? "integer" : typeof value;
    assert.ok(types.includes(actual), `${path}: ${actual} not in ${types}`);
  }
  if (node.type === "object") {
    for (const key of node.required ?? []) assert.ok(key in value, `${path}.${key} missing`);
    for (const [key, child] of Object.entries(value)) {
      const prop = node.properties?.[key];
      if (prop === undefined) assert.notEqual(node.additionalProperties, false, `${path}.${key} not in contract`);
      else check(child, prop, `${path}.${key}`);
    }
  }
  if (node.type === "array") value.forEach((item, i) => check(item, node.items, `${path}[${i}]`));
}

test("every recorded example report conforms to the published digest schema", () => {
  const dir = new URL("../examples/resultats/", import.meta.url);
  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  assert.equal(files.length, 6);
  for (const f of files) check(JSON.parse(readFileSync(new URL(f, dir), "utf8")), schema, f);
});

test("the OpenAPI document embeds the same digest schema and every expected example exists", () => {
  const { $schema: _s, $id: _i, ...component } = schema;
  assert.deepEqual(openapi.components.schemas.ValiderFactureDigest, component);
  for (const item of attendus.fichiers) {
    readFileSync(new URL(`../examples/factures/${item.fichier}`, import.meta.url));
    assert.ok(Array.isArray(item.verdicts) && item.verdicts.length > 0, item.fichier);
  }
});
