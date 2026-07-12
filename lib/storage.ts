import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CaseReport,
  DiscussionResponse,
  PublishedCaseDraft,
  Publisher,
  UserAnswer,
} from "@/lib/types";
import type { Database } from "@/lib/supabase/database.types";

export interface DemoState {
  answers: Record<string, UserAnswer>;
  savedCaseIds: string[];
  currentStreak: number;
  temporaryComments: Record<string, DiscussionResponse[]>;
  publishedDrafts: PublishedCaseDraft[];
  reports: CaseReport[];
  removedCaseIds: string[];
  onboardingComplete: boolean;
}

/**
 * Seeded baseline shown to signed-out visitors so the feed, profile, and
 * saved views have something meaningful to render before sign-in. Signed-in
 * users' real state comes from Supabase via {@link fetchDemoState}.
 */
export const initialDemoState: DemoState = {
  answers: {
    "sfp-controlled-lunge": {
      caseId: "sfp-controlled-lunge",
      selectedOptionId: "direct-free-kick-yellow",
      confidence: 72,
      selectedFactorKeys: ["speed", "control", "force"],
      answeredAt: "2026-07-03T18:10:00.000Z",
    },
    "sfp-high-contact-lunge": {
      caseId: "sfp-high-contact-lunge",
      selectedOptionId: "direct-free-kick-yellow",
      confidence: 91,
      selectedFactorKeys: ["speed", "studs"],
      answeredAt: "2026-07-04T18:25:00.000Z",
    },
    "handball-supporting-arm": {
      caseId: "handball-supporting-arm",
      selectedOptionId: "no-handball",
      confidence: 67,
      selectedFactorKeys: ["arm-position", "proximity", "silhouette"],
      answeredAt: "2026-07-05T17:40:00.000Z",
    },
    "handball-raised-arm": {
      caseId: "handball-raised-arm",
      selectedOptionId: "no-handball",
      confidence: 83,
      selectedFactorKeys: ["proximity", "deflection"],
      answeredAt: "2026-07-07T19:05:00.000Z",
    },
    "offside-line-of-vision": {
      caseId: "offside-line-of-vision",
      selectedOptionId: "offside-indirect-free-kick",
      confidence: 77,
      selectedFactorKeys: ["position", "line-of-vision", "opponent-impact"],
      answeredAt: "2026-07-09T20:15:00.000Z",
    },
  },
  savedCaseIds: ["sfp-high-contact-lunge", "offside-no-impact"],
  currentStreak: 4,
  temporaryComments: {},
  publishedDrafts: [],
  reports: [],
  removedCaseIds: [],
  onboardingComplete: false,
};

type TypedClient = SupabaseClient<Database>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// ---------------------------------------------------------------------------
// Row -> app-type mapping
// ---------------------------------------------------------------------------

function rowToUserAnswer(row: {
  case_id: string;
  selected_option_id: string;
  confidence: number;
  selected_factor_keys: string[];
  answered_at: string;
}): UserAnswer {
  return {
    caseId: row.case_id,
    selectedOptionId: row.selected_option_id,
    confidence: row.confidence,
    selectedFactorKeys: row.selected_factor_keys ?? [],
    answeredAt: row.answered_at,
  };
}

function publisherFromProfile(profile: {
  id: string;
  display_name: string;
  avatar_initials: string;
  role: string;
}): Publisher {
  return {
    id: profile.id,
    displayName: profile.display_name || "ClearCall learner",
    role: (profile.role as Publisher["role"]) || "learner",
    avatarInitials: profile.avatar_initials || "CC",
    isVerified: false,
    isSynthetic: false,
    disclosure: "Live discussion response posted by a signed-in ClearCall user.",
  };
}

