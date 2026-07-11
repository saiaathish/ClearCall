import {
  CASE_SCHEMA_VERSION,
  DECISION_CODES,
  type DecisionCode,
} from "../domain/referee-case.ts";
import {
  DEMO_CASE_ID,
  DEMO_COMPARISON_CASE_ID,
} from "../data/referee-cases.ts";

export interface ValidationIssue {
  path: string;
  message: string;
}

type UnknownRecord = Record<string, unknown>;

const SCENARIO_TYPES = new Set(["objective", "interpretive", "discussion"]);
const LEARNING_LEVELS = new Set(["beginner", "intermediate", "advanced"]);
const DISCIPLINARY_ACTIONS = new Set(["none", "yellow-card", "red-card"]);

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function readRecord(value: unknown): UnknownRecord | null {
  return isRecord(value) ? value : null;
}

function readArray(value: unknown): readonly unknown[] | null {
  return Array.isArray(value) ? value : null;
}

function addIf(
  issues: ValidationIssue[],
  invalid: boolean,
  path: string,
  message: string,
): void {
  if (invalid) issues.push({ path, message });
}

function validateDistribution(
  value: unknown,
  path: string,
  decisionCodes: ReadonlySet<string>,
  issues: ValidationIssue[],
): void {
  const distribution = readRecord(value);
  if (!distribution) {
    issues.push({ path, message: "must be an object" });
    return;
  }

  addIf(
    issues,
    distribution.provenance !== "synthetic-demo-fixture",
    `${path}.provenance`,
    "must identify synthetic demo provenance",
  );
  addIf(
    issues,
    distribution.label !== "Simulated demo data",
    `${path}.label`,
    "must use the standard simulated-data label",
  );
  const disclaimer = distribution.disclaimer;
  addIf(
    issues,
    !isNonEmptyString(disclaimer) ||
      !disclaimer.toLowerCase().includes("not live") ||
      !disclaimer.toLowerCase().includes("not an expert survey"),
    `${path}.disclaimer`,
    "must state that values are not live and not an expert survey",
  );

  for (const cohortKey of ["community", "verifiedReferees"] as const) {
    const cohortPath = `${path}.${cohortKey}`;
    const cohort = readRecord(distribution[cohortKey]);
    if (!cohort) {
      issues.push({ path: cohortPath, message: "must be an object" });
      continue;
    }
    addIf(
      issues,
      !isNonEmptyString(cohort.cohortLabel) ||
        !cohort.cohortLabel.toLowerCase().includes("simulated"),
      `${cohortPath}.cohortLabel`,
      "must visibly label the cohort as simulated",
    );
    addIf(
      issues,
      cohort.sampleSize !== 100,
      `${cohortPath}.sampleSize`,
      "must equal the 100-response fixture size",
    );

    const counts = readRecord(cohort.counts);
    if (!counts) {
      issues.push({
        path: `${cohortPath}.counts`,
        message: "must be an object",
      });
      continue;
    }
    const keys = Object.keys(counts);
    addIf(
      issues,
      keys.length !== decisionCodes.size ||
        keys.some((key) => !decisionCodes.has(key)),
      `${cohortPath}.counts`,
      "must contain every available decision exactly once",
    );
    let total = 0;
    for (const code of decisionCodes) {
      const count = counts[code];
      addIf(
        issues,
        !Number.isInteger(count) || Number(count) < 0,
        `${cohortPath}.counts.${code}`,
        "must be a non-negative integer",
      );
      if (typeof count === "number") total += count;
    }
    addIf(
      issues,
      total !== cohort.sampleSize,
      `${cohortPath}.counts`,
      "must sum to sampleSize",
    );
  }
}

