import type {
  AttemptCalibration,
  CalibrationClassification,
  CalibrationOptions,
  CalibrationSummary,
  CategoryCalibrationSummary,
  DecisionAttempt,
  StoredVoteAttempt,
} from "./types.ts";

const DEFAULT_MINIMUM_ATTEMPTS = 3;
const DEFAULT_WELL_CALIBRATED_THRESHOLD = 10;

function assertNonEmptyString(
  value: unknown,
  field: string,
): asserts value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} must be a non-empty string`);
  }
}

function assertDecisionAttempt(
  attempt: unknown,
): asserts attempt is DecisionAttempt {
  if (typeof attempt !== "object" || attempt === null) {
    throw new Error("attempt must be an object");
  }

  const candidate = attempt as Record<string, unknown>;
  assertNonEmptyString(candidate.caseId, "attempt.caseId");
  assertNonEmptyString(candidate.incidentCategory, "attempt.incidentCategory");
  assertNonEmptyString(candidate.selectedDecision, "attempt.selectedDecision");
  assertNonEmptyString(
    candidate.recommendedDecision,
    "attempt.recommendedDecision",
  );

  if (
    typeof candidate.confidence !== "number" ||
    !Number.isFinite(candidate.confidence) ||
    candidate.confidence < 0 ||
    candidate.confidence > 100
  ) {
    throw new Error(
      "attempt.confidence must be a finite number between 0 and 100",
    );
  }

  if (
    candidate.createdAt !== undefined &&
    typeof candidate.createdAt !== "string"
  ) {
    throw new Error("attempt.createdAt must be a string when provided");
  }
}

function resolveOptions(
  options: CalibrationOptions | undefined,
): Required<CalibrationOptions> {
  if (
    options !== undefined &&
    (typeof options !== "object" || options === null)
  ) {
    throw new Error("options must be an object when provided");
  }

  const minimumAttempts = options?.minimumAttempts ?? DEFAULT_MINIMUM_ATTEMPTS;
  if (
    typeof minimumAttempts !== "number" ||
    !Number.isInteger(minimumAttempts) ||
    minimumAttempts < 1
  ) {
    throw new Error("options.minimumAttempts must be a positive integer");
  }

  const wellCalibratedThreshold =
    options?.wellCalibratedThreshold ?? DEFAULT_WELL_CALIBRATED_THRESHOLD;
  if (
    typeof wellCalibratedThreshold !== "number" ||
    !Number.isFinite(wellCalibratedThreshold) ||
    wellCalibratedThreshold < 0 ||
    wellCalibratedThreshold > 100
  ) {
    throw new Error(
      "options.wellCalibratedThreshold must be a finite number between 0 and 100",
    );
  }

  return { minimumAttempts, wellCalibratedThreshold };
}

function classify(
  attempts: number,
  calibrationGap: number,
  minimumAttempts: number,
  wellCalibratedThreshold: number,
): CalibrationClassification {
  if (attempts < minimumAttempts) {
    return "insufficient_data";
  }
  if (calibrationGap > wellCalibratedThreshold) {
    return "overconfident";
  }
  if (calibrationGap < -wellCalibratedThreshold) {
    return "underconfident";
  }
  return "well_calibrated";
}

function messageForCategory(
  incidentCategory: string,
  classification: CalibrationClassification,
  minimumAttempts: number,
): string {
  switch (classification) {
    case "overconfident":
      return `You are overconfident on ${incidentCategory} decisions.`;
    case "underconfident":
      return `You may be underestimating your ${incidentCategory} decisions.`;
    case "well_calibrated":
      return `Your confidence is well calibrated on ${incidentCategory} decisions.`;
    case "insufficient_data":
      return `Complete at least ${minimumAttempts} ${incidentCategory} decisions to receive a calibration insight.`;
  }
}

function messageForOverall(
  classification: CalibrationClassification,
  minimumAttempts: number,
): string {
  switch (classification) {
    case "overconfident":
      return "You are overconfident across your decisions.";
    case "underconfident":
      return "You may be underestimating your decisions.";
    case "well_calibrated":
      return "Your confidence is well calibrated across your decisions.";
    case "insufficient_data":
      return `Complete at least ${minimumAttempts} decisions to receive a calibration insight.`;
  }
}

interface AggregateMetrics {
  attempts: number;
  correctAttempts: number;
  accuracy: number;
  averageConfidence: number;
  calibrationGap: number;
  averageCalibrationError: number;
  averageBrierScore: number;
}

function aggregate(
  calibrations: readonly AttemptCalibration[],
): AggregateMetrics {
  const attempts = calibrations.length;
  const correctAttempts = calibrations.reduce(
    (total, calibration) => total + (calibration.isCorrect ? 1 : 0),
    0,
  );
  const confidenceTotal = calibrations.reduce(
    (total, calibration) => total + calibration.confidence,
    0,
  );
  const calibrationErrorTotal = calibrations.reduce(
    (total, calibration) => total + calibration.calibrationError,
    0,
  );
  const brierScoreTotal = calibrations.reduce(
    (total, calibration) => total + calibration.brierScore,
    0,
  );
  const accuracy = attempts === 0 ? 0 : (correctAttempts / attempts) * 100;
  const averageConfidence = attempts === 0 ? 0 : confidenceTotal / attempts;

  return {
    attempts,
    correctAttempts,
    accuracy,
    averageConfidence,
    calibrationGap: averageConfidence - accuracy,
    averageCalibrationError:
      attempts === 0 ? 0 : calibrationErrorTotal / attempts,
    averageBrierScore: attempts === 0 ? 0 : brierScoreTotal / attempts,
  };
}

function categorySummary(
  incidentCategory: string,
  calibrations: readonly AttemptCalibration[],
  minimumAttempts: number,
  wellCalibratedThreshold: number,
): CategoryCalibrationSummary {
  const metrics = aggregate(calibrations);
  const classification = classify(
    metrics.attempts,
    metrics.calibrationGap,
    minimumAttempts,
    wellCalibratedThreshold,
  );

  return {
    incidentCategory,
    ...metrics,
    classification,
    message: messageForCategory(
      incidentCategory,
      classification,
      minimumAttempts,
    ),
  };
}

export function evaluateAttempt(attempt: DecisionAttempt): AttemptCalibration {
  assertDecisionAttempt(attempt);

  const isCorrect = attempt.selectedDecision === attempt.recommendedDecision;
  const confidenceProbability = attempt.confidence / 100;
  const outcome = isCorrect ? 1 : 0;
  const calibrationError = Math.abs(confidenceProbability - outcome);
  const brierScore = (confidenceProbability - outcome) ** 2;

  return {
    caseId: attempt.caseId,
    incidentCategory: attempt.incidentCategory,
    selectedDecision: attempt.selectedDecision,
    recommendedDecision: attempt.recommendedDecision,
    isCorrect,
    confidence: attempt.confidence,
    confidenceProbability,
    calibrationError,
    brierScore,
  };
}

export function summarizeCalibration(
  attempts: readonly DecisionAttempt[],
  options?: CalibrationOptions,
): CalibrationSummary {
  if (!Array.isArray(attempts)) {
    throw new Error("attempts must be an array");
  }

  const { minimumAttempts, wellCalibratedThreshold } = resolveOptions(options);
  const calibrations = attempts.map(evaluateAttempt);
  const metrics = aggregate(calibrations);
  const classification = classify(
    metrics.attempts,
    metrics.calibrationGap,
    minimumAttempts,
    wellCalibratedThreshold,
  );
  const byCategory = new Map<string, AttemptCalibration[]>();

  for (const calibration of calibrations) {
    const categoryAttempts = byCategory.get(calibration.incidentCategory) ?? [];
    categoryAttempts.push(calibration);
    byCategory.set(calibration.incidentCategory, categoryAttempts);
  }

  const categorySummaries = [...byCategory.entries()]
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([incidentCategory, categoryAttempts]) =>
      categorySummary(
        incidentCategory,
        categoryAttempts,
        minimumAttempts,
        wellCalibratedThreshold,
      ),
    );

  return {
    ...metrics,
    classification,
    message: messageForOverall(classification, minimumAttempts),
    categorySummaries,
  };
}

export function mapStoredVoteToDecisionAttempt(
  vote: StoredVoteAttempt,
  recommendedDecision: string,
): DecisionAttempt {
  assertNonEmptyString(recommendedDecision, "recommendedDecision");

  return {
    caseId: vote.caseId,
    incidentCategory: vote.incidentCategory,
    selectedDecision: vote.selectedDecision,
    recommendedDecision,
    confidence: vote.confidence,
    createdAt: vote.createdAt,
  };
}
