import { readFile } from "node:fs/promises";
import { refereeCases } from "../src/data/referee-cases.ts";
import { assertValidRefereeCases } from "../src/validation/referee-case-validator.ts";

const STORYLINE_PATH = new URL("../docs/DEMO_STORYLINE.md", import.meta.url);

assertValidRefereeCases(refereeCases);

const storyline = await readFile(STORYLINE_PATH, "utf8");
const caseIds = new Set<string>(refereeCases.map(({ id }) => id));
const referencedIds = storyline.match(/soccer-handball-\d{3}/g) ?? [];

if (referencedIds.length === 0) {
  throw new Error("Demo storyline must reference at least one seeded case ID.");
}

for (const id of referencedIds) {
  if (!caseIds.has(id)) {
    throw new Error(`Demo storyline references unknown seeded case ID: ${id}`);
  }
}

console.log(
  `Validated ${refereeCases.length} referee cases and ${new Set(referencedIds).size} storyline case references.`,
);
