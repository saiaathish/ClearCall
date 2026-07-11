import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateAttempt,
  mapStoredVoteToDecisionAttempt,
  summarizeCalibration,
} from "../src/ai/index.ts";
import type { DecisionAttempt } from "../src/ai/types.ts";

function attempt(overrides: Partial<DecisionAttempt> = {}): DecisionAttempt {
  return {
    caseId: "case-1",
    incidentCategory: "handball",
    selectedDecision: "penalty-no-card",
    recommendedDecision: "penalty-no-card",
    confidence: 80,
    ...overrides,
  };
}

test("evaluates a correct answer with 95% confidence", () => {
  const result = evaluateAttempt(attempt({ confidence: 95 }));
  assert.equal(result.caseId, "case-1");
  assert.equal(result.incidentCategory, "handball");
  assert.equal(result.selectedDecision, "penalty-no-card");
  assert.equal(result.recommendedDecision, "penalty-no-card");
  assert.equal(result.isCorrect, true);
  assert.equal(result.confidence, 95);
  assert.equal(result.confidenceProbability, 0.95);
  assert.ok(Math.abs(result.calibrationError - 0.05) < Number.EPSILON);
  assert.ok(Math.abs(result.brierScore - 0.0025) < Number.EPSILON);
});

test("evaluates an incorrect answer with 95% confidence", () => {
  const result = evaluateAttempt(
    attempt({ selectedDecision: "no-offence", confidence: 95 }),
  );
  assert.equal(result.isCorrect, false);
  assert.equal(result.confidenceProbability, 0.95);
  assert.equal(result.calibrationError, 0.95);
  assert.equal(result.brierScore, 0.9025);
});

test("evaluates a correct answer with low confidence", () => {
  const result = evaluateAttempt(attempt({ confidence: 20 }));
  assert.equal(result.isCorrect, true);
  assert.equal(result.calibrationError, 0.8);
  assert.equal(result.brierScore, 0.6400000000000001);
});

test("classifies mixed attempts as well calibrated", () => {
  const result = summarizeCalibration([
    attempt({ caseId: "1", confidence: 80 }),
    attempt({ caseId: "2", confidence: 60 }),
    attempt({
      caseId: "3",
      selectedDecision: "no-offence",
      confidence: 40,
    }),
    attempt({
      caseId: "4",
      selectedDecision: "no-offence",
      confidence: 20,
    }),
  ]);
  assert.equal(result.classification, "well_calibrated");
  assert.equal(result.accuracy, 50);
  assert.equal(result.averageConfidence, 50);
  assert.equal(result.calibrationGap, 0);
});

test("classifies aggregate overconfidence", () => {
  const result = summarizeCalibration([
    attempt({ caseId: "1", confidence: 90 }),
    attempt({ caseId: "2", confidence: 90 }),
    attempt({
      caseId: "3",
      selectedDecision: "no-offence",
      confidence: 90,
    }),
  ]);
  assert.equal(result.classification, "overconfident");
  assert.match(result.message, /overconfident/);
});

test("classifies aggregate underconfidence", () => {
  const result = summarizeCalibration([
    attempt({ caseId: "1", confidence: 30 }),
    attempt({ caseId: "2", confidence: 30 }),
    attempt({
      caseId: "3",
      selectedDecision: "no-offence",
      confidence: 10,
    }),
  ]);
  assert.equal(result.classification, "underconfident");
  assert.match(result.message, /underestimating/);
});

test("reports insufficient data below the minimum attempt threshold", () => {
  const result = summarizeCalibration([
    attempt({ caseId: "1" }),
    attempt({ caseId: "2" }),
  ]);
  assert.equal(result.classification, "insufficient_data");
  assert.match(result.message, /at least 3 decisions/);
  assert.equal(
    result.categorySummaries[0]?.classification,
    "insufficient_data",
  );
});

test("summarizes categories in deterministic alphabetical order", () => {
  const result = summarizeCalibration([
    attempt({ caseId: "z", incidentCategory: "offside" }),
    attempt({ caseId: "a", incidentCategory: "handball" }),
    attempt({ caseId: "f", incidentCategory: "foul" }),
  ]);
  assert.deepEqual(
    result.categorySummaries.map(({ incidentCategory }) => incidentCategory),
    ["foul", "handball", "offside"],
  );
});

