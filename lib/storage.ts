import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AnswerOption,
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

const SCENARIO_STATUSES = new Set([
  "VERIFIED_RULING",
  "EXPERT_CONSENSUS",
  "OPEN_DISCUSSION",
]);

const SOURCE_TYPES = new Set([
  "authored-demo",
  "team-recorded",
  "used-with-permission",
  "open-license",
  "external-embed",
]);

const PERMISSION_STATUSES = new Set([
  "demo-only",
  "confirmed",
  "pending-review",
]);

const MEDIA_KINDS = new Set(["text", "image", "video"]);

const REPORT_REASONS = new Set([
  "copyright",
  "inaccurate",
  "inappropriate",
  "spam",
  "other",
]);

const REPORT_STATUSES = new Set(["open", "removed"]);

function isOneOf(value: unknown, allowed: ReadonlySet<string>): value is string {
  return typeof value === "string" && allowed.has(value);
}

function isUserAnswer(value: unknown): value is UserAnswer {
  return (
    isRecord(value) &&
    typeof value.caseId === "string" &&
    typeof value.selectedOptionId === "string" &&
    isFiniteNumber(value.confidence) &&
    value.confidence >= 50 &&
    value.confidence <= 100 &&
    isStringArray(value.selectedFactorKeys) &&
    typeof value.answeredAt === "string"
  );
}

function isPublisher(value: unknown): value is Publisher {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.displayName === "string" &&
    isOneOf(value.role, USER_ROLES) &&
    isOptionalString(value.organization) &&
    typeof value.avatarInitials === "string" &&
    typeof value.isVerified === "boolean" &&
    typeof value.isSynthetic === "boolean" &&
    typeof value.disclosure === "string"
  );
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

function isCaseReport(value: unknown): value is CaseReport {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.caseId === "string" &&
    isOneOf(value.reason, REPORT_REASONS) &&
    typeof value.details === "string" &&
    typeof value.reportedAt === "string" &&
    isOneOf(value.status, REPORT_STATUSES)
  );
}

function readReports(value: unknown): CaseReport[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isCaseReport);
}

function readPublishedDraft(value: unknown): PublishedCaseDraft | null {
  if (!isRecord(value)) return null;
  const mediaKind = isOneOf(value.mediaKind, MEDIA_KINDS)
    ? value.mediaKind as PublishedCaseDraft["mediaKind"]
    : typeof value.clipFileName === "string"
      ? "video"
      : "text";
  const mediaAlt = typeof value.mediaAlt === "string"
    ? value.mediaAlt
    : typeof value.posterFrameLabel === "string"
      ? value.posterFrameLabel
      : typeof value.description === "string"
        ? value.description
        : "";

  const valid = (
    typeof value.id === "string" &&
    isOptionalString(value.mediaFileName) &&
    (value.mediaFileSize === undefined || isNonNegativeInteger(value.mediaFileSize)) &&
    isOptionalString(value.mediaFileType) &&
    (value.mediaWidth === undefined || isNonNegativeInteger(value.mediaWidth)) &&
    (value.mediaHeight === undefined || isNonNegativeInteger(value.mediaHeight)) &&
    isOptionalString(value.clipFileName) &&
    (value.clipFileSize === undefined || isNonNegativeInteger(value.clipFileSize)) &&
    isOptionalString(value.clipFileType) &&
    isOptionalString(value.clipStartTime) &&
    isOptionalString(value.clipEndTime) &&
    isOptionalString(value.posterFrameLabel) &&
    typeof value.title === "string" &&
    typeof value.prompt === "string" &&
    typeof value.description === "string" &&
    typeof value.competitionLevel === "string" &&
    isOneOf(value.difficulty, DIFFICULTIES) &&
    isOneOf(value.category, CASE_CATEGORIES) &&
    typeof value.originalDecision === "string" &&
    isOneOf(value.scenarioStatus, SCENARIO_STATUSES) &&
    Array.isArray(value.answerOptions) &&
    value.answerOptions.every(isAnswerOption) &&
    typeof value.recommendedDecision === "string" &&
    Array.isArray(value.factors) &&
    value.factors.every(isRuleFactor) &&
    typeof value.criticalFactor === "string" &&
    isStringArray(value.rulePath) &&
    typeof value.ruleReference === "string" &&
    typeof value.expertExplanation === "string" &&
    typeof value.ruleset === "string" &&
    typeof value.rulesetVersion === "string" &&
    isOneOf(value.sourceType, SOURCE_TYPES) &&
    typeof value.sourceAttribution === "string" &&
    isOneOf(value.permissionStatus, PERMISSION_STATUSES) &&
    typeof value.permissionConfirmed === "boolean" &&
    typeof value.createdAt === "string" &&
    (value.status === "draft" || value.status === "locally-published") &&
    value.reviewStatus === "PENDING_EXPERT_REVIEW"
  );
  if (!valid) return null;
  return { ...value, mediaKind, mediaAlt } as unknown as PublishedCaseDraft;
}

export function readDemoState(): DemoState {
  if (typeof window === "undefined") return initialDemoState;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialDemoState;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return initialDemoState;
    const candidate =
      parsed.version === STORAGE_VERSION && isRecord(parsed.state)
        ? parsed.state
        : parsed;

    return {
      answers: readAnswers(candidate.answers),
      savedCaseIds: Array.isArray(candidate.savedCaseIds)
        ? candidate.savedCaseIds.filter((id): id is string => typeof id === "string")
        : [],
      currentStreak:
        typeof candidate.currentStreak === "number" && Number.isFinite(candidate.currentStreak)
          ? Math.max(0, Math.floor(candidate.currentStreak))
          : initialDemoState.currentStreak,
      temporaryComments: readComments(candidate.temporaryComments),
      publishedDrafts: Array.isArray(candidate.publishedDrafts)
        ? candidate.publishedDrafts
            .map(readPublishedDraft)
            .filter((draft): draft is PublishedCaseDraft => Boolean(draft))
        : [],
      reports: readReports(candidate.reports),
      removedCaseIds: Array.isArray(candidate.removedCaseIds)
        ? candidate.removedCaseIds.filter((id): id is string => typeof id === "string")
        : [],
      onboardingComplete:
        typeof candidate.onboardingComplete === "boolean"
          ? candidate.onboardingComplete
          : false,
    };
  } catch {
    return initialDemoState;
  }
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

export async function publishDraftRemote(
  supabase: SupabaseClient,
  userId: string,
  draft: PublishedCaseDraft,
  file: File | null,
): Promise<PublishedCaseDraft> {
  let mediaPath: string | null = null;

  if (file) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${userId}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("case-media")
      .upload(path, file, { upsert: false });
    if (!uploadError) {
      mediaPath = path;
    }
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

  return {
    ...draft,
    id: data.id,
    createdAt: data.created_at,
  };
}
