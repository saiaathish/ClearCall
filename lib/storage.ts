import type {
  AnswerOption,
  DiscussionResponse,
  FactorReactionCounts,
  PublishedCaseDraft,
  Publisher,
  RuleFactor,
  UserAnswer,
} from "@/lib/types";

const STORAGE_KEY = "clearcall-demo-v1";
const STORAGE_VERSION = 1;

export interface DemoState {
  answers: Record<string, UserAnswer>;
  savedCaseIds: string[];
  currentStreak: number;
  temporaryComments: Record<string, DiscussionResponse[]>;
  publishedDrafts: PublishedCaseDraft[];
  onboardingComplete: boolean;
}

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
  onboardingComplete: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

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
