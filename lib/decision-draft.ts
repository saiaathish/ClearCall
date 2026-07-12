import type { DecisionAttempt, UserAnswer } from "@/lib/types";

export const DEFAULT_DECISION_CONFIDENCE = 70;

export interface DecisionDraft {
  selectedOptionId: string;
  confidence: number;
  selectedFactorKeys: readonly string[];
}

export function createDecisionDraft(answer?: UserAnswer): DecisionDraft {
  return {
    selectedOptionId: answer?.selectedOptionId ?? "",
    confidence: answer?.confidence ?? DEFAULT_DECISION_CONFIDENCE,
    selectedFactorKeys: answer ? [...answer.selectedFactorKeys] : [],
  };
}

export function isDecisionDraftComplete(draft: DecisionDraft): boolean {
  return Boolean(draft.selectedOptionId && draft.selectedFactorKeys.length > 0);
}

export function getInitialAttempt(answer: UserAnswer): DecisionAttempt {
  return answer.initialAttempt ?? {
    selectedOptionId: answer.selectedOptionId,
    confidence: answer.confidence,
    selectedFactorKeys: [...answer.selectedFactorKeys],
    answeredAt: answer.answeredAt,
  };
}

export function getScoredAnswer(answer: UserAnswer): UserAnswer {
  const initial = getInitialAttempt(answer);
  return {
    ...answer,
    selectedOptionId: initial.selectedOptionId,
    confidence: initial.confidence,
    selectedFactorKeys: initial.selectedFactorKeys,
    answeredAt: initial.answeredAt,
  };
}

export function createUserAnswer(
  caseId: string,
  draft: DecisionDraft,
  answeredAt: string,
  savedAnswer?: UserAnswer,
): UserAnswer {
  const currentAttempt: DecisionAttempt = {
    selectedOptionId: draft.selectedOptionId,
    confidence: draft.confidence,
    selectedFactorKeys: [...draft.selectedFactorKeys],
    answeredAt,
  };

  return {
    caseId,
    ...currentAttempt,
    initialAttempt: savedAnswer ? getInitialAttempt(savedAnswer) : currentAttempt,
    revisionCount: savedAnswer ? (savedAnswer.revisionCount ?? 0) + 1 : 0,
  };
}

export function hasDecisionDraftChanged(
  answer: UserAnswer | undefined,
  draft: DecisionDraft,
): boolean {
  const saved = createDecisionDraft(answer);
  const savedFactors = new Set(saved.selectedFactorKeys);
  const draftFactors = new Set(draft.selectedFactorKeys);

  return (
    saved.selectedOptionId !== draft.selectedOptionId ||
    saved.confidence !== draft.confidence ||
    savedFactors.size !== draftFactors.size ||
    [...savedFactors].some((key) => !draftFactors.has(key))
  );
}
