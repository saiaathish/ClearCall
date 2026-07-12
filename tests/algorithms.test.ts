import { describe, expect, it } from "vitest";

import { cases } from "../data/cases";
import {
  areComparablePair,
  calculateCalibrationScore,
  calculateSimilarity,
  deriveLearnerProfile,
  findTeachingContrast,
  getComparablePeers,
  rankPersonalizedCases,
  DISAGREEMENT_WEIGHT,
  DIFFICULTY_WEIGHT,
  FRESHNESS_WEIGHT,
  INTEREST_WEIGHT,
  WEAKNESS_WEIGHT,
} from "../lib/algorithms";
import type { OfficiatingCase, UserAnswer } from "../lib/types";

const caseById = (id: string): OfficiatingCase => {
  const item = cases.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`Missing test case: ${id}`);
  return item;
};

describe("BE-006 feed weights", () => {
  it("matches the required formula", () => {
    expect([WEAKNESS_WEIGHT, INTEREST_WEIGHT, DISAGREEMENT_WEIGHT, DIFFICULTY_WEIGHT, FRESHNESS_WEIGHT]).toEqual([0.35, 0.2, 0.2, 0.15, 0.1]);
    expect(WEAKNESS_WEIGHT + INTEREST_WEIGHT + DISAGREEMENT_WEIGHT + DIFFICULTY_WEIGHT + FRESHNESS_WEIGHT).toBe(1);
  });
});

const answer = (
  caseId: string,
  selectedOptionId: string,
  confidence: number,
  answeredAt: string,
  selectedFactorKeys: readonly string[] = [],
): UserAnswer => ({
  caseId,
  selectedOptionId,
  confidence,
  selectedFactorKeys,
  answeredAt,
});

describe("calculateSimilarity", () => {
  it("applies the weighted formula after the sport and category gate", () => {
    const result = calculateSimilarity(
      caseById("sfp-controlled-lunge"),
      caseById("sfp-high-contact-lunge"),
    );

    expect(result.eligible).toBe(true);
    expect(result.breakdown).toEqual({
      factorOverlap: 1,
      rulePathOverlap: 1,
      competitionContextSimilarity: 0,
      difficultyProximity: 0.5,
      disagreementSimilarity: 0.93,
    });
    expect(result.score).toBe(76.5);
  });

  it("returns zero when the broad incident categories differ", () => {
    const result = calculateSimilarity(
      caseById("sfp-controlled-lunge"),
      caseById("handball-supporting-arm"),
    );

    expect(result.eligible).toBe(false);
    expect(result.score).toBe(0);
  });
});

describe("findTeachingContrast", () => {
  it("adds a transparent bonus and selects the deliberate different-outcome pair", () => {
    const seedCatalog = [
      caseById("sfp-controlled-lunge"),
      caseById("sfp-high-contact-lunge"),
      caseById("handball-supporting-arm"),
      caseById("handball-raised-arm"),
      caseById("offside-line-of-vision"),
      caseById("offside-no-impact"),
    ];
    const contrast = findTeachingContrast(
      caseById("sfp-controlled-lunge"),
      seedCatalog,
    );

    expect(contrast?.case.id).toBe("sfp-high-contact-lunge");
    expect(contrast?.similarityScore).toBe(76.5);
    expect(contrast?.teachingScore).toBe(96.5);
    expect(contrast?.comparisonValue).toBe("Strong contrast case");
    expect(contrast?.criticalDifferences.length).toBeGreaterThan(0);
    expect(contrast?.reason).toContain("differ in");
  });
});

