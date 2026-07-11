import type {
  EnhancedReasoningFeedback,
  FeedbackFallbackReason,
  ReasoningAnalysisResult,
  ReasoningFeedbackEnhancer,
} from "./types.ts";

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
    enhanced = await enhancer.enhance(result, writtenReasoning);
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
    feedback: enhanced,
    enhancedFeedback: enhanced,
    source: "enhanced",
  };
}
