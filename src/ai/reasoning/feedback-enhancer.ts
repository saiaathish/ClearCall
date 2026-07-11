import type {
  EnhancedReasoningFeedback,
  FeedbackFallbackReason,
  ReasoningAnalysisResult,
  ReasoningFeedbackEnhancer,
} from "./types.ts";

function cloneAnalysis(
  analysis: Readonly<ReasoningAnalysisResult>,
): ReasoningAnalysisResult {
  return {
    caseId: analysis.caseId,
    selectedDecision: analysis.selectedDecision,
    recommendedDecision: analysis.recommendedDecision,
    decisionAlignment: analysis.decisionAlignment,
    consideredFactors: analysis.consideredFactors.map((factor) => ({
      id: factor.id,
      label: factor.label,
      ...(factor.rationale === undefined
        ? {}
        : { rationale: factor.rationale }),
    })),
    missingFactors: analysis.missingFactors.map((factor) => ({
      id: factor.id,
      label: factor.label,
      ...(factor.rationale === undefined
        ? {}
        : { rationale: factor.rationale }),
    })),
    unsupportedFactors: [...analysis.unsupportedFactors],
    ruleReference: {
      law: analysis.ruleReference.law,
      ...(analysis.ruleReference.edition === undefined
        ? {}
        : { edition: analysis.ruleReference.edition }),
      ...(analysis.ruleReference.section === undefined
        ? {}
        : { section: analysis.ruleReference.section }),
    },
    deterministicFeedback: analysis.deterministicFeedback,
    analysisVersion: analysis.analysisVersion,
  };
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null) {
    return value;
  }

  for (const nestedValue of Object.values(value)) {
    deepFreeze(nestedValue);
  }
  return Object.freeze(value);
}

function protectedSnapshot(
  analysis: Readonly<ReasoningAnalysisResult>,
): Readonly<ReasoningAnalysisResult> {
  return deepFreeze(cloneAnalysis(analysis));
}

function fallback(
  result: Readonly<ReasoningAnalysisResult>,
  reason: FeedbackFallbackReason,
): EnhancedReasoningFeedback {
  return {
    result,
    analysis: result,
    deterministicFeedback: result.deterministicFeedback,
    feedback: result.deterministicFeedback,
    source: "fallback",
    fallbackReason: reason,
  };
}

export async function enhanceReasoningFeedback(
  result: Readonly<ReasoningAnalysisResult>,
  enhancer?: ReasoningFeedbackEnhancer,
  writtenReasoning?: string,
): Promise<EnhancedReasoningFeedback> {
  if (!enhancer) {
    return fallback(result, "no-enhancer");
  }

  let enhanced: unknown;
  try {
    enhanced = await enhancer.enhance(
      protectedSnapshot(result),
      writtenReasoning,
    );
  } catch {
    return fallback(result, "enhancer-error");
  }
  if (typeof enhanced !== "string") {
    return fallback(result, "invalid-output");
  }
  if (enhanced.trim().length === 0) {
    return fallback(result, "blank-output");
  }

  return {
    result,
    analysis: result,
    deterministicFeedback: result.deterministicFeedback,
    feedback: enhanced.trim(),
    enhancedFeedback: enhanced.trim(),
    source: "enhanced",
  };
}
