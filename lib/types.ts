export type ScenarioStatus =
  | "VERIFIED_RULING"
  | "EXPERT_CONSENSUS"
  | "OPEN_DISCUSSION";

export type Difficulty = "beginner" | "intermediate" | "advanced";

export type MediaKind = "text" | "image" | "video";

export type UserRole =
  | "learner"
  | "referee"
  | "verified_referee"
  | "educator";

export type CaseCategory =
  | "Serious foul play"
  | "Handball"
  | "Offside interference"
  | "Denial of an obvious goal-scoring opportunity"
  | "Advantage"
  | "Simulation"
  | "Goalkeeper handling";

export type DistributionBasis =
  | "authored_demo"
  | "live_community"
  | "verified_reviewers"
  | "learners";

export type SourceType =
  | "authored-demo"
  | "team-recorded"
  | "used-with-permission"
  | "open-license"
  | "external-embed";

export type PermissionStatus =
  | "demo-only"
  | "confirmed"
  | "pending-review";

export interface AnswerOption {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
}

export interface RuleFactor {
  /** Stable key used for answer selection, comparison, and profile derivation. */
  key: string;
  label: string;
  value: string;
  supportsRecommendation: boolean;
  explanation: string;
}

export interface Distribution {
  label: string;
  /** Percentages keyed by AnswerOption.id. Values should total 100. */
  percentages: Readonly<Record<string, number>>;
  basis: DistributionBasis;
  isSynthetic: boolean;
  disclaimer: string;
}

export interface Publisher {
  id: string;
  displayName: string;
  role: UserRole;
  organization?: string;
  avatarInitials: string;
  isVerified: boolean;
  isSynthetic: boolean;
  disclosure: string;
}

export interface FactorReactionCounts {
  agree: number;
  disagree: number;
}

export interface DiscussionResponse {
  id: string;
  caseId: string;
  author: Publisher;
  body: string;
  selectedOptionId: string;
  confidence?: number;
  selectedFactorKeys: readonly string[];
  ruleCitation?: string;
  helpfulCount: number;
  factorReactions: Readonly<Record<string, FactorReactionCounts>>;
  postedAtLabel: string;
  isPinned: boolean;
  isVerifiedExplanation: boolean;
  isSynthetic: boolean;
  disclosure: string;
}

export interface OfficiatingCase {
  id: string;
  slug: string;
  sport: "soccer";
  title: string;
  prompt: string;
  description: string;
  competitionLevel: string;
  difficulty: Difficulty;
  category: CaseCategory;
  scenarioStatus: ScenarioStatus;
  originalDecision: string;
  answerOptions: readonly AnswerOption[];
  /** AnswerOption.id supported by the authored demo rationale. */
  recommendedDecision: string;
  expertExplanation: string;
  ruleReference: string;
  ruleset: string;
  rulesetVersion: string;
  rulePath: readonly string[];
  factors: readonly RuleFactor[];
  /** RuleFactor.key that most directly separates the recommended outcomes. */
  criticalFactor: string;
  publisher: Publisher;
  communityDistribution: Distribution;
  verifiedDistribution: Distribution;
  learnerDistribution: Distribution;
  disagreementScore: number;
  freshnessScore: number;
  publishedAt: string;
  /**
   * Legacy seeded cases may omit this field. Consumers should infer `video`
   * when `videoSrc` is present and `text` otherwise.
   */
  mediaKind?: MediaKind;
  /** Optional image source retained alongside the existing video fields. */
  imageSrc?: string | null;
  /** Intrinsic source dimensions, when the media asset provides them. */
  mediaWidth?: number | null;
  mediaHeight?: number | null;
  videoSrc: string | null;
  posterSrc: string | null;
  mediaAlt: string;
  sourceType: SourceType;
  permissionStatus: PermissionStatus;
  similarCaseIds: readonly string[];
  seededDiscussion: readonly DiscussionResponse[];
  isDemo: boolean;
  reviewState: "DEMO_REVIEW_REQUIRED" | "QUALIFIED_REVIEW_COMPLETE";
  reviewDisclaimer: string;
}

