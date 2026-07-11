import type { DecisionCode } from "../../domain/referee-case.ts";

export type DecisionAlignment =
  "matches_recommended" | "alternative_supported" | "unsupported";

export interface ReasoningAnalysisInput {
  caseId: string;
  selectedDecision: string;
  selectedFactors?: readonly string[];
  writtenReasoning?: string;
}

export interface ReasoningFactorResult {
  id: string;
  label: string;
  rationale?: string;
}

export interface ReasoningAnalysisResult {
  caseId: string;
  selectedDecision: DecisionCode;
  recommendedDecision: DecisionCode;
  decisionAlignment: DecisionAlignment;
  consideredFactors: readonly ReasoningFactorResult[];
  missingFactors: readonly ReasoningFactorResult[];
  unsupportedFactors: readonly string[];
  ruleReference: {
    law: string;
    edition?: string;
    section?: string;
  };
  deterministicFeedback: string;
  analysisVersion: "ai-002.v1";
}

export interface ReasoningFeedbackEnhancer {
  enhance(
    result: Readonly<ReasoningAnalysisResult>,
    writtenReasoning?: string,
  ): Promise<string>;
}

export type FeedbackSource = "deterministic" | "enhanced" | "fallback";
export type FeedbackFallbackReason =
  "no-enhancer" | "enhancer-error" | "blank-output" | "invalid-output";

export interface EnhancedReasoningFeedback {
  result: Readonly<ReasoningAnalysisResult>;
  analysis: Readonly<ReasoningAnalysisResult>;
  deterministicFeedback: string;
  feedback: string;
  enhancedFeedback?: string;
  source: FeedbackSource;
  fallbackReason?: FeedbackFallbackReason;
}
