import type {
  CalibrationLabel,
  Difficulty,
  FeedRankingOptions,
  FeedScoreBreakdown,
  LearnerProfile,
  OfficiatingCase,
  PerformanceBreakdown,
  ProfileDerivationOptions,
  RankedCase,
  SimilarityBreakdown,
  SimilarityResult,
  TeachingContrast,
  UserAnswer,
} from "./types";

const DIFFICULTY_ORDER: readonly Difficulty[] = [
  "beginner",
  "intermediate",
  "advanced",
];

const HIGH_CONFIDENCE_THRESHOLD = 80;
const TEACHING_CONTRAST_BONUS = 20;

interface ResolvedAnswer {
  answer: UserAnswer;
  case: OfficiatingCase;
  isCorrect: boolean;
}

const clamp = (value: number, minimum = 0, maximum = 1): number =>
  Math.min(maximum, Math.max(minimum, value));

const round = (value: number, precision = 1): number => {
  const multiplier = 10 ** precision;
  const floatingPointGuard =
    Number.EPSILON * Math.max(1, Math.abs(value)) * multiplier;
  return (
    Math.round((value + Math.sign(value || 1) * floatingPointGuard) * multiplier) /
    multiplier
  );
};

const normalized = (value: string): string => value.trim().toLocaleLowerCase();

