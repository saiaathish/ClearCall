import { describe, expect, it } from "vitest";
import {
  DEFAULT_DECISION_CONFIDENCE,
  createUserAnswer,
  createDecisionDraft,
  getInitialAttempt,
  getScoredAnswer,
  hasDecisionDraftChanged,
  isDecisionDraftComplete,
} from "@/lib/decision-draft";
import type { UserAnswer } from "@/lib/types";

const savedAnswer: UserAnswer = {
  caseId: "case-a",
  selectedOptionId: "yellow-card",
  confidence: 76,
  selectedFactorKeys: ["speed", "control"],
  answeredAt: "2026-07-11T12:00:00.000Z",
};

describe("decision draft state", () => {
  it("starts unanswered cases with an empty, neutral draft", () => {
    expect(createDecisionDraft()).toEqual({
      selectedOptionId: "",
      confidence: DEFAULT_DECISION_CONFIDENCE,
      selectedFactorKeys: [],
    });
  });

  it("prefills a revisable draft from the current saved answer", () => {
    expect(createDecisionDraft(savedAnswer)).toEqual({
      selectedOptionId: "yellow-card",
      confidence: 76,
      selectedFactorKeys: ["speed", "control"],
    });
  });

  it("detects meaningful revisions without treating factor order as a change", () => {
    expect(hasDecisionDraftChanged(savedAnswer, {
      selectedOptionId: "yellow-card",
      confidence: 76,
      selectedFactorKeys: ["control", "speed"],
    })).toBe(false);

    expect(hasDecisionDraftChanged(savedAnswer, {
      selectedOptionId: "red-card",
      confidence: 76,
      selectedFactorKeys: ["speed", "control"],
    })).toBe(true);
  });

  it("requires both a decision and at least one reasoning factor", () => {
    expect(isDecisionDraftComplete(createDecisionDraft(savedAnswer))).toBe(true);
    expect(isDecisionDraftComplete({
      selectedOptionId: "yellow-card",
      confidence: 76,
      selectedFactorKeys: [],
    })).toBe(false);
  });

  it("keeps the first attempt immutable when the current call is revised", () => {
    const revised = createUserAnswer(
      savedAnswer.caseId,
      {
        selectedOptionId: "red-card",
        confidence: 88,
        selectedFactorKeys: ["studs"],
      },
      "2026-07-11T12:05:00.000Z",
      savedAnswer,
    );

    expect(revised.selectedOptionId).toBe("red-card");
    expect(revised.revisionCount).toBe(1);
    expect(getInitialAttempt(revised)).toMatchObject({
      selectedOptionId: "yellow-card",
      confidence: 76,
      answeredAt: "2026-07-11T12:00:00.000Z",
    });
    expect(getScoredAnswer(revised).selectedOptionId).toBe("yellow-card");
  });
});
