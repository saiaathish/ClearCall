import assert from "node:assert/strict";
import test from "node:test";
import {
  DEMO_CASE_ID,
  DEMO_COMPARISON_CASE_ID,
  refereeCases,
} from "../src/data/referee-cases.ts";
import type { RefereeCase } from "../src/domain/referee-case.ts";
import { validateRefereeCases } from "../src/validation/referee-case-validator.ts";

function cloneCases(): RefereeCase[] {
  return structuredClone(refereeCases) as unknown as RefereeCase[];
}

const typedCases: readonly RefereeCase[] = refereeCases;

function messages(cases: unknown): string[] {
  return validateRefereeCases(cases).map(
    ({ path, message }) => `${path}: ${message}`,
  );
}

test("all seeded referee cases satisfy the runtime schema", () => {
  assert.deepEqual(validateRefereeCases(refereeCases), []);
});

test("issue #13 cardinality and fixed values are preserved", () => {
  assert.equal(typedCases.length, 10);
  for (const refereeCase of typedCases) {
    assert.equal(refereeCase.schemaVersion, 1);
    assert.equal(refereeCase.sport, "soccer");
    assert.equal(refereeCase.incidentCategory, "handball");
    assert.equal(refereeCase.difficulty, "hard");
    assert.equal(refereeCase.recommendedOutcome.restart, "penalty-kick");
    assert.equal(refereeCase.ruleSource.edition, "2026/27");
    assert.equal(refereeCase.ruleSource.law, "Law 12 — Fouls and Misconduct");
  }
});

test("case IDs, fingerprints, and titles are unique", () => {
  assert.equal(new Set(typedCases.map(({ id }) => id)).size, typedCases.length);
  assert.equal(
    new Set(typedCases.map(({ scenarioFingerprint }) => scenarioFingerprint))
      .size,
    typedCases.length,
  );
  assert.equal(
    new Set(typedCases.map(({ title }) => title)).size,
    typedCases.length,
  );
});

test("every related case exists and links back", () => {
  const byId = new Map(
    typedCases.map((refereeCase) => [refereeCase.id, refereeCase]),
  );
  for (const refereeCase of typedCases) {
    for (const relatedId of refereeCase.relatedCaseIds) {
      const related = byId.get(relatedId);
      assert.ok(
        related,
        `${refereeCase.id} references unknown case ${relatedId}`,
      );
      assert.ok(
        related.relatedCaseIds.includes(refereeCase.id),
        `${relatedId} does not link back to ${refereeCase.id}`,
      );
    }
  }
});

test("demo and comparison fixtures support the issue #17 reveal", () => {
  const demo = typedCases.find(({ id }) => id === DEMO_CASE_ID);
  const comparison = typedCases.find(
    ({ id }) => id === DEMO_COMPARISON_CASE_ID,
  );
  assert.ok(demo);
  assert.ok(comparison);
  assert.equal(demo.recommendedDecisionCode, "penalty-red-card");
  assert.equal(
    demo.seededDistributions.community.counts["penalty-red-card"],
    55,
  );
  assert.equal(
    demo.seededDistributions.verifiedReferees.counts["penalty-red-card"],
    82,
  );
  assert.ok(demo.relatedCaseIds.includes(comparison.id));
});

test("all fixture distributions are visibly simulated and sum to 100", () => {
  for (const refereeCase of typedCases) {
    assert.equal(
      refereeCase.seededDistributions.provenance,
      "synthetic-demo-fixture",
    );
    assert.match(refereeCase.seededDistributions.disclaimer, /not live/i);
    assert.match(
      refereeCase.seededDistributions.disclaimer,
      /not an expert survey/i,
    );
    for (const cohort of [
      refereeCase.seededDistributions.community,
      refereeCase.seededDistributions.verifiedReferees,
    ]) {
      assert.match(cohort.cohortLabel, /simulated/i);
      assert.equal(
        Object.values(cohort.counts).reduce((total, count) => total + count, 0),
        cohort.sampleSize,
      );
    }
  }
});

test("uncreated media never claims a path, URL, or authorization", () => {
  for (const refereeCase of typedCases) {
    assert.equal(refereeCase.media.assetStatus, "recording-required");
    assert.equal(refereeCase.media.authorizationStatus, "not-created");
    assert.equal(refereeCase.media.localPath, null);
    assert.equal(refereeCase.media.sourceUrl, null);
  }
});

test("validator rejects a duplicate ID", () => {
  const cases = cloneCases();
  cases[1]!.id = cases[0]!.id;
  assert.ok(
    messages(cases).some((message) => message.includes("must be unique")),
  );
});

test("validator rejects a dangling related-case ID", () => {
  const cases = cloneCases();
  cases[0]!.relatedCaseIds = ["soccer-handball-999"];
  assert.ok(
    messages(cases).some((message) =>
      message.includes("references missing case"),
    ),
  );
});

test("validator rejects unlabeled or invalid demo statistics", () => {
  const cases = cloneCases();
  cases[0]!.seededDistributions.disclaimer = "Real responses.";
  (cases[0]!.seededDistributions.community.counts as Record<string, number>)[
    "penalty-red-card"
  ] = 54;
  const validationMessages = messages(cases);
  assert.ok(validationMessages.some((message) => message.includes("not live")));
  assert.ok(
    validationMessages.some((message) => message.includes("sum to sampleSize")),
  );
});

test("validator rejects uncreated media represented as ready", () => {
  const cases = cloneCases();
  cases[0]!.media.assetStatus = "authorized-local";
  cases[0]!.media.authorizationStatus = "team-owned";
  assert.ok(
    messages(cases).some((message) =>
      message.includes("must provide a path or URL"),
    ),
  );
});