describe("calculateCalibrationScore", () => {
  it("uses confidence as a probability and the brief's Brier-loss formula", () => {
    const answers = [
      answer(
        "sfp-controlled-lunge",
        "direct-free-kick-yellow",
        80,
        "2026-07-01T10:00:00.000Z",
      ),
      answer(
        "sfp-high-contact-lunge",
        "direct-free-kick-yellow",
        90,
        "2026-07-02T10:00:00.000Z",
      ),
    ];

    // Losses: (0.8 - 1)^2 = .04 and (0.9 - 0)^2 = .81.
    expect(calculateCalibrationScore(answers, cases)).toBe(57.5);
  });

  it("returns zero honestly when there is no calibration evidence", () => {
    expect(calculateCalibrationScore([], cases)).toBe(0);
  });

  it("keeps calibration anchored to the first attempt after a revision", () => {
    const revised: UserAnswer = {
      ...answer(
        "sfp-high-contact-lunge",
        "direct-free-kick-red",
        70,
        "2026-07-02T10:05:00.000Z",
        ["studs", "force"],
      ),
      initialAttempt: {
        selectedOptionId: "direct-free-kick-yellow",
        confidence: 90,
        selectedFactorKeys: ["speed"],
        answeredAt: "2026-07-02T10:00:00.000Z",
      },
      revisionCount: 1,
    };

    expect(calculateCalibrationScore([revised], cases)).toBe(19);
    expect(deriveLearnerProfile([revised], cases).overallAccuracy).toBe(0);
    expect(rankPersonalizedCases(cases, [revised])[0]?.reason).toContain(
      "felt sure about",
    );
  });
});

describe("rankPersonalizedCases", () => {
  it("prioritizes a category after a high-confidence incorrect answer", () => {
    const seedCatalog = [
      caseById("sfp-controlled-lunge"),
      caseById("sfp-high-contact-lunge"),
      caseById("handball-supporting-arm"),
      caseById("advantage-quick-breakdown"),
    ];
    const ranked = rankPersonalizedCases(seedCatalog, [
      answer(
        "sfp-controlled-lunge",
        "direct-free-kick-red",
        100,
        "2026-07-01T10:00:00.000Z",
        ["studs"],
      ),
    ]);

    expect(ranked[0]?.case.id).toBe("sfp-high-contact-lunge");
    expect(ranked[0]?.breakdown.highConfidenceErrorNeed).toBe(1);
    expect(ranked[0]?.reason).toContain("felt sure about");
  });

  it("gives a new user a deterministic, category-diverse seeded order", () => {
    const catalog = cases.slice(0, 10);
    const firstRun = rankPersonalizedCases(catalog, [], {
      currentLevel: "intermediate",
    });
    const secondRun = rankPersonalizedCases(catalog, [], {
      currentLevel: "intermediate",
    });

    expect(firstRun.map((item) => item.case.id)).toEqual(
      secondRun.map((item) => item.case.id),
    );
    expect(firstRun).toHaveLength(10);
    expect(firstRun[0]?.case.id).toBe("handball-supporting-arm");
    expect(firstRun[0]?.score).toBe(59.9);
    expect(firstRun[1]?.case.category).not.toBe(firstRun[0]?.case.category);
  });
});

describe("deriveLearnerProfile", () => {
  it("derives accuracy, calibration, confidence errors, and category evidence", () => {
    const answers = [
      answer(
        "sfp-controlled-lunge",
        "direct-free-kick-yellow",
        80,
        "2026-07-01T10:00:00.000Z",
        ["contact-height", "control"],
      ),
      answer(
        "sfp-high-contact-lunge",
        "direct-free-kick-yellow",
        90,
        "2026-07-02T10:00:00.000Z",
        ["studs"],
      ),
    ];
    const profile = deriveLearnerProfile(answers, cases, {
      savedCaseIds: ["handball-supporting-arm"],
    });

    expect(profile.completedCases).toBe(2);
    expect(profile.savedCases).toBe(1);
    expect(profile.overallAccuracy).toBe(50);
    expect(profile.calibrationScore).toBe(57.5);
    expect(profile.calibrationLabel).toBe("Overconfident");
    expect(profile.highConfidenceErrors).toBe(1);
    expect(profile.weakestCategory).toBe("Serious foul play");
    expect(
      profile.categoryAccuracy.find(
        (item) => item.key === "Serious foul play",
      )?.accuracy,
    ).toBe(50);
  });
});

