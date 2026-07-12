import { refereeCases } from "../../data/referee-cases.ts";
import type {
  DecisionCode,
  RefereeCase,
  RuleFactor,
} from "../../domain/referee-case.ts";
import {
  extractReasoningFactorIds,
  resolveDecision,
  resolveReasoningFactor,
} from "./normalize.ts";
import type {
  ReasoningAnalysisResult,
  ReasoningFactorResult,
} from "./types.ts";

type SupportedFactorRubric = Readonly<
  Record<string, Readonly<Record<string, readonly string[]>>>
>;

const SUPPORTED_FACTOR_RUBRIC: SupportedFactorRubric = {
  "soccer-handball-001": {
    "penalty-red-card": [
      "deliberate-movement",
      "defender-location",
      "goal-bound",
    ],
    "penalty-yellow-card": [],
  },
  "soccer-handball-002": {
    "penalty-yellow-card": [
      "no-hand-to-ball",
      "unnatural-position",
      "goal-denied-nondeliberate",
    ],
    "no-offence": ["no-hand-to-ball"],
  },
  "soccer-handball-003": {
    "penalty-no-card": [
      "clear-reach",
      "inside-area",
      "limited-tactical-impact",
    ],
    "penalty-yellow-card": ["clear-reach", "inside-area"],
  },
  "soccer-handball-004": {
    "penalty-no-card": ["arm-high", "not-justified", "no-tactical-denial"],
    "no-offence": ["arm-high"],
  },
  "soccer-handball-005": {
    "penalty-no-card": [
      "short-distance",
      "preexisting-extension",
      "stance-unjustified",
    ],
    "no-offence": ["short-distance"],
  },
  "soccer-handball-006": {
    "penalty-yellow-card": [
      "initial-natural-position",
      "second-reach",
      "promising-pass-stopped",
    ],
    "penalty-no-card": ["initial-natural-position"],
  },
  "soccer-handball-007": {
    "penalty-no-card": [
      "ball-live",
      "intentional-catch",
      "mistake-no-exemption",
    ],
    "penalty-yellow-card": ["ball-live", "intentional-catch"],
  },
  "soccer-handball-008": {
    "penalty-yellow-card": [
      "arm-dropped",
      "unmarked-receiver",
      "covering-defender",
    ],
    "penalty-no-card": ["arm-dropped"],
  },
  "soccer-handball-009": {
    "penalty-no-card": ["below-armpit", "side-extension", "shot-wide"],
    "no-offence": ["shot-wide"],
  },
  "soccer-handball-010": {
    "penalty-no-card": [
      "visible-deflection",
      "apparent-extension",
      "blocked-evidence",
    ],
    "no-offence": ["blocked-evidence"],
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireNonBlankString(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${path} must be a nonblank string`);
  }
  return value;
}

function getCase(caseId: string): RefereeCase {
  const refereeCase = refereeCases.find(
    (candidate) => candidate.id === caseId.trim(),
  );
  if (!refereeCase) {
    throw new Error(`Unknown caseId: ${caseId.trim()}`);
  }
  return refereeCase;
}

function requiredFactorIds(refereeCase: RefereeCase): readonly string[] {
  const knownIds = new Set(refereeCase.ruleFactors.map((factor) => factor.id));
  const required: string[] = [];
  const seen = new Set<string>();
  for (const step of refereeCase.reasoningPath) {
    for (const factorId of step.factorIds) {
      if (!knownIds.has(factorId)) {
        throw new Error(
          `Invalid trusted case ${refereeCase.id}: reasoningPath.factorIds references unknown factor ${factorId}`,
        );
      }
      if (!seen.has(factorId)) {
        seen.add(factorId);
        required.push(factorId);
      }
    }
  }
  return required;
}

function trustedSupportedFactorIds(
  refereeCase: RefereeCase,
  selectedDecision: DecisionCode,
  required: readonly string[],
): readonly string[] {
  const rubric = SUPPORTED_FACTOR_RUBRIC[refereeCase.id];
  const supported =
    rubric?.[selectedDecision] ??
    (selectedDecision === refereeCase.recommendedDecisionCode ? required : []);
  const knownIds = new Set(refereeCase.ruleFactors.map((factor) => factor.id));
  for (const factorId of supported) {
    if (!knownIds.has(factorId)) {
      throw new Error(
        `Invalid local rubric for ${refereeCase.id}: unknown factor ${factorId}`,
      );
    }
  }
  return supported;
}

function factorResult(factor: RuleFactor): ReasoningFactorResult {
  return {
    id: factor.id,
    label: factor.label,
    rationale: factor.observation,
  };
}

function listText(values: readonly string[]): string {
  return values.length > 0 ? values.join(", ") : "none";
}

function alignmentText(
  alignment: ReasoningAnalysisResult["decisionAlignment"],
): string {
  switch (alignment) {
    case "matches_recommended":
      return "matches the trusted case recommendation";
    case "alternative_supported":
      return "matches a documented alternative interpretation";
    case "unsupported":
      return "is not the trusted recommendation or a documented alternative";
  }
}

function deterministicFeedback(
  result: Omit<ReasoningAnalysisResult, "deterministicFeedback">,
): string {
  const considered = result.consideredFactors.map(({ id }) => id);
  const missing = result.missingFactors.map(({ id }) => id);
  const ruleReference = [
    result.ruleReference.law,
    result.ruleReference.edition,
    result.ruleReference.section,
  ]
    .filter((value): value is string => Boolean(value))
    .join("; ");
  return [
    `Decision ${result.selectedDecision} ${alignmentText(result.decisionAlignment)}.`,
    `Considered factors: ${listText(considered)}.`,
    `Missing required factors: ${listText(missing)}.`,
    `Unsupported factors for this decision: ${listText(result.unsupportedFactors)}.`,
    `Trusted rule reference: ${ruleReference}.`,
  ].join(" ");
}

export function analyzeReasoning(input: unknown): ReasoningAnalysisResult {
  if (!isRecord(input)) {
    throw new TypeError("input must be a non-null object");
  }

  const caseId = requireNonBlankString(input.caseId, "caseId");
  const refereeCase = getCase(caseId);
  const selectedDecisionInput = requireNonBlankString(
    input.selectedDecision,
    "selectedDecision",
  );
  const selectedDecision = resolveDecision(selectedDecisionInput);
  if (!selectedDecision) {
    throw new Error(
      `selectedDecision is not a supported decision: ${selectedDecisionInput.trim()}`,
    );
  }

  const selectedFactorInputs: readonly string[] = (() => {
    if (!Object.prototype.hasOwnProperty.call(input, "selectedFactors")) {
      return [];
    }
    if (!Array.isArray(input.selectedFactors)) {
      throw new TypeError("selectedFactors must be an array");
    }
    return input.selectedFactors.map((factor, index) =>
      requireNonBlankString(factor, `selectedFactors[${index}]`),
    );
  })();

  let writtenReasoning: string | undefined;
  if (Object.prototype.hasOwnProperty.call(input, "writtenReasoning")) {
    writtenReasoning = requireNonBlankString(
      input.writtenReasoning,
      "writtenReasoning",
    );
  }

  const consideredIds: string[] = [];
  const consideredSet = new Set<string>();
  const addConsidered = (factorId: string): void => {
    if (!consideredSet.has(factorId)) {
      consideredSet.add(factorId);
      consideredIds.push(factorId);
    }
  };

  for (const [index, factorInput] of selectedFactorInputs.entries()) {
    const factorId = resolveReasoningFactor(factorInput, refereeCase);
    if (!factorId) {
      throw new Error(
        `selectedFactors[${index}] is unknown for case ${refereeCase.id}: ${factorInput.trim()}`,
      );
    }
    addConsidered(factorId);
  }
  if (writtenReasoning !== undefined) {
    for (const factorId of extractReasoningFactorIds(
      writtenReasoning,
      refereeCase,
    )) {
      addConsidered(factorId);
    }
  }

  const required = requiredFactorIds(refereeCase);
  const factorById = new Map(
    refereeCase.ruleFactors.map((factor) => [factor.id, factor]),
  );
  const consideredFactors = consideredIds.map((factorId) =>
    factorResult(factorById.get(factorId)!),
  );
  const consideredSetFinal = new Set(consideredIds);
  const missingFactors = required
    .filter((factorId) => !consideredSetFinal.has(factorId))
    .map((factorId) => factorResult(factorById.get(factorId)!));
  const supported = new Set(
    trustedSupportedFactorIds(refereeCase, selectedDecision, required),
  );
  const unsupportedFactors = consideredIds.filter(
    (factorId) => !supported.has(factorId),
  );
  const decisionAlignment: ReasoningAnalysisResult["decisionAlignment"] =
    selectedDecision === refereeCase.recommendedDecisionCode
      ? "matches_recommended"
      : refereeCase.alternativeInterpretations.some(
            ({ decisionCode }) => decisionCode === selectedDecision,
          )
        ? "alternative_supported"
        : "unsupported";
  const ruleReference = {
    law: refereeCase.ruleSource.law,
    edition: refereeCase.ruleSource.edition,
    section: refereeCase.ruleSource.sections.join("; "),
  };
  const resultWithoutFeedback = {
    caseId: refereeCase.id,
    selectedDecision,
    recommendedDecision: refereeCase.recommendedDecisionCode,
    decisionAlignment,
    consideredFactors,
    missingFactors,
    unsupportedFactors,
    ruleReference,
    analysisVersion: "ai-002.v1" as const,
  } satisfies Omit<ReasoningAnalysisResult, "deterministicFeedback">;
  return {
    ...resultWithoutFeedback,
    deterministicFeedback: deterministicFeedback(resultWithoutFeedback),
  };
}
