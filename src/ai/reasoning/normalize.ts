import type { DecisionCode, RefereeCase } from "../../domain/referee-case.ts";

const DECISION_ALIASES: Readonly<Record<string, DecisionCode>> = {
  "no-handball-offence": "no-offence",
  "penalty,-no-card": "penalty-no-card",
  "penalty,-yellow-card": "penalty-yellow-card",
  "penalty,-red-card": "penalty-red-card",
};

const FACTOR_ALIASES: Readonly<
  Record<string, Readonly<Record<string, string>>>
> = {
  "soccer-handball-001": {
    "goal-denied": "goal-bound",
    "penalty-area": "defender-location",
  },
  "soccer-handball-002": {
    "no-deliberate-reach": "no-hand-to-ball",
    "unnaturally-bigger": "unnatural-position",
  },
  "soccer-handball-003": {
    "hand-to-ball": "clear-reach",
    "penalty-area": "inside-area",
  },
  "soccer-handball-004": {
    "raised-arm": "arm-high",
    "no-card-trigger": "no-tactical-denial",
  },
  "soccer-handball-005": {
    "close-distance": "short-distance",
    "arm-already-extended": "preexisting-extension",
  },
  "soccer-handball-006": {
    "natural-start": "initial-natural-position",
    "second-movement": "second-reach",
  },
  "soccer-handball-007": {
    "ball-in-play": "ball-live",
    "deliberate-catch": "intentional-catch",
  },
  "soccer-handball-008": {
    "promising-attack": "unmarked-receiver",
  },
  "soccer-handball-009": {
    "arm-side-extension": "side-extension",
  },
  "soccer-handball-010": {
    "missing-angle": "blocked-evidence",
    "uncertain-angle": "blocked-evidence",
  },
};

export function normalizeDecision(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "-");
}

export function normalizeReasoningFactor(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "-");
}

export function resolveDecision(value: string): DecisionCode | undefined {
  const normalized = normalizeDecision(value);
  if (
    normalized === "no-offence" ||
    normalized === "penalty-no-card" ||
    normalized === "penalty-yellow-card" ||
    normalized === "penalty-red-card"
  ) {
    return normalized;
  }
  return DECISION_ALIASES[normalized];
}

export function resolveReasoningFactor(
  value: string,
  refereeCase: RefereeCase,
): string | undefined {
  const normalized = normalizeReasoningFactor(value);
  const canonical = refereeCase.ruleFactors.find(
    (factor) => normalizeReasoningFactor(factor.id) === normalized,
  );
  if (canonical) {
    return canonical.id;
  }

  const caseAliases = FACTOR_ALIASES[refereeCase.id] ?? {};
  const aliasTarget = caseAliases[normalized];
  if (aliasTarget) {
    return refereeCase.ruleFactors.some((factor) => factor.id === aliasTarget)
      ? aliasTarget
      : undefined;
  }

  const trustedLabel = refereeCase.ruleFactors.find(
    (factor) => normalizeReasoningFactor(factor.label) === normalized,
  );
  return trustedLabel?.id;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchesControlledTerm(text: string, term: string): boolean {
  const normalizedTerm = normalizeReasoningFactor(term);
  const parts = normalizedTerm.split("-").filter(Boolean).map(escapeRegExp);
  if (parts.length === 0) {
    return false;
  }
  const pattern = parts.join("[\\s_-]+");
  return new RegExp(
    `(?:^|[^\\p{L}\\p{N}])${pattern}(?=$|[^\\p{L}\\p{N}])`,
    "iu",
  ).test(text);
}

export function extractReasoningFactorIds(
  writtenReasoning: string,
  refereeCase: RefereeCase,
): readonly string[] {
  const caseAliases = FACTOR_ALIASES[refereeCase.id] ?? {};
  const extracted: string[] = [];
  for (const factor of refereeCase.ruleFactors) {
    const candidates = [factor.id, factor.label];
    for (const [alias, target] of Object.entries(caseAliases)) {
      if (target === factor.id) {
        candidates.push(alias);
      }
    }
    if (
      candidates.some((candidate) =>
        matchesControlledTerm(writtenReasoning, candidate),
      )
    ) {
      extracted.push(factor.id);
    }
  }
  return extracted;
}