export function validateRefereeCases(value: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const cases = readArray(value);
  if (!cases) return [{ path: "$", message: "must be an array" }];

  addIf(
    issues,
    cases.length < 10 || cases.length > 15,
    "$",
    "must contain 10–15 cases for issue #13",
  );

  const ids = new Map<string, number>();
  const fingerprints = new Map<string, number>();
  const titles = new Map<string, number>();
  const relatedById = new Map<string, readonly string[]>();
  const scenarioTypes = new Set<string>();
  const learningLevels = new Set<string>();
  const casesById = new Map<string, UnknownRecord>();

  for (const [index, rawCase] of cases.entries()) {
    const base = `$[${index}]`;
    const item = readRecord(rawCase);
    if (!item) {
      issues.push({ path: base, message: "must be an object" });
      continue;
    }

    const requiredStrings = [
      "id",
      "scenarioFingerprint",
      "title",
      "sport",
      "competitionContext",
      "incidentCategory",
      "incidentSubcategory",
      "scenarioType",
      "difficulty",
      "learningLevel",
      "shortPrompt",
      "scenario",
      "recommendedDecisionCode",
      "plainLanguageExplanation",
      "learningObjective",
      "publisherType",
      "verificationStatus",
      "discussionPrompt",
    ] as const;
    for (const key of requiredStrings) {
      addIf(
        issues,
        !isNonEmptyString(item[key]),
        `${base}.${key}`,
        "must be a non-empty string",
      );
    }

    addIf(
      issues,
      item.schemaVersion !== CASE_SCHEMA_VERSION,
      `${base}.schemaVersion`,
      `must equal ${CASE_SCHEMA_VERSION}`,
    );
    addIf(issues, item.sport !== "soccer", `${base}.sport`, "must be soccer");
    addIf(
      issues,
      item.incidentCategory !== "handball",
      `${base}.incidentCategory`,
      "must be handball",
    );
    addIf(
      issues,
      item.difficulty !== "hard",
      `${base}.difficulty`,
      "must preserve issue #13's hard difficulty",
    );
    addIf(
      issues,
      !SCENARIO_TYPES.has(String(item.scenarioType)),
      `${base}.scenarioType`,
      "must be objective, interpretive, or discussion",
    );
    addIf(
      issues,
      !LEARNING_LEVELS.has(String(item.learningLevel)),
      `${base}.learningLevel`,
      "must be beginner, intermediate, or advanced",
    );

    if (isNonEmptyString(item.id)) {
      addIf(
        issues,
        !/^soccer-handball-\d{3}$/.test(item.id),
        `${base}.id`,
        "must match soccer-handball-NNN",
      );
      if (ids.has(item.id)) {
        issues.push({ path: `${base}.id`, message: "must be unique" });
      } else {
        ids.set(item.id, index);
        casesById.set(item.id, item);
      }
    }
    if (isNonEmptyString(item.scenarioFingerprint)) {
      if (fingerprints.has(item.scenarioFingerprint)) {
        issues.push({
          path: `${base}.scenarioFingerprint`,
          message: "must be unique to prevent duplicate scenarios",
        });
      } else fingerprints.set(item.scenarioFingerprint, index);
    }
    if (isNonEmptyString(item.title)) {
      const normalizedTitle = item.title.trim().toLowerCase();
      if (titles.has(normalizedTitle)) {
        issues.push({ path: `${base}.title`, message: "must be unique" });
      } else titles.set(normalizedTitle, index);
    }
    if (isNonEmptyString(item.scenarioType))
      scenarioTypes.add(item.scenarioType);
    if (isNonEmptyString(item.learningLevel))
      learningLevels.add(item.learningLevel);

    const availableDecisions = readArray(item.availableDecisions);
    const decisionCodes = new Set<string>();
    if (
      !availableDecisions ||
      availableDecisions.length !== DECISION_CODES.length
    ) {
      issues.push({
        path: `${base}.availableDecisions`,
        message: "must contain the four canonical choices",
      });
    } else {
      for (const [decisionIndex, rawDecision] of availableDecisions.entries()) {
        const decision = readRecord(rawDecision);
        if (!decision) {
          issues.push({
            path: `${base}.availableDecisions[${decisionIndex}]`,
            message: "must be an object",
          });
          continue;
        }
        addIf(
          issues,
          !DECISION_CODES.includes(decision.code as DecisionCode),
          `${base}.availableDecisions[${decisionIndex}].code`,
          "must be a canonical decision code",
        );
        addIf(
          issues,
          !isNonEmptyString(decision.label),
          `${base}.availableDecisions[${decisionIndex}].label`,
          "must be a non-empty string",
        );
        if (isNonEmptyString(decision.code)) decisionCodes.add(decision.code);
      }
      addIf(
        issues,
        decisionCodes.size !== DECISION_CODES.length,
        `${base}.availableDecisions`,
        "must not contain duplicate decision codes",
      );
    }
    addIf(
      issues,
      !decisionCodes.has(String(item.recommendedDecisionCode)),
      `${base}.recommendedDecisionCode`,
      "must appear in availableDecisions",
    );
    addIf(
      issues,
      !String(item.recommendedDecisionCode).startsWith("penalty-"),
      `${base}.recommendedDecisionCode`,
      "must preserve issue #13's penalty outcome",
    );

    const outcome = readRecord(item.recommendedOutcome);
    if (!outcome) {
      issues.push({
        path: `${base}.recommendedOutcome`,
        message: "must be an object",
      });
    } else {
      addIf(
        issues,
        outcome.restart !== "penalty-kick",
        `${base}.recommendedOutcome.restart`,
        "must be penalty-kick",
      );
      addIf(
        issues,
        !DISCIPLINARY_ACTIONS.has(String(outcome.disciplinaryAction)),
        `${base}.recommendedOutcome.disciplinaryAction`,
        "must be none, yellow-card, or red-card",
      );
      const expectedDecision = `penalty-${
        outcome.disciplinaryAction === "none"
          ? "no-card"
          : outcome.disciplinaryAction
      }`;
      addIf(
        issues,
        item.recommendedDecisionCode !== expectedDecision,
        `${base}.recommendedOutcome`,
        "must agree with recommendedDecisionCode",
      );
    }

    const factors = readArray(item.ruleFactors);
    const factorIds = new Set<string>();
    if (!factors || factors.length < 2) {
      issues.push({
        path: `${base}.ruleFactors`,
        message: "must contain at least two structured factors",
      });
    } else {
      for (const [factorIndex, rawFactor] of factors.entries()) {
        const factor = readRecord(rawFactor);
        if (!factor) continue;
        for (const key of ["id", "label", "observation", "relevance"]) {
          addIf(
            issues,
            !isNonEmptyString(factor[key]),
            `${base}.ruleFactors[${factorIndex}].${key}`,
            "must be a non-empty string",
          );
        }
        if (isNonEmptyString(factor.id)) {
          addIf(
            issues,
            factorIds.has(factor.id),
            `${base}.ruleFactors[${factorIndex}].id`,
            "must be unique within the case",
          );
          factorIds.add(factor.id);
        }
      }
    }

    const reasoning = readArray(item.reasoningPath);
    if (!reasoning || reasoning.length === 0) {
      issues.push({
        path: `${base}.reasoningPath`,
        message: "must not be empty",
      });
    } else {
      for (const [stepIndex, rawStep] of reasoning.entries()) {
        const step = readRecord(rawStep);
        if (!step) continue;
        addIf(
          issues,
          step.order !== stepIndex + 1,
          `${base}.reasoningPath[${stepIndex}].order`,
          "must be sequential and one-based",
        );
        addIf(
          issues,
          !isNonEmptyString(step.conclusion),
          `${base}.reasoningPath[${stepIndex}].conclusion`,
          "must be a non-empty string",
        );
        const refs = readArray(step.factorIds);
        addIf(
          issues,
          !refs || refs.length === 0,
          `${base}.reasoningPath[${stepIndex}].factorIds`,
          "must reference at least one factor",
        );
        for (const ref of refs ?? []) {
          addIf(
            issues,
            !isNonEmptyString(ref) || !factorIds.has(ref),
            `${base}.reasoningPath[${stepIndex}].factorIds`,
            `references missing factor ${String(ref)}`,
          );
        }
      }
    }

    const alternatives = readArray(item.alternativeInterpretations);
    if (!alternatives || alternatives.length === 0) {
      issues.push({
        path: `${base}.alternativeInterpretations`,
        message: "must include at least one alternative opinion",
      });
    } else {
      for (const [alternativeIndex, rawAlternative] of alternatives.entries()) {
        const alternative = readRecord(rawAlternative);
        if (!alternative) continue;
        addIf(
          issues,
          !decisionCodes.has(String(alternative.decisionCode)),
          `${base}.alternativeInterpretations[${alternativeIndex}].decisionCode`,
          "must appear in availableDecisions",
        );
        for (const key of ["rationale", "evidenceThatWouldChangeCall"]) {
          addIf(
            issues,
            !isNonEmptyString(alternative[key]),
            `${base}.alternativeInterpretations[${alternativeIndex}].${key}`,
            "must be a non-empty string",
          );
        }
      }
    }

    const expertReasoning = readRecord(item.expertReasoning);
    if (!expertReasoning) {
      issues.push({
        path: `${base}.expertReasoning`,
        message: "must be an object",
      });
    } else {
      addIf(
        issues,
        expertReasoning.status !== "editorial-fixture-expert-review-pending" ||
          expertReasoning.reviewer !== null,
        `${base}.expertReasoning`,
        "must disclose pending expert review and must not invent a reviewer",
      );
      for (const key of ["summary", "alternativeView", "disclosure"]) {
        addIf(
          issues,
          !isNonEmptyString(expertReasoning[key]),
          `${base}.expertReasoning.${key}`,
          "must be a non-empty string",
        );
      }
    }

    const ruleSource = readRecord(item.ruleSource);
    if (!ruleSource) {
      issues.push({ path: `${base}.ruleSource`, message: "must be an object" });
    } else {
      addIf(
        issues,
        ruleSource.publisher !== "The IFAB" ||
          ruleSource.edition !== "2026/27" ||
          ruleSource.law !== "Law 12 — Fouls and Misconduct" ||
          ruleSource.sourceUrl !==
            "https://www.theifab.com/laws/latest/fouls-and-misconduct/" ||
          ruleSource.verificationStatus !== "official-source-checked",
        `${base}.ruleSource`,
        "must identify the checked IFAB 2026/27 Law 12 source",
      );
      const sections = readArray(ruleSource.sections);
      addIf(
        issues,
        !sections || sections.length === 0,
        `${base}.ruleSource.sections`,
        "must identify at least one relevant section",
      );
    }

    const media = readRecord(item.media);
    if (!media) {
      issues.push({ path: `${base}.media`, message: "must be an object" });
    } else {
      const shotList = readArray(media.shotList);
      addIf(
        issues,
        !shotList ||
          shotList.length < 2 ||
          shotList.some((shot) => !isNonEmptyString(shot)),
        `${base}.media.shotList`,
        "must contain at least two usable recording instructions",
      );
      addIf(
        issues,
        !isNonEmptyString(media.altText),
        `${base}.media.altText`,
        "must be a non-empty string",
      );
      if (media.assetStatus === "recording-required") {
        addIf(
          issues,
          media.authorizationStatus !== "not-created" ||
            media.localPath !== null ||
            media.sourceUrl !== null,
          `${base}.media`,
          "recording-required media must not claim a path, URL, or authorization",
        );
      } else {
        addIf(
          issues,
          !isNonEmptyString(media.localPath) &&
            !isNonEmptyString(media.sourceUrl),
          `${base}.media`,
          "ready or licensed media must provide a path or URL",
        );
      }
    }

    validateDistribution(
      item.seededDistributions,
      `${base}.seededDistributions`,
      decisionCodes,
      issues,
    );

    const tags = readArray(item.tags);
    addIf(
      issues,
      !tags || tags.length < 3 || tags.some((tag) => !isNonEmptyString(tag)),
      `${base}.tags`,
      "must contain at least three non-empty tags",
    );

    const related = readArray(item.relatedCaseIds);
    if (
      !related ||
      related.length === 0 ||
      related.some((id) => !isNonEmptyString(id))
    ) {
      issues.push({
        path: `${base}.relatedCaseIds`,
        message: "must contain at least one valid related case ID",
      });
    } else if (isNonEmptyString(item.id)) {
      relatedById.set(item.id, related as readonly string[]);
    }
  }

  for (const requiredType of SCENARIO_TYPES) {
    addIf(
      issues,
      !scenarioTypes.has(requiredType),
      "$",
      `must include a ${requiredType} scenario`,
    );
  }
  for (const requiredLevel of LEARNING_LEVELS) {
    addIf(
      issues,
      !learningLevels.has(requiredLevel),
      "$",
      `must include a ${requiredLevel} learning level`,
    );
  }

  for (const [id, relatedIds] of relatedById) {
    for (const relatedId of relatedIds) {
      addIf(
        issues,
        relatedId === id,
        `${id}.relatedCaseIds`,
        "must not reference itself",
      );
      addIf(
        issues,
        !ids.has(relatedId),
        `${id}.relatedCaseIds`,
        `references missing case ${relatedId}`,
      );
      const reciprocal = relatedById.get(relatedId);
      addIf(
        issues,
        Boolean(reciprocal) && !reciprocal?.includes(id),
        `${id}.relatedCaseIds`,
        `relationship with ${relatedId} must be reciprocal`,
      );
    }
  }

  const demo = casesById.get(DEMO_CASE_ID);
  const comparison = casesById.get(DEMO_COMPARISON_CASE_ID);
  addIf(issues, !demo, "$", `must contain demo case ${DEMO_CASE_ID}`);
  addIf(
    issues,
    !comparison,
    "$",
    `must contain comparison case ${DEMO_COMPARISON_CASE_ID}`,
  );
  if (demo) {
    addIf(
      issues,
      demo.recommendedDecisionCode !== "penalty-red-card",
      `${DEMO_CASE_ID}.recommendedDecisionCode`,
      "must support issue #17's red-card judge vote",
    );
    const seeded = readRecord(demo.seededDistributions);
    const community = readRecord(readRecord(seeded?.community)?.counts);
    const referees = readRecord(readRecord(seeded?.verifiedReferees)?.counts);
    addIf(
      issues,
      community?.["penalty-red-card"] !== 55,
      `${DEMO_CASE_ID}.seededDistributions.community`,
      "must produce the issue #17 fixture value of 55%",
    );
    addIf(
      issues,
      referees?.["penalty-red-card"] !== 82,
      `${DEMO_CASE_ID}.seededDistributions.verifiedReferees`,
      "must produce the issue #17 fixture value of 82%",
    );
  }

  return issues;
}

export function assertValidRefereeCases(value: unknown): void {
  const issues = validateRefereeCases(value);
  if (issues.length === 0) return;
  const details = issues
    .map(({ path, message }) => `- ${path}: ${message}`)
    .join("\n");
  throw new Error(`Referee-case validation failed:\n${details}`);
}
