import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AnswerOption,
  CaseReport,
  DecisionAttempt,
  DiscussionResponse,
  FactorReactionCounts,
  PublishedCaseDraft,
  Publisher,
  RuleFactor,
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
 * Empty guest baseline after signing out of the Jordan Lee demo (or a real
 * account). Feed and profile still render, but with no personal progress.
 */
export const emptyGuestState: DemoState = {
  answers: {},
  savedCaseIds: [],
  currentStreak: 0,
  temporaryComments: {},
  publishedDrafts: [],
  reports: [],
  removedCaseIds: [],
  onboardingComplete: false,
};

/**
 * Seeded baseline for the local Jordan Lee demo session. Real signed-in users
 * load their state from Supabase via {@link fetchDemoState}.
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

export const DEMO_SESSION_KEY = "clearcall-demo-session";

export function readDemoSessionPreference(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const stored = window.localStorage.getItem(DEMO_SESSION_KEY);
    if (stored === null) return true;
    return stored === "1";
  } catch {
    return true;
  }
}

export function writeDemoSessionPreference(active: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DEMO_SESSION_KEY, active ? "1" : "0");
  } catch {
    // Ignore quota / private-mode failures; in-memory state still works.
  }
}

type TypedClient = SupabaseClient<Database>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}


const STORAGE_KEY = "clearcall-demo-v1";
const STORAGE_VERSION = 1;

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return isFiniteNumber(value) && Number.isInteger(value) && value >= 0;
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string";
}

function isOptionalBoundedNumber(value: unknown): value is number | undefined {
  return value === undefined || (isFiniteNumber(value) && value >= 0 && value <= 100);
}

const USER_ROLES = new Set([
  "learner",
  "referee",
  "verified_referee",
  "educator",
]);

const DIFFICULTIES = new Set(["beginner", "intermediate", "advanced"]);

const CASE_CATEGORIES = new Set([
  "Serious foul play",
  "Handball",
  "Offside interference",
  "Denial of an obvious goal-scoring opportunity",
  "Advantage",
  "Simulation",
  "Goalkeeper handling",
]);

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

function isDecisionAttempt(value: unknown): value is DecisionAttempt {
  return (
    isRecord(value) &&
    typeof value.selectedOptionId === "string" &&
    isFiniteNumber(value.confidence) &&
    value.confidence >= 50 &&
    value.confidence <= 100 &&
    isStringArray(value.selectedFactorKeys) &&
    typeof value.answeredAt === "string"
  );
}

function isUserAnswer(value: unknown): value is UserAnswer {
  if (!isRecord(value) || !isDecisionAttempt(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.caseId === "string" &&
    (candidate.initialAttempt === undefined || isDecisionAttempt(candidate.initialAttempt)) &&
    (candidate.revisionCount === undefined || isNonNegativeInteger(candidate.revisionCount))
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

function isFactorReactionCounts(value: unknown): value is FactorReactionCounts {
  return (
    isRecord(value) &&
    isNonNegativeInteger(value.agree) &&
    isNonNegativeInteger(value.disagree)
  );
}

function isFactorReactions(
  value: unknown,
): value is Readonly<Record<string, FactorReactionCounts>> {
  return (
    isRecord(value) &&
    Object.values(value).every(isFactorReactionCounts)
  );
}

function readAnswers(value: unknown): Record<string, UserAnswer> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, UserAnswer] => isUserAnswer(entry[1]),
    ),
  );
}

function isDiscussionResponse(value: unknown): value is DiscussionResponse {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.caseId === "string" &&
    typeof value.body === "string" &&
    typeof value.selectedOptionId === "string" &&
    isOptionalBoundedNumber(value.confidence) &&
    isStringArray(value.selectedFactorKeys) &&
    isOptionalString(value.ruleCitation) &&
    isNonNegativeInteger(value.helpfulCount) &&
    isFactorReactions(value.factorReactions) &&
    typeof value.postedAtLabel === "string" &&
    typeof value.isPinned === "boolean" &&
    typeof value.isVerifiedExplanation === "boolean" &&
    typeof value.isSynthetic === "boolean" &&
    typeof value.disclosure === "string" &&
    isPublisher(value.author)
  );
}

function readComments(value: unknown): Record<string, DiscussionResponse[]> {
  if (!isRecord(value)) return {};
  const validEntries = Object.entries(value)
    .filter((entry): entry is [string, unknown[]] => Array.isArray(entry[1]))
    .map(([caseId, comments]) => [
      caseId,
      comments.filter(
        (comment): comment is DiscussionResponse =>
          isDiscussionResponse(comment) && comment.caseId === caseId,
      ),
    ] as const);
  return Object.fromEntries(validEntries);
}

function isAnswerOption(value: unknown): value is AnswerOption {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    typeof value.shortLabel === "string" &&
    typeof value.description === "string"
  );
}

function isRuleFactor(value: unknown): value is RuleFactor {
  return (
    isRecord(value) &&
    typeof value.key === "string" &&
    typeof value.label === "string" &&
    typeof value.value === "string" &&
    typeof value.supportsRecommendation === "boolean" &&
    typeof value.explanation === "string"
  );
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

export function writeDemoState(state: DemoState): boolean {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: STORAGE_VERSION, state }),
    );
    return true;
  } catch {
    return false;
  }
}

export function clearDemoState(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
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
  initial_selected_option_id: string | null;
  initial_confidence: number | null;
  initial_selected_factor_keys: string[] | null;
  initial_answered_at: string | null;
  revision_count: number;
}): UserAnswer {
  const initialAttempt: DecisionAttempt = {
    selectedOptionId: row.initial_selected_option_id ?? row.selected_option_id,
    confidence: row.initial_confidence ?? row.confidence,
    selectedFactorKeys: row.initial_selected_factor_keys ?? row.selected_factor_keys ?? [],
    answeredAt: row.initial_answered_at ?? row.answered_at,
  };
  return {
    caseId: row.case_id,
    selectedOptionId: row.selected_option_id,
    confidence: row.confidence,
    selectedFactorKeys: row.selected_factor_keys ?? [],
    answeredAt: row.answered_at,
    initialAttempt,
    revisionCount: Math.max(0, row.revision_count ?? 0),
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
  const initial = answer.initialAttempt ?? answer;
  const { error } = await supabase.from("user_answers").upsert(
    {
      user_id: userId,
      case_id: answer.caseId,
      selected_option_id: answer.selectedOptionId,
      confidence: answer.confidence,
      selected_factor_keys: [...answer.selectedFactorKeys],
      answered_at: answer.answeredAt,
      initial_selected_option_id: initial.selectedOptionId,
      initial_confidence: initial.confidence,
      initial_selected_factor_keys: [...initial.selectedFactorKeys],
      initial_answered_at: initial.answeredAt,
      revision_count: answer.revisionCount ?? 0,
    },
    { onConflict: "user_id,case_id" },
  );

  if (error) throw error;

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