describe("authored demo data integrity", () => {
  it("contains review-labelled cases with internally valid IDs and percentages", () => {
    const ids = new Set(cases.map((item) => item.id));
    expect(cases.length).toBeGreaterThanOrEqual(12);
    expect(cases.length).toBeLessThanOrEqual(16);
    expect(ids.size).toBe(cases.length);

    for (const item of cases) {
      const optionIds = new Set(item.answerOptions.map((option) => option.id));
      const factorKeys = new Set(item.factors.map((factor) => factor.key));
      expect(item.reviewState).toBe("DEMO_REVIEW_REQUIRED");
      expect(item.scenarioStatus).toBe("OPEN_DISCUSSION");
      expect(item.reviewDisclaimer).toContain("not official");
      expect(optionIds.has(item.recommendedDecision)).toBe(true);
      expect(factorKeys.has(item.criticalFactor)).toBe(true);

      for (const distribution of [
        item.communityDistribution,
        item.verifiedDistribution,
        item.learnerDistribution,
      ]) {
        expect(distribution.isSynthetic).toBe(true);
        expect(Object.values(distribution.percentages).reduce((sum, value) => sum + value, 0)).toBe(100);
        expect(Object.keys(distribution.percentages).every((id) => optionIds.has(id))).toBe(true);
      }

      expect(item.similarCaseIds.every((id) => ids.has(id))).toBe(true);
      for (const response of item.seededDiscussion) {
        expect(response.isSynthetic).toBe(true);
        expect(optionIds.has(response.selectedOptionId)).toBe(true);
        expect(response.selectedFactorKeys.every((key) => factorKeys.has(key))).toBe(true);
      }
    }
  });

  it("includes the three requested deliberate teaching pairs", () => {
    const seedCatalog = [
      caseById("sfp-controlled-lunge"),
      caseById("sfp-high-contact-lunge"),
      caseById("handball-supporting-arm"),
      caseById("handball-raised-arm"),
      caseById("offside-line-of-vision"),
      caseById("offside-no-impact"),
    ];
    const expectedPairs = [
      ["sfp-controlled-lunge", "sfp-high-contact-lunge"],
      ["handball-supporting-arm", "handball-raised-arm"],
      ["offside-line-of-vision", "offside-no-impact"],
    ] as const;

    for (const [firstId, secondId] of expectedPairs) {
      const first = caseById(firstId);
      const second = caseById(secondId);
      expect(first.category).toBe(second.category);
      expect(first.recommendedDecision).not.toBe(second.recommendedDecision);
      expect(findTeachingContrast(first, seedCatalog)?.case.id).toBe(second.id);
    }
  });

  it("keeps teaching pairs bidirectional in similarCaseIds", () => {
    const seedCatalog = [
      caseById("sfp-controlled-lunge"),
      caseById("sfp-high-contact-lunge"),
      caseById("handball-supporting-arm"),
      caseById("handball-raised-arm"),
      caseById("offside-line-of-vision"),
      caseById("offside-no-impact"),
    ];
    const expectedPairs = [
      ["sfp-controlled-lunge", "sfp-high-contact-lunge"],
      ["handball-supporting-arm", "handball-raised-arm"],
      ["offside-line-of-vision", "offside-no-impact"],
    ] as const;

    for (const [firstId, secondId] of expectedPairs) {
      const first = caseById(firstId);
      const second = caseById(secondId);
      expect(first.similarCaseIds).toContain(secondId);
      expect(second.similarCaseIds).toContain(firstId);
      expect(areComparablePair(first, second)).toBe(true);
      expect(getComparablePeers(first, seedCatalog).map((item) => item.id)).toEqual([secondId]);
      expect(getComparablePeers(second, seedCatalog).map((item) => item.id)).toEqual([firstId]);
    }
  });

  it("does not treat unlinked cases as comparable pairs", () => {
    const linked = caseById("sfp-controlled-lunge");
    const unlinked = caseById("dogso-central-breakaway");
    expect(areComparablePair(linked, unlinked)).toBe(false);
    expect(getComparablePeers(unlinked, cases)).toEqual([]);
    expect(areComparablePair(linked, linked)).toBe(false);
  });
});