test("supports confidence boundaries of 0 and 100", () => {
  const zero = evaluateAttempt(attempt({ confidence: 0 }));
  const hundred = evaluateAttempt(attempt({ confidence: 100 }));
  assert.equal(zero.confidenceProbability, 0);
  assert.equal(zero.calibrationError, 1);
  assert.equal(zero.brierScore, 1);
  assert.equal(hundred.confidenceProbability, 1);
  assert.equal(hundred.calibrationError, 0);
  assert.equal(hundred.brierScore, 0);
});

test("rejects invalid confidence values", () => {
  assert.throws(
    () => evaluateAttempt(attempt({ confidence: -1 })),
    /attempt\.confidence/,
  );
  assert.throws(
    () => evaluateAttempt(attempt({ confidence: 101 })),
    /attempt\.confidence/,
  );
  assert.throws(
    () => evaluateAttempt(attempt({ confidence: Number.NaN })),
    /attempt\.confidence/,
  );
  assert.throws(
    () => evaluateAttempt(attempt({ confidence: Number.POSITIVE_INFINITY })),
    /attempt\.confidence/,
  );
});

test("rejects empty required fields", () => {
  assert.throws(
    () => evaluateAttempt(attempt({ caseId: "" })),
    /attempt\.caseId/,
  );
  assert.throws(
    () => evaluateAttempt(attempt({ incidentCategory: "   " })),
    /attempt\.incidentCategory/,
  );
  assert.throws(
    () => evaluateAttempt(attempt({ selectedDecision: "" })),
    /attempt\.selectedDecision/,
  );
  assert.throws(
    () => evaluateAttempt(attempt({ recommendedDecision: "" })),
    /attempt\.recommendedDecision/,
  );
});

test("supports custom minimum attempts and threshold options", () => {
  const attempts = [
    attempt({ caseId: "1", confidence: 80 }),
    attempt({ caseId: "2", confidence: 80 }),
    attempt({
      caseId: "3",
      selectedDecision: "no-offence",
      confidence: 80,
    }),
  ];
  assert.equal(
    summarizeCalibration(attempts, { minimumAttempts: 4 }).classification,
    "insufficient_data",
  );
  assert.equal(
    summarizeCalibration(attempts, { wellCalibratedThreshold: 15 })
      .classification,
    "well_calibrated",
  );
});

test("does not mutate inputs and produces deterministic output", () => {
  const attempts = [
    attempt({ caseId: "b", confidence: 35 }),
    attempt({ caseId: "a", confidence: 65 }),
  ];
  const before = structuredClone(attempts);
  const first = summarizeCalibration(attempts);
  const second = summarizeCalibration(attempts);
  assert.deepEqual(attempts, before);
  assert.deepEqual(first, second);
});

test("maps stored vote records without persistence dependencies", () => {
  const vote = {
    id: "vote-1",
    userId: "user-1",
    caseId: "case-1",
    selectedDecision: "penalty-no-card",
    confidence: 75,
    incidentCategory: "handball",
    createdAt: "2026-07-10T12:00:00.000Z",
  };
  const mapped = mapStoredVoteToDecisionAttempt(vote, "penalty-no-card");
  assert.deepEqual(mapped, {
    caseId: "case-1",
    incidentCategory: "handball",
    selectedDecision: "penalty-no-card",
    recommendedDecision: "penalty-no-card",
    confidence: 75,
    createdAt: "2026-07-10T12:00:00.000Z",
  });
  assert.equal(vote.userId, "user-1");
});

test("returns finite zero metrics for an empty collection", () => {
  const result = summarizeCalibration([]);
  assert.deepEqual(result, {
    attempts: 0,
    correctAttempts: 0,
    accuracy: 0,
    averageConfidence: 0,
    calibrationGap: 0,
    averageCalibrationError: 0,
    averageBrierScore: 0,
    classification: "insufficient_data",
    message: "Complete at least 3 decisions to receive a calibration insight.",
    categorySummaries: [],
  });
  for (const value of Object.values(result).filter(
    (value): value is number => typeof value === "number",
  )) {
    assert.ok(Number.isFinite(value));
  }
});
