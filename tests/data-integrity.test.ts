import { describe, expect, it } from "vitest";
import { cases } from "@/data/cases";
import { FEED_PEOPLE } from "@/data/feed-people";

describe("seeded case integrity", () => {
  it("ships 100 unique disclosed demonstration cases", () => {
    expect(cases).toHaveLength(100);
    expect(new Set(cases.map((item) => item.id)).size).toBe(100);
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

  it("keeps the three deliberate teaching-pair categories", () => {
    for (const category of ["Serious foul play", "Handball", "Offside interference"]) {
      expect(cases.filter((item) => item.category === category).length).toBeGreaterThanOrEqual(2);
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

  it("gives every case a unique discussion with distinct authors, counts, and bodies", () => {
    const allBodies = new Set<string>();
    const commentCounts = new Set<number>();

    for (const scenario of cases) {
      const discussion = scenario.seededDiscussion;
      expect(discussion.length).toBeGreaterThanOrEqual(2);
      expect(discussion.length).toBeLessThanOrEqual(11);
      commentCounts.add(discussion.length);

      const names = discussion.map((item) => item.author.displayName);
      expect(new Set(names).size).toBe(names.length);

      const bodies = discussion.map((item) => item.body.trim());
      expect(new Set(bodies).size).toBe(bodies.length);

      for (const body of bodies) {
        expect(allBodies.has(body), `duplicate body across catalog: ${body.slice(0, 80)}`).toBe(false);
        allBodies.add(body);
      }

      expect(
        discussion.every((item) => item.author.avatarSrc && item.author.avatarInitials.length >= 1),
      ).toBe(true);
    }

    expect(commentCounts.size).toBeGreaterThan(1);
    expect(FEED_PEOPLE.length).toBeGreaterThan(150);
  });
});
