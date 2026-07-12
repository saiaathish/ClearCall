import { describe, expect, it, vi } from "vitest";
import {
  addCommentRemote,
  clearDemoState,
  completeOnboardingRemote,
  fetchDemoState,
  initialDemoState,
  publishDraftRemote,
  readDemoState,
  submitAnswerRemote,
  toggleSavedRemote,
  writeDemoState,
} from "@/lib/storage";
import type { DiscussionResponse, PublishedCaseDraft, UserAnswer } from "@/lib/types";

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
  postedAtLabel: "Just now",
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

const validAnswer: UserAnswer = {
  caseId: "case-a",
  selectedOptionId: "option-a",
  confidence: 80,
  selectedFactorKeys: ["speed"],
  answeredAt: "2026-07-10T00:00:00.000Z",
};

/** Minimal chainable Supabase query builder mock. */
function makeQueryBuilder(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  builder.select = vi.fn(chain);
  builder.eq = vi.fn(chain);
  builder.order = vi.fn(chain);
  builder.upsert = vi.fn(chain);
  builder.insert = vi.fn(chain);
  builder.update = vi.fn(chain);
  builder.delete = vi.fn(chain);
  builder.single = vi.fn(() => Promise.resolve(result));
  builder.maybeSingle = vi.fn(() => Promise.resolve(result));
  // Make the builder itself thenable so `await supabase.from(...).select(...)`
  // resolves without an explicit terminal call, matching supabase-js.
  builder.then = (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve);
  return builder;
}