function rowToDiscussionResponse(
  row: {
    id: string;
    case_id: string;
    body: string;
    selected_option_id: string;
    confidence: number | null;
    selected_factor_keys: string[];
    rule_citation: string | null;
    helpful_count: number;
    factor_reactions: unknown;
    created_at: string;
    is_pinned: boolean;
    is_verified_explanation: boolean;
  },
  author: Publisher,
): DiscussionResponse {
  return {
    id: row.id,
    caseId: row.case_id,
    author,
    body: row.body,
    selectedOptionId: row.selected_option_id,
    confidence: row.confidence ?? undefined,
    selectedFactorKeys: row.selected_factor_keys ?? [],
    ruleCitation: row.rule_citation ?? undefined,
    helpfulCount: row.helpful_count ?? 0,
    factorReactions: isRecord(row.factor_reactions)
      ? (row.factor_reactions as DiscussionResponse["factorReactions"])
      : {},
    postedAtLabel: new Date(row.created_at).toLocaleString(),
    isPinned: row.is_pinned,
    isVerifiedExplanation: row.is_verified_explanation,
    isSynthetic: false,
    disclosure: "Live discussion response posted by a signed-in ClearCall user.",
  };
}

function rowToPublishedDraft(row: {
  id: string;
  data: unknown;
  status: string;
  media_path: string | null;
  created_at: string;
}): PublishedCaseDraft | null {
  if (!isRecord(row.data)) return null;
  return {
    ...(row.data as unknown as PublishedCaseDraft),
    id: row.id,
    status: row.status === "locally-published" ? "locally-published" : "draft",
    createdAt: row.created_at,
    reviewStatus: "PENDING_EXPERT_REVIEW",
  };
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export interface ProfileMeta {
  currentStreak: number;
  onboardingComplete: boolean;
  displayName: string;
  avatarInitials: string;
  role: string;
}

export async function fetchProfileMeta(
  supabase: TypedClient,
  userId: string,
): Promise<ProfileMeta> {
  const { data } = await supabase
    .from("profiles")
    .select("current_streak, onboarding_complete, display_name, avatar_initials, role")
    .eq("id", userId)
    .maybeSingle();

  return {
    currentStreak: data?.current_streak ?? 0,
    onboardingComplete: data?.onboarding_complete ?? false,
    displayName: data?.display_name || "ClearCall learner",
    avatarInitials: data?.avatar_initials || "CC",
    role: data?.role || "learner",
  };
}

/**
 * Loads the full signed-in user's demo state from Supabase, reshaped into
 * the same {@link DemoState} contract the app used when it was backed by
 * localStorage. Returns {@link initialDemoState} on any unexpected failure
 * so the UI degrades gracefully rather than crashing.
 */
export async function fetchDemoState(
  supabase: TypedClient,
  userId: string,
): Promise<DemoState> {
  try {
    const [answersRes, savedRes, profileMeta, draftsRes, commentsRes] = await Promise.all([
      supabase.from("user_answers").select("*").eq("user_id", userId),
      supabase.from("saved_cases").select("case_id").eq("user_id", userId),
      fetchProfileMeta(supabase, userId),
      supabase
        .from("published_drafts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("discussion_responses")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
    ]);

    const answers: Record<string, UserAnswer> = {};
    for (const row of answersRes.data ?? []) {
      answers[row.case_id] = rowToUserAnswer(row);
    }

    const savedCaseIds = (savedRes.data ?? []).map((row) => row.case_id);

    const publishedDrafts = (draftsRes.data ?? [])
      .map(rowToPublishedDraft)
      .filter((draft): draft is PublishedCaseDraft => Boolean(draft));

    const author = publisherFromProfile({
      id: userId,
      display_name: profileMeta.displayName,
      avatar_initials: profileMeta.avatarInitials,
      role: profileMeta.role,
    });
    const temporaryComments: Record<string, DiscussionResponse[]> = {};
    for (const row of commentsRes.data ?? []) {
      const comment = rowToDiscussionResponse(row, author);
      temporaryComments[comment.caseId] = [
        ...(temporaryComments[comment.caseId] ?? []),
        comment,
      ];
    }

    return {
      answers,
      savedCaseIds,
      currentStreak: profileMeta.currentStreak,
      temporaryComments,
      publishedDrafts,
      reports: [],
      removedCaseIds: [],
      onboardingComplete: profileMeta.onboardingComplete,
    };
  } catch {
    return initialDemoState;
  }
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export async function submitAnswerRemote(
  supabase: TypedClient,
  userId: string,
  answer: UserAnswer,
  isNewAnswer: boolean,
): Promise<void> {
  await supabase.from("user_answers").upsert(
    {
      user_id: userId,
      case_id: answer.caseId,
      selected_option_id: answer.selectedOptionId,
      confidence: answer.confidence,
      selected_factor_keys: [...answer.selectedFactorKeys],
      answered_at: answer.answeredAt,
    },
    { onConflict: "user_id,case_id" },
  );

  if (isNewAnswer) {
    const meta = await fetchProfileMeta(supabase, userId);
    await supabase
      .from("profiles")
      .update({ current_streak: meta.currentStreak + 1 })
      .eq("id", userId);
  }
}

export async function toggleSavedRemote(
  supabase: TypedClient,
  userId: string,
  caseId: string,
  willSave: boolean,
): Promise<void> {
  if (willSave) {
    await supabase.from("saved_cases").upsert(
      { user_id: userId, case_id: caseId },
      { onConflict: "user_id,case_id" },
    );
  } else {
    await supabase
      .from("saved_cases")
      .delete()
      .eq("user_id", userId)
      .eq("case_id", caseId);
  }
}

export async function addCommentRemote(
  supabase: TypedClient,
  userId: string,
  caseId: string,
  comment: DiscussionResponse,
): Promise<DiscussionResponse | null> {
  const { data } = await supabase.from("discussion_responses").insert({
    case_id: caseId,
    user_id: userId,
    body: comment.body,
    selected_option_id: comment.selectedOptionId,
    confidence: comment.confidence ?? null,
    selected_factor_keys: [...comment.selectedFactorKeys],
    rule_citation: comment.ruleCitation ?? null,
    helpful_count: 0,
    is_pinned: false,
    is_verified_explanation: false,
    factor_reactions: {},
  }).select("*").single();
  return data ? rowToDiscussionResponse(data, comment.author) : null;
}

export async function completeOnboardingRemote(
  supabase: TypedClient,
  userId: string,
): Promise<void> {
  await supabase
    .from("profiles")
    .update({ onboarding_complete: true })
    .eq("id", userId);
}

/**
 * Uploads optional media to the `case-media` bucket under the user's own
 * auth uid (required by storage RLS) and inserts a published_drafts row.
 */
export async function publishDraftRemote(
  supabase: TypedClient,
  userId: string,
  draft: PublishedCaseDraft,
  file: File | null,
): Promise<PublishedCaseDraft> {
  if (typeof window !== "undefined") {
    const form = new FormData();
    form.set("sport", "soccer");
    form.set("incident", draft.description);
    form.set("rule category", draft.category);
    form.set("original decision", draft.originalDecision);
    form.set("description", draft.description);
    form.set("options", JSON.stringify(draft.answerOptions));
    form.set(
      "difficulty",
      draft.difficulty === "beginner"
        ? "0.25"
        : draft.difficulty === "advanced"
          ? "0.75"
          : "0.5",
    );
    if (file) form.set("clip", file);
    const response = await fetch("/api/cases", { method: "POST", body: form });
    if (!response.ok) throw new Error("Case creation failed");
    const result = await response.json() as { case?: { id?: string } };
    return { ...draft, id: result.case?.id ?? draft.id, status: "locally-published" };
  }

  let mediaPath: string | null = null;

  if (file) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${userId}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("case-media")
      .upload(path, file, { upsert: false });
    if (!uploadError) mediaPath = path;
  }

  const { data, error } = await supabase
    .from("published_drafts")
    .insert({
      user_id: userId,
      status: draft.status,
      review_status: "PENDING_EXPERT_REVIEW",
      media_path: mediaPath,
      data: draft as unknown as Database["public"]["Tables"]["published_drafts"]["Insert"]["data"],
    })
    .select("*")
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to publish draft.");
  }

  return { ...draft, id: data.id, createdAt: data.created_at };
}
