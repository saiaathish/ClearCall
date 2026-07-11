import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearDemoState,
  initialDemoState,
  readDemoState,
  writeDemoState,
} from "@/lib/storage";
import type { DiscussionResponse, PublishedCaseDraft } from "@/lib/types";

class MemoryStorage {
  private data = new Map<string, string>();

  getItem(key: string) {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.data.set(key, value);
  }

  removeItem(key: string) {
    this.data.delete(key);
  }
}

function installWindow() {
  const localStorage = new MemoryStorage();
  vi.stubGlobal("window", { localStorage });
  return localStorage;
}

const validComment: DiscussionResponse = {
  id: "comment-a",
  caseId: "case-a",
  author: {
    id: "learner-a",
    displayName: "Jordan Lee",
    role: "learner",
    organization: "Local demo",
    avatarInitials: "JL",
    isVerified: false,
    isSynthetic: false,
    disclosure: "Stored only in this browser.",
  },
  body: "The contact point changed my reading of the challenge.",
  selectedOptionId: "option-a",
  confidence: 76,
  selectedFactorKeys: ["contact-point"],
  ruleCitation: "Law 12",
  helpfulCount: 2,
  factorReactions: {
    "contact-point": { agree: 4, disagree: 1 },
  },
  postedAtLabel: "Just now · local only",
  isPinned: false,
  isVerifiedExplanation: false,
  isSynthetic: false,
  disclosure: "Local discussion response.",
};

const validDraft: PublishedCaseDraft = {
  id: "draft-a",
  mediaKind: "video",
  mediaFileName: "challenge.mp4",
  mediaFileSize: 4096,
  mediaFileType: "video/mp4",
  mediaAlt: "Two players contest the ball near midfield before late contact.",
  clipFileName: "challenge.mp4",
  clipFileSize: 4096,
  clipFileType: "video/mp4",
  clipStartTime: "00:03",
  clipEndTime: "00:11",
  posterFrameLabel: "Contact frame",
  title: "Late challenge near midfield",
  prompt: "What is the correct restart and sanction?",
  description: "A defender arrives after the attacker plays the ball.",
  competitionLevel: "Adult amateur",
  difficulty: "intermediate",
  category: "Serious foul play",
  originalDecision: "Play on",
  scenarioStatus: "OPEN_DISCUSSION",
  answerOptions: [
    {
      id: "option-a",
      label: "Direct free kick and yellow card",
      shortLabel: "DFK + yellow",
      description: "The tackle is reckless.",
    },
  ],
  recommendedDecision: "option-a",
  factors: [
    {
      key: "contact-point",
      label: "Contact point",
      value: "Above the ankle",
      supportsRecommendation: true,
      explanation: "The point of contact raises the level of risk.",
    },
  ],
  criticalFactor: "contact-point",
  rulePath: ["Law 12", "Direct free kick", "Disciplinary action"],
  ruleReference: "Laws of the Game, Law 12",
  expertExplanation: "The late, forceful contact is reckless.",
  ruleset: "IFAB Laws of the Game",
  rulesetVersion: "2025/26",
  sourceType: "team-recorded",
  sourceAttribution: "Recorded by the demo team.",
  permissionStatus: "confirmed",
  permissionConfirmed: true,
  createdAt: "2026-07-10T00:00:00.000Z",
  status: "draft",
  reviewStatus: "PENDING_EXPERT_REVIEW",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("demo storage", () => {
  it("uses the seeded baseline outside the browser", () => {
    expect(readDemoState()).toEqual(initialDemoState);
  });

  it("round-trips a versioned state envelope", () => {
    installWindow();
    const state = { ...initialDemoState, currentStreak: 9, savedCaseIds: ["case-a"] };
    expect(writeDemoState(state)).toBe(true);
    expect(readDemoState()).toEqual(state);
  });

  it("recovers safely from malformed JSON", () => {
    const storage = installWindow();
    storage.setItem("clearcall-demo-v1", "{broken");
    expect(readDemoState()).toEqual(initialDemoState);
  });

  it("filters malformed answers and can clear the envelope", () => {
    const storage = installWindow();
    storage.setItem(
      "clearcall-demo-v1",
      JSON.stringify({
        answers: {
          bad: { caseId: "bad", confidence: "certain" },
          good: {
            caseId: "good",
            selectedOptionId: "option-a",
            confidence: 80,
            selectedFactorKeys: ["speed"],
            answeredAt: "2026-07-10T00:00:00.000Z",
          },
        },
        savedCaseIds: ["good", 42],
      }),
    );
    expect(Object.keys(readDemoState().answers)).toEqual(["good"]);
    expect(readDemoState().savedCaseIds).toEqual(["good"]);
    clearDemoState();
    expect(storage.getItem("clearcall-demo-v1")).toBeNull();
  });

  it("hydrates only discussion responses with complete nested author and reaction data", () => {
    const storage = installWindow();
    storage.setItem(
      "clearcall-demo-v1",
      JSON.stringify({
        version: 1,
        state: {
          temporaryComments: {
            "case-a": [
              validComment,
              {
                ...validComment,
                id: "missing-author-fields",
                author: { id: "learner-b", displayName: "Incomplete" },
              },
              {
                ...validComment,
                id: "bad-reaction-count",
                factorReactions: { speed: { agree: "many", disagree: 0 } },
              },
              {
                ...validComment,
                id: "wrong-case",
                caseId: "case-b",
              },
            ],
            "not-an-array": { ...validComment },
          },
        },
      }),
    );

    expect(readDemoState().temporaryComments).toEqual({
      "case-a": [validComment],
    });
  });

  it("hydrates only published drafts with complete nested options and factors", () => {
    const storage = installWindow();
    storage.setItem(
      "clearcall-demo-v1",
      JSON.stringify({
        publishedDrafts: [
          validDraft,
          {
            ...validDraft,
            id: "bad-option",
            answerOptions: [{ id: "option-a", label: "Incomplete option" }],
          },
          {
            ...validDraft,
            id: "bad-factor",
            factors: [{ ...validDraft.factors[0], supportsRecommendation: "yes" }],
          },
          {
            ...validDraft,
            id: "bad-enum",
            category: "Unknown category",
          },
          {
            ...validDraft,
            id: "bad-file-size",
            clipFileSize: Number.POSITIVE_INFINITY,
          },
        ],
      }),
    );

    expect(readDemoState().publishedDrafts).toEqual([validDraft]);
  });

  it("preserves text posts without file metadata and normalizes legacy video drafts", () => {
    const storage = installWindow();
    const textDraft: PublishedCaseDraft = {
      ...validDraft,
      id: "draft-text",
      mediaKind: "text",
      mediaAlt: validDraft.description,
      mediaFileName: undefined,
      mediaFileSize: undefined,
      mediaFileType: undefined,
      clipFileName: undefined,
      clipFileSize: undefined,
      clipFileType: undefined,
      clipStartTime: undefined,
      clipEndTime: undefined,
      posterFrameLabel: undefined,
    };
    const legacyVideoDraft: Partial<PublishedCaseDraft> = { ...validDraft };
    delete legacyVideoDraft.mediaKind;
    delete legacyVideoDraft.mediaAlt;
    storage.setItem(
      "clearcall-demo-v1",
      JSON.stringify({ publishedDrafts: [textDraft, legacyVideoDraft] }),
    );

    const drafts = readDemoState().publishedDrafts;
    expect(drafts[0]).toEqual(textDraft);
    expect(drafts[1]).toMatchObject({
      id: validDraft.id,
      mediaKind: "video",
      mediaAlt: validDraft.posterFrameLabel,
    });
  });
});