function makeSupabaseMock(tableResults: Record<string, { data: unknown; error: unknown }>) {
  const storageUpload = vi.fn(() => Promise.resolve({ data: { path: "x" }, error: null }));
  return {
    from: vi.fn((table: string) =>
      makeQueryBuilder(tableResults[table] ?? { data: null, error: null }),
    ),
    storage: {
      from: vi.fn(() => ({ upload: storageUpload })),
    },
  } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

describe("demo storage (Supabase-backed)", () => {
  it("exposes a seeded baseline for signed-out visitors", () => {
    expect(initialDemoState.answers).toBeTypeOf("object");
    expect(initialDemoState.savedCaseIds.length).toBeGreaterThan(0);
    expect(initialDemoState.publishedDrafts).toEqual([]);
    expect(initialDemoState.onboardingComplete).toBe(false);
  });

  it("persists and restores demo state through localStorage", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
        removeItem: (key: string) => {
          store.delete(key);
        },
      },
    });

    const next = {
      ...initialDemoState,
      answers: {
        "case-a": {
          ...validAnswer,
          initialAttempt: {
            selectedOptionId: "option-b",
            confidence: 92,
            selectedFactorKeys: ["control"],
            answeredAt: "2026-07-09T00:00:00.000Z",
          },
          revisionCount: 2,
        },
      },
      savedCaseIds: ["handball-raised-arm", "advantage-quick-breakdown"],
    };
    expect(writeDemoState(next)).toBe(true);
    expect(readDemoState().savedCaseIds).toEqual([
      "handball-raised-arm",
      "advantage-quick-breakdown",
    ]);
    expect(readDemoState().answers["case-a"]?.initialAttempt?.selectedOptionId).toBe(
      "option-b",
    );
    expect(readDemoState().answers["case-a"]?.revisionCount).toBe(2);
    clearDemoState();
    expect(readDemoState().savedCaseIds).toEqual(initialDemoState.savedCaseIds);
    vi.unstubAllGlobals();
  });

  it("fetchDemoState reshapes rows from every table into DemoState", async () => {
    const supabase = makeSupabaseMock({
      user_answers: {
        data: [
          {
            case_id: "case-a",
            selected_option_id: "option-b",
            confidence: 74,
            selected_factor_keys: ["control"],
            answered_at: "2026-07-10T00:05:00.000Z",
            initial_selected_option_id: "option-a",
            initial_confidence: 80,
            initial_selected_factor_keys: ["speed"],
            initial_answered_at: "2026-07-10T00:00:00.000Z",
            revision_count: 1,
          },
        ],
        error: null,
      },
      saved_cases: { data: [{ case_id: "case-a" }], error: null },
      profiles: {
        data: {
          current_streak: 3,
          onboarding_complete: true,
          display_name: "Jordan Lee",
          avatar_initials: "JL",
          role: "learner",
        },
        error: null,
      },
      published_drafts: {
        data: [
          {
            id: "draft-a",
            data: validDraft,
            status: "draft",
            media_path: null,
            created_at: "2026-07-10T00:00:00.000Z",
          },
        ],
        error: null,
      },
      discussion_responses: {
        data: [
          {
            id: "comment-a",
            case_id: "case-a",
            body: validComment.body,
            selected_option_id: "option-a",
            confidence: 76,
            selected_factor_keys: ["contact-point"],
            rule_citation: "Law 12",
            helpful_count: 2,
            factor_reactions: { "contact-point": { agree: 4, disagree: 1 } },
            created_at: "2026-07-10T00:00:00.000Z",
            is_pinned: false,
            is_verified_explanation: false,
          },
        ],
        error: null,
      },
    });

    const result = await fetchDemoState(supabase, "user-1");

    expect(result.answers["case-a"]).toMatchObject({
      caseId: "case-a",
      selectedOptionId: "option-b",
      confidence: 74,
      revisionCount: 1,
      initialAttempt: {
        selectedOptionId: "option-a",
        confidence: 80,
      },
    });
    expect(result.savedCaseIds).toEqual(["case-a"]);
    expect(result.currentStreak).toBe(3);
    expect(result.onboardingComplete).toBe(true);
    expect(result.publishedDrafts).toHaveLength(1);
    expect(result.publishedDrafts[0]).toMatchObject({ id: "draft-a", status: "draft" });
    expect(result.temporaryComments["case-a"]).toHaveLength(1);
    expect(result.temporaryComments["case-a"][0]).toMatchObject({
      id: "comment-a",
      body: validComment.body,
    });
  });

  it("falls back to the seeded baseline if any Supabase call throws", async () => {
    const supabase = {
      from: vi.fn(() => {
        throw new Error("network down");
      }),
      storage: { from: vi.fn() },
    } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

    const result = await fetchDemoState(supabase, "user-1");
    expect(result).toEqual(initialDemoState);
  });

  it("submitAnswerRemote preserves first-attempt fields when updating", async () => {
    const upsert = vi.fn(() => Promise.resolve({ data: null, error: null }));
    const supabase = {
      from: vi.fn(() => ({ upsert })),
    } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    const revised: UserAnswer = {
      ...validAnswer,
      selectedOptionId: "option-b",
      answeredAt: "2026-07-10T00:05:00.000Z",
      initialAttempt: {
        selectedOptionId: "option-a",
        confidence: 80,
        selectedFactorKeys: ["speed"],
        answeredAt: "2026-07-10T00:00:00.000Z",
      },
      revisionCount: 1,
    };

    await submitAnswerRemote(supabase, "user-1", revised, false);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        selected_option_id: "option-b",
        initial_selected_option_id: "option-a",
        initial_answered_at: "2026-07-10T00:00:00.000Z",
        revision_count: 1,
      }),
      { onConflict: "user_id,case_id" },
    );
  });

  it("submitAnswerRemote surfaces a rejected answer write", async () => {
    const failure = new Error("write failed");
    const supabase = {
      from: vi.fn(() => ({
        upsert: vi.fn(() => Promise.resolve({ data: null, error: failure })),
      })),
    } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

    await expect(submitAnswerRemote(supabase, "user-1", validAnswer, false)).rejects.toBe(
      failure,
    );
  });

  it("toggleSavedRemote upserts when saving and deletes when unsaving", async () => {
    const supabase = makeSupabaseMock({});
    await toggleSavedRemote(supabase, "user-1", "case-a", true);
    await toggleSavedRemote(supabase, "user-1", "case-a", false);
    expect(supabase.from).toHaveBeenCalledWith("saved_cases");
  });

  it("toggleSavedRemote throws when the write fails", async () => {
    const failure = new Error("fk violation");
    const supabase = makeSupabaseMock({
      saved_cases: { data: null, error: failure },
    });
    await expect(toggleSavedRemote(supabase, "user-1", "case-a", true)).rejects.toBe(failure);
  });

  it("addCommentRemote inserts into discussion_responses", async () => {
    const supabase = makeSupabaseMock({});
    await addCommentRemote(supabase, "user-1", "case-a", validComment);
    expect(supabase.from).toHaveBeenCalledWith("discussion_responses");
  });

  it("completeOnboardingRemote updates the profile", async () => {
    const supabase = makeSupabaseMock({});
    await completeOnboardingRemote(supabase, "user-1");
    expect(supabase.from).toHaveBeenCalledWith("profiles");
  });

  it("publishDraftRemote uploads media then inserts a published_drafts row", async () => {
    const supabase = makeSupabaseMock({
      published_drafts: {
        data: { id: "server-id", created_at: "2026-07-11T00:00:00.000Z" },
        error: null,
      },
    });
    const file = new File(["clip"], "clip.mp4", { type: "video/mp4" });
    const result = await publishDraftRemote(supabase, "user-1", validDraft, file);

    expect(supabase.storage.from).toHaveBeenCalledWith("case-media");
    expect(result.id).toBe("server-id");
    expect(result.createdAt).toBe("2026-07-11T00:00:00.000Z");
  });

  it("publishDraftRemote throws when the insert fails", async () => {
    const supabase = makeSupabaseMock({
      published_drafts: { data: null, error: new Error("insert failed") },
    });
    await expect(publishDraftRemote(supabase, "user-1", validDraft, null)).rejects.toThrow();
  });
});