export interface UserAnswer {
  caseId: string;
  /** Stable AnswerOption.id; never the visible label. */
  selectedOptionId: string;
  confidence: number;
  /** Stable RuleFactor.key values; never the visible labels. */
  selectedFactorKeys: readonly string[];
  answeredAt: string;
}

export interface PerformanceBreakdown {
  key: string;
  label: string;
  answered: number;
  correct: number;
  /** Percentage from 0–100, or null when there is no evidence yet. */
  accuracy: number | null;
}

export type CalibrationLabel =
  | "Not enough data"
  | "Well calibrated"
  | "Slightly overconfident"
  | "Overconfident"
  | "Slightly underconfident"
  | "Underconfident";

export interface LearnerProfile {
  id: string;
  displayName: string;
  avatarInitials: string;
  role: "learner";
  currentLevel: Difficulty;
  currentStreak: number;
  completedCases: number;
  savedCases: number;
  overallAccuracy: number;
  calibrationScore: number;
  calibrationLabel: CalibrationLabel;
  averageConfidence: number;
  highConfidenceErrors: number;
  categoryAccuracy: readonly PerformanceBreakdown[];
  difficultyAccuracy: readonly PerformanceBreakdown[];
  recentImprovement: number | null;
  weakestCategory: string | null;
  strongestCategory: string | null;
  mostCommonReasoningMistake: string;
  recommendedCaseId: string | null;
}

export interface PublishedCaseDraft {
  id: string;
  mediaKind: MediaKind;
  /** Serializable metadata only. Local file contents and object URLs are never persisted. */
  mediaFileName?: string;
  mediaFileSize?: number;
  mediaFileType?: string;
  mediaWidth?: number;
  mediaHeight?: number;
  mediaAlt: string;
  /** Legacy video metadata retained for existing browser-local drafts. */
  clipFileName?: string;
  clipFileSize?: number;
  clipFileType?: string;
  clipStartTime?: string;
  clipEndTime?: string;
  posterFrameLabel?: string;
  title: string;
  prompt: string;
  description: string;
  competitionLevel: string;
  difficulty: Difficulty;
  category: CaseCategory;
  originalDecision: string;
  scenarioStatus: ScenarioStatus;
  answerOptions: readonly AnswerOption[];
  recommendedDecision: string;
  factors: readonly RuleFactor[];
  criticalFactor: string;
  rulePath: readonly string[];
  ruleReference: string;
  expertExplanation: string;
  ruleset: string;
  rulesetVersion: string;
  sourceType: SourceType;
  sourceAttribution: string;
  permissionStatus: PermissionStatus;
  permissionConfirmed: boolean;
  createdAt: string;
  status: "draft" | "locally-published";
  reviewStatus: "PENDING_EXPERT_REVIEW";
}

export interface SimilarityBreakdown {
  factorOverlap: number;
  rulePathOverlap: number;
  competitionContextSimilarity: number;
  difficultyProximity: number;
  disagreementSimilarity: number;
}

export interface SimilarityResult {
  eligible: boolean;
  /** Weighted percentage from 0–100. */
  score: number;
  breakdown: SimilarityBreakdown;
}

export type ComparisonValue =
  | "High teaching contrast"
  | "Useful teaching contrast"
  | "Similar outcome review";

export interface TeachingContrast {
  case: OfficiatingCase;
  similarityScore: number;
  /** Similarity score plus a transparent 20-point differing-outcome bonus. */
  teachingScore: number;
  comparisonValue: ComparisonValue;
  reason: string;
  criticalDifferences: readonly string[];
}

export interface FeedScoreBreakdown {
  categoryWeakness: number;
  highConfidenceErrorNeed: number;
  difficultyFit: number;
  diversityValue: number;
  freshnessScore: number;
}

export interface RankedCase {
  case: OfficiatingCase;
  /** Weighted percentage from 0–100. */
  score: number;
  reason: string;
  breakdown: FeedScoreBreakdown;
}

export interface FeedRankingOptions {
  currentLevel?: Difficulty;
  recentCategoryWindow?: number;
  excludeCaseIds?: readonly string[];
}

export interface ProfileDerivationOptions {
  id?: string;
  displayName?: string;
  avatarInitials?: string;
  savedCaseIds?: readonly string[];
  currentStreak?: number;
}