const timestamp = (value: string): number => {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const jaccard = (
  first: ReadonlySet<string>,
  second: ReadonlySet<string>,
): number => {
  if (first.size === 0 && second.size === 0) return 1;

  const intersectionSize = [...first].filter((value) => second.has(value)).length;
  const unionSize = new Set([...first, ...second]).size;
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
};

const tokenize = (value: string): ReadonlySet<string> =>
  new Set(
    normalized(value)
      .split(/[^a-z0-9]+/u)
      .filter((token) => token.length > 0),
  );

const dedupeLatestAnswers = (
  answers: readonly UserAnswer[],
): readonly UserAnswer[] => {
  const latestByCase = new Map<string, UserAnswer>();

  for (const answer of answers) {
    const current = latestByCase.get(answer.caseId);
    if (!current || timestamp(answer.answeredAt) >= timestamp(current.answeredAt)) {
      latestByCase.set(answer.caseId, answer);
    }
  }

  return [...latestByCase.values()].sort(
    (first, second) =>
      timestamp(first.answeredAt) - timestamp(second.answeredAt) ||
      first.caseId.localeCompare(second.caseId),
  );
};

const resolveAnswers = (
  answers: readonly UserAnswer[],
  cases: readonly OfficiatingCase[],
): readonly ResolvedAnswer[] => {
  const casesById = new Map(cases.map((item) => [item.id, item]));

  return dedupeLatestAnswers(answers).flatMap((answer) => {
    const item = casesById.get(answer.caseId);
    if (!item) return [];

    const optionExists = item.answerOptions.some(
      (option) => option.id === answer.selectedOptionId,
    );
    if (!optionExists) return [];

    return [
      {
        answer,
        case: item,
        isCorrect: answer.selectedOptionId === item.recommendedDecision,
      },
    ];
  });
};

const difficultyProximity = (
  first: Difficulty,
  second: Difficulty,
): number => {
  const firstIndex = DIFFICULTY_ORDER.indexOf(first);
  const secondIndex = DIFFICULTY_ORDER.indexOf(second);
  return clamp(1 - Math.abs(firstIndex - secondIndex) / 2);
};

/**
 * Implements the brief's transparent similarity formula. Different sports or broad
 * categories are ineligible and therefore receive a zero score.
 */
export function calculateSimilarity(
  first: OfficiatingCase,
  second: OfficiatingCase,
): SimilarityResult {
  const eligible =
    first.id !== second.id &&
    first.sport === second.sport &&
    first.category === second.category;

  if (!eligible) {
    return {
      eligible: false,
      score: 0,
      breakdown: {
        factorOverlap: 0,
        rulePathOverlap: 0,
        competitionContextSimilarity: 0,
        difficultyProximity: 0,
        disagreementSimilarity: 0,
      },
    };
  }

  const firstFactorKeys = new Set(first.factors.map((factor) => factor.key));
  const secondFactorKeys = new Set(second.factors.map((factor) => factor.key));
  const firstRulePath = new Set(first.rulePath.map(normalized));
  const secondRulePath = new Set(second.rulePath.map(normalized));
  const exactCompetitionMatch =
    normalized(first.competitionLevel) === normalized(second.competitionLevel);

  const breakdown: SimilarityBreakdown = {
    factorOverlap: round(jaccard(firstFactorKeys, secondFactorKeys), 6),
    rulePathOverlap: round(jaccard(firstRulePath, secondRulePath), 6),
    competitionContextSimilarity: exactCompetitionMatch
      ? 1
      : round(
          jaccard(
            tokenize(first.competitionLevel),
            tokenize(second.competitionLevel),
          ),
          6,
        ),
    difficultyProximity: round(
      difficultyProximity(first.difficulty, second.difficulty),
      6,
    ),
    disagreementSimilarity: round(
      clamp(1 - Math.abs(first.disagreementScore - second.disagreementScore)),
      6,
    ),
  };

  const score =
    0.35 * breakdown.factorOverlap +
    0.2 * breakdown.rulePathOverlap +
    0.15 * breakdown.competitionContextSimilarity +
    0.15 * breakdown.difficultyProximity +
    0.15 * breakdown.disagreementSimilarity;

  return {
    eligible: true,
    score: round(score * 100),
    breakdown,
  };
}

const factorDifferences = (
  first: OfficiatingCase,
  second: OfficiatingCase,
): readonly string[] => {
  const secondFactors = new Map(second.factors.map((factor) => [factor.key, factor]));

  return first.factors
    .flatMap((factor) => {
      const counterpart = secondFactors.get(factor.key);
      if (!counterpart || normalized(counterpart.value) === normalized(factor.value)) {
        return [];
      }

      return [
        {
          key: factor.key,
          label: factor.label,
          text: `${factor.label}: ${factor.value} → ${counterpart.value}`,
        },
      ];
    })
    .sort((left, right) => {
      const leftCritical =
        left.key === first.criticalFactor || left.key === second.criticalFactor;
      const rightCritical =
        right.key === first.criticalFactor || right.key === second.criticalFactor;
      return Number(rightCritical) - Number(leftCritical) ||
        left.label.localeCompare(right.label);
    })
    .slice(0, 3)
    .map((difference) => difference.text);
};

const humanList = (values: readonly string[]): string => {
  if (values.length === 0) return "the recommended outcome";
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
};

/** Finds the most similar eligible case, with a visible 20-point bonus for a differing outcome. */
export function findTeachingContrast(
  source: OfficiatingCase,
  candidates: readonly OfficiatingCase[],
): TeachingContrast | null {
  const ranked = candidates
    .filter((candidate) => candidate.id !== source.id)
    .flatMap((candidate) => {
      const similarity = calculateSimilarity(source, candidate);
      if (!similarity.eligible) return [];

      const outcomesDiffer =
        source.recommendedDecision !== candidate.recommendedDecision;
      const differences = factorDifferences(source, candidate);
      const differenceLabels = differences.map((difference) =>
        difference.split(":", 1)[0].toLocaleLowerCase(),
      );
      const teachingScore = round(
        similarity.score + (outcomesDiffer ? TEACHING_CONTRAST_BONUS : 0),
      );

      const comparisonValue = outcomesDiffer
        ? similarity.score >= 70
          ? "High teaching contrast"
          : "Useful teaching contrast"
        : "Similar outcome review";

      return [
        {
          case: candidate,
          similarityScore: similarity.score,
          teachingScore,
          comparisonValue,
          reason: outcomesDiffer
            ? `Selected because both cases cover ${source.category.toLocaleLowerCase()} but differ in ${humanList(differenceLabels)}.`
            : `Selected because both cases cover ${source.category.toLocaleLowerCase()} with closely related rule factors.`,
          criticalDifferences: differences,
        } satisfies TeachingContrast,
      ];
    })
    .sort(
      (first, second) =>
        second.teachingScore - first.teachingScore ||
        second.similarityScore - first.similarityScore ||
        first.case.id.localeCompare(second.case.id),
    );

  return ranked[0] ?? null;
}

/** Applies the brief's Brier-loss calibration formula and returns a 0–100 score. */
export function calculateCalibrationScore(
  answers: readonly UserAnswer[],
  cases: readonly OfficiatingCase[],
): number {
  const resolved = resolveAnswers(answers, cases);
  if (resolved.length === 0) return 0;

  const averageBrierLoss =
    resolved.reduce((sum, item) => {
      const confidenceProbability = clamp(item.answer.confidence / 100);
      const outcome = item.isCorrect ? 1 : 0;
      return sum + (confidenceProbability - outcome) ** 2;
    }, 0) / resolved.length;

  return round(clamp(100 * (1 - averageBrierLoss), 0, 100));
}

const deriveCurrentLevel = (
  resolved: readonly ResolvedAnswer[],
): Difficulty => {
  if (resolved.length < 3) return "beginner";
  const accuracy =
    resolved.filter((item) => item.isCorrect).length / resolved.length;
  if (resolved.length >= 6 && accuracy >= 0.8) return "advanced";
  if (accuracy >= 0.5) return "intermediate";
  return "beginner";
};

const calibrationLabel = (
  resolved: readonly ResolvedAnswer[],
): CalibrationLabel => {
  if (resolved.length === 0) return "Not enough data";

  const averageConfidence =
    resolved.reduce(
      (sum, item) => sum + clamp(item.answer.confidence, 0, 100),
      0,
    ) /
    resolved.length /
    100;
  const accuracy =
    resolved.filter((item) => item.isCorrect).length / resolved.length;
  const gap = averageConfidence - accuracy;

  if (Math.abs(gap) <= 0.08) return "Well calibrated";
  if (gap >= 0.2) return "Overconfident";
  if (gap > 0.08) return "Slightly overconfident";
  if (gap <= -0.2) return "Underconfident";
  return "Slightly underconfident";
};

const performanceBreakdown = (
  keys: readonly string[],
  resolved: readonly ResolvedAnswer[],
  selectKey: (item: ResolvedAnswer) => string,
): readonly PerformanceBreakdown[] =>
  keys.map((key) => {
    const matching = resolved.filter((item) => selectKey(item) === key);
    const correct = matching.filter((item) => item.isCorrect).length;
    return {
      key,
      label: key,
      answered: matching.length,
      correct,
      accuracy:
        matching.length === 0 ? null : round((correct / matching.length) * 100),
    };
  });

const deriveRecentImprovement = (
  resolved: readonly ResolvedAnswer[],
): number | null => {
  if (resolved.length < 4) return null;
  const windowSize = Math.min(3, Math.floor(resolved.length / 2));
  const recent = resolved.slice(-windowSize);
  const previous = resolved.slice(-windowSize * 2, -windowSize);
  const accuracy = (window: readonly ResolvedAnswer[]): number =>
    window.filter((item) => item.isCorrect).length / window.length;

  return round((accuracy(recent) - accuracy(previous)) * 100);
};

const deriveReasoningMistake = (
  resolved: readonly ResolvedAnswer[],
): string => {
  if (resolved.length === 0) return "No answer history yet.";

  const occurrences = new Map<string, { count: number; message: string }>();

  const record = (key: string, message: string): void => {
    const existing = occurrences.get(key);
    occurrences.set(key, {
      count: (existing?.count ?? 0) + 1,
      message,
    });
  };

  for (const item of resolved) {
    const selected = new Set(item.answer.selectedFactorKeys);
    for (const factor of item.case.factors) {
      if (factor.supportsRecommendation && !selected.has(factor.key)) {
        record(
          `missing:${factor.key}`,
          `Underweighted ${factor.label.toLocaleLowerCase()}.`,
        );
      }
      if (!factor.supportsRecommendation && selected.has(factor.key)) {
        record(
          `extra:${factor.key}`,
          `Overweighted ${factor.label.toLocaleLowerCase()}.`,
        );
      }
    }
  }

  const mostCommon = [...occurrences.entries()].sort(
    ([firstKey, first], [secondKey, second]) =>
      second.count - first.count || firstKey.localeCompare(secondKey),
  )[0];

  return mostCommon?.[1].message ?? "No recurring factor gap yet.";
};

const deriveCorrectStreak = (resolved: readonly ResolvedAnswer[]): number => {
  let streak = 0;
  for (const item of [...resolved].reverse()) {
    if (!item.isCorrect) break;
    streak += 1;
  }
  return streak;
};

export function deriveLearnerProfile(
  answers: readonly UserAnswer[],
  cases: readonly OfficiatingCase[],
  options: ProfileDerivationOptions = {},
): LearnerProfile {
  const resolved = resolveAnswers(answers, cases);
  const categoryKeys = [...new Set(cases.map((item) => item.category))].sort(
    (first, second) => first.localeCompare(second),
  );
  const categoryAccuracy = performanceBreakdown(
    categoryKeys,
    resolved,
    (item) => item.case.category,
  );
  const difficultyAccuracy = performanceBreakdown(
    DIFFICULTY_ORDER,
    resolved,
    (item) => item.case.difficulty,
  );
  const answeredCategories = categoryAccuracy.filter(
    (item) => item.accuracy !== null,
  );
  const weakest = [...answeredCategories].sort(
    (first, second) =>
      (first.accuracy ?? 0) - (second.accuracy ?? 0) ||
      first.label.localeCompare(second.label),
  )[0];
  const strongest = [...answeredCategories].sort(
    (first, second) =>
      (second.accuracy ?? 0) - (first.accuracy ?? 0) ||
      first.label.localeCompare(second.label),
  )[0];
  const answeredIds = new Set(resolved.map((item) => item.case.id));
  const currentLevel = deriveCurrentLevel(resolved);
  const recommended = cases
    .filter((item) => !answeredIds.has(item.id))
    .sort((first, second) => {
      const firstWeaknessMatch = Number(first.category === weakest?.key);
      const secondWeaknessMatch = Number(second.category === weakest?.key);
      return (
        secondWeaknessMatch - firstWeaknessMatch ||
        difficultyProximity(second.difficulty, currentLevel) -
          difficultyProximity(first.difficulty, currentLevel) ||
        second.freshnessScore - first.freshnessScore ||
        first.id.localeCompare(second.id)
      );
    })[0];
  const correctCount = resolved.filter((item) => item.isCorrect).length;
  const averageConfidence =
    resolved.length === 0
      ? 0
      : round(
          resolved.reduce(
            (sum, item) => sum + clamp(item.answer.confidence, 0, 100),
            0,
          ) / resolved.length,
        );

  return {
    id: options.id ?? "demo-learner-jordan",
    displayName: options.displayName ?? "Jordan Lee",
    avatarInitials: options.avatarInitials ?? "JL",
    role: "learner",
    currentLevel,
    currentStreak:
      options.currentStreak === undefined
        ? deriveCorrectStreak(resolved)
        : Math.max(0, Math.floor(options.currentStreak)),
    completedCases: resolved.length,
    savedCases: new Set(options.savedCaseIds ?? []).size,
    overallAccuracy:
      resolved.length === 0 ? 0 : round((correctCount / resolved.length) * 100),
    calibrationScore: calculateCalibrationScore(answers, cases),
    calibrationLabel: calibrationLabel(resolved),
    averageConfidence,
    highConfidenceErrors: resolved.filter(
      (item) =>
        !item.isCorrect && item.answer.confidence >= HIGH_CONFIDENCE_THRESHOLD,
    ).length,
    categoryAccuracy,
    difficultyAccuracy,
    recentImprovement: deriveRecentImprovement(resolved),
    weakestCategory: weakest?.label ?? null,
    strongestCategory: strongest?.label ?? null,
    mostCommonReasoningMistake: deriveReasoningMistake(resolved),
    recommendedCaseId: recommended?.id ?? null,
  };
}

const highConfidenceErrorNeed = (
  history: readonly ResolvedAnswer[],
): number =>
  clamp(
    history
      .filter(
        (item) =>
          !item.isCorrect &&
          item.answer.confidence >= HIGH_CONFIDENCE_THRESHOLD,
      )
      .reduce(
        (need, item) =>
          need + clamp((item.answer.confidence - 75) / 25),
        0,
      ),
  );

const recommendationReason = (
  item: OfficiatingCase,
  history: readonly ResolvedAnswer[],
  currentLevel: Difficulty,
  breakdown: FeedScoreBreakdown,
): string => {
  const highConfidenceMisses = history.filter(
    (entry) =>
      !entry.isCorrect &&
      entry.answer.confidence >= HIGH_CONFIDENCE_THRESHOLD,
  ).length;

  if (highConfidenceMisses > 0) {
    return highConfidenceMisses === 1
      ? `Recommended because a high-confidence miss in ${item.category.toLocaleLowerCase()} makes this a useful review.`
      : `Recommended because ${highConfidenceMisses} high-confidence misses in ${item.category.toLocaleLowerCase()} make this a useful review.`;
  }

  if (history.length > 0 && breakdown.categoryWeakness >= 0.5) {
    const misses = history.filter((entry) => !entry.isCorrect).length;
    return `Recommended because ${misses} of your ${history.length} ${item.category.toLocaleLowerCase()} decisions need another look.`;
  }

  if (history.length === 0) {
    return `A balanced ${item.difficulty} case to broaden your practice.`;
  }

  if (breakdown.difficultyFit === 1) {
    return `Matched to your current ${currentLevel} practice level.`;
  }

  return `A fresh ${item.category.toLocaleLowerCase()} contrast to vary your practice.`;
};

/**
 * Greedily applies the brief's exact feed weights. Recomputing diversity after
 * every selection prevents a weak category from consuming the entire feed.
 */
export function rankPersonalizedCases(
  cases: readonly OfficiatingCase[],
  answers: readonly UserAnswer[],
  options: FeedRankingOptions = {},
): readonly RankedCase[] {
  const resolved = resolveAnswers(answers, cases);
  const answeredIds = new Set(resolved.map((item) => item.case.id));
  const excludedIds = new Set(options.excludeCaseIds ?? []);
  const currentLevel = options.currentLevel ?? deriveCurrentLevel(resolved);
  const windowSize = Math.max(
    1,
    Math.floor(options.recentCategoryWindow ?? 3),
  );
  const recentCategories = resolved
    .slice(-windowSize)
    .map((item) => item.case.category);
  const remaining = cases.filter(
    (item) => !answeredIds.has(item.id) && !excludedIds.has(item.id),
  );
  const ranked: RankedCase[] = [];

  while (remaining.length > 0) {
    const rankingContext = [...recentCategories, ...ranked.map((item) => item.case.category)]
      .slice(-windowSize);
    const scored = remaining
      .map((item) => {
        const categoryHistory = resolved.filter(
          (entry) => entry.case.category === item.category,
        );
        const categoryAccuracy =
          categoryHistory.length === 0
            ? 0.55
            : categoryHistory.filter((entry) => entry.isCorrect).length /
              categoryHistory.length;
        const repeatedCategoryCount = rankingContext.filter(
          (category) => category === item.category,
        ).length;
        const breakdown: FeedScoreBreakdown = {
          categoryWeakness:
            categoryHistory.length === 0 ? 0.45 : 1 - categoryAccuracy,
          highConfidenceErrorNeed: highConfidenceErrorNeed(categoryHistory),
          difficultyFit: difficultyProximity(item.difficulty, currentLevel),
          diversityValue: clamp(1 - repeatedCategoryCount / windowSize),
          freshnessScore: clamp(item.freshnessScore),
        };
        const score =
          0.35 * breakdown.categoryWeakness +
          0.25 * breakdown.highConfidenceErrorNeed +
          0.2 * breakdown.difficultyFit +
          0.1 * breakdown.diversityValue +
          0.1 * breakdown.freshnessScore;

        return {
          case: item,
          score: round(score * 100),
          reason: recommendationReason(
            item,
            categoryHistory,
            currentLevel,
            breakdown,
          ),
          breakdown: {
            categoryWeakness: round(breakdown.categoryWeakness, 3),
            highConfidenceErrorNeed: round(
              breakdown.highConfidenceErrorNeed,
              3,
            ),
            difficultyFit: round(breakdown.difficultyFit, 3),
            diversityValue: round(breakdown.diversityValue, 3),
            freshnessScore: round(breakdown.freshnessScore, 3),
          },
        } satisfies RankedCase;
      })
      .sort(
        (first, second) =>
          second.score - first.score || first.case.id.localeCompare(second.case.id),
      );

    const next = scored[0];
    if (!next) break;
    ranked.push(next);
    const index = remaining.findIndex((item) => item.id === next.case.id);
    remaining.splice(index, 1);
  }

  return ranked;
}
