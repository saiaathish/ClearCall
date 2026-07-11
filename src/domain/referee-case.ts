export const CASE_SCHEMA_VERSION = 1 as const;

export const DECISION_CODES = [
  "no-offence",
  "penalty-no-card",
  "penalty-yellow-card",
  "penalty-red-card",
] as const;

export type DecisionCode = (typeof DECISION_CODES)[number];
export type ScenarioType = "objective" | "interpretive" | "discussion";
export type LearningLevel = "beginner" | "intermediate" | "advanced";
export type DisciplinaryAction = "none" | "yellow-card" | "red-card";
export type RecommendationConfidence = "high" | "medium" | "low";

export interface DecisionOption {
  code: DecisionCode;
  label: string;
}

export interface RuleFactor {
  id: string;
  label: string;
  observation: string;
  relevance: "supports-offence" | "supports-no-offence" | "disciplinary";
}

export interface ReasoningStep {
  order: number;
  factorIds: readonly string[];
  conclusion: string;
}

export interface AlternativeInterpretation {
  decisionCode: DecisionCode;
  rationale: string;
  evidenceThatWouldChangeCall: string;
}

export interface RuleSource {
  publisher: "The IFAB";
  document: "Laws of the Game";
  edition: "2026/27";
  law: "Law 12 — Fouls and Misconduct";
  sections: readonly string[];
  sourceUrl: "https://www.theifab.com/laws/latest/fouls-and-misconduct/";
  accessedOn: "2026-07-10";
  verificationStatus: "official-source-checked";
  wordingPolicy: "clearcall-paraphrase-not-official-quotation";
}

export interface MediaReference {
  assetStatus: "recording-required" | "authorized-local" | "licensed-external";
  mediaType: "original-staged-video" | "original-animation";
  authorizationStatus: "not-created" | "team-owned" | "licensed-and-documented";
  localPath: string | null;
  sourceUrl: string | null;
  altText: string;
  shotList: readonly string[];
}

export interface DecisionTally {
  cohortLabel: string;
  sampleSize: 100;
  counts: Readonly<Record<DecisionCode, number>>;
}

export interface SeededDistributions {
  provenance: "synthetic-demo-fixture";
  label: "Simulated demo data";
  disclaimer: string;
  community: DecisionTally;
  verifiedReferees: DecisionTally;
}

export interface ExpertReasoningFixture {
  status: "editorial-fixture-expert-review-pending";
  reviewer: null;
  summary: string;
  alternativeView: string;
  disclosure: string;
}

export interface ConfidenceCalibration {
  enabled: true;
  prompt: string;
  suggestedBands: readonly [25, 50, 75, 100];
  feedbackFocus: string;
}

export interface RefereeCase {
  schemaVersion: typeof CASE_SCHEMA_VERSION;
  id: string;
  scenarioFingerprint: string;
  title: string;
  sport: "soccer";
  competitionContext: "Adult association football under IFAB Laws of the Game 2026/27";
  incidentCategory: "handball";
  incidentSubcategory: string;
  scenarioType: ScenarioType;
  difficulty: "hard";
  learningLevel: LearningLevel;
  shortPrompt: string;
  scenario: string;
  availableDecisions: readonly DecisionOption[];
  recommendedDecisionCode: DecisionCode;
  recommendedOutcome: {
    restart: "penalty-kick";
    disciplinaryAction: DisciplinaryAction;
    confidence: RecommendationConfidence;
    basisStatus: "editorial-demo-recommendation";
  };
  ruleFactors: readonly RuleFactor[];
  reasoningPath: readonly ReasoningStep[];
  plainLanguageExplanation: string;
  learningObjective: string;
  alternativeInterpretations: readonly AlternativeInterpretation[];
  expertReasoning: ExpertReasoningFixture;
  ruleSource: RuleSource;
  publisherType: "clearcall-original-synthetic-scenario";
  verificationStatus: "rule-source-checked-domain-review-pending";
  tags: readonly string[];
  relatedCaseIds: readonly string[];
  media: MediaReference;
  seededDistributions: SeededDistributions;
  discussionPrompt: string;
  confidenceCalibration: ConfidenceCalibration;
}
