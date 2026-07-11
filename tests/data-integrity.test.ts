import { describe, expect, it } from "vitest";
import { cases } from "@/data/cases";

describe("seeded case integrity", () => {
  it("ships ten fully disclosed demonstration cases", () => {
    expect(cases).toHaveLength(10);
    expect(new Set(cases.map((item) => item.id)).size).toBe(10);
    expect(cases.every((item) => item.isDemo)).toBe(true);
    expect(cases.every((item) => item.reviewState === "DEMO_REVIEW_REQUIRED")).toBe(true);
    expect(cases.every((item) => item.scenarioStatus === "OPEN_DISCUSSION")).toBe(true);
  });

  it("keeps every authored distribution normalized", () => {
    for (const scenario of cases) {
      for (const distribution of [
        scenario.communityDistribution,
        scenario.verifiedDistribution,
        scenario.learnerDistribution,
      ]) {
        const total = Object.values(distribution.percentages).reduce((sum, value) => sum + value, 0);
        expect(total, `${scenario.id}: ${distribution.label}`).toBe(100);
        expect(distribution.isSynthetic).toBe(true);
      }
    }
  });

  it("includes the three deliberate teaching-pair categories", () => {
    for (const category of ["Serious foul play", "Handball", "Offside interference"]) {
      expect(cases.filter((item) => item.category === category)).toHaveLength(2);
    }
  });

  it("mixes text, image, and video-shaped cases without forcing one aspect ratio", () => {
    expect(new Set(cases.map((item) => item.mediaKind))).toEqual(new Set(["text", "image", "video"]));

    const imageRatios = cases
      .filter((item) => item.mediaKind === "image")
      .map((item) => `${item.mediaWidth}:${item.mediaHeight}`);
    expect(new Set(imageRatios).size).toBeGreaterThanOrEqual(4);
    expect(
      cases
        .filter((item) => item.mediaKind === "image")
        .every((item) => item.imageSrc && item.mediaWidth && item.mediaHeight && item.mediaAlt),
    ).toBe(true);
    expect(cases.filter((item) => item.mediaKind === "text").every((item) => !item.imageSrc)).toBe(true);
  });
});
