import { describe, expect, it } from "vitest";
import { cases } from "@/data/cases";
import { FEED_PEOPLE } from "@/data/feed-people";
import { validateCases } from "@/data/validate-cases";

describe("seeded case integrity", () => {
  it("ships a curated set of unique disclosed demonstration cases", () => {
    expect(cases.length).toBeGreaterThanOrEqual(12);
    expect(cases.length).toBeLessThanOrEqual(16);
    expect(new Set(cases.map((item) => item.id)).size).toBe(cases.length);
    expect(cases.every((item) => item.isDemo)).toBe(true);
    expect(cases.every((item) => item.reviewState === "DEMO_REVIEW_REQUIRED")).toBe(true);
    expect(cases.every((item) => item.scenarioStatus === "OPEN_DISCUSSION")).toBe(true);
  });

  it("passes content validation without hard failures", () => {
    const issues = validateCases(cases);
    const hard = issues.filter(
      (issue) =>
        issue.message.startsWith("missing") ||
        issue.message.includes("broken generated") ||
        issue.message.includes("internal ID") ||
        issue.message.includes("raw case ID") ||
        issue.message === "duplicate case ID",
    );
    expect(hard).toEqual([]);
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

  it("covers varied referee teaching topics", () => {
    for (const category of [
      "Serious foul play",
      "Handball",
      "Offside interference",
      "Denial of an obvious goal-scoring opportunity",
      "Advantage",
      "Simulation",
      "Goalkeeper handling",
    ]) {
      expect(cases.filter((item) => item.category === category).length).toBeGreaterThanOrEqual(1);
    }
  });

  it("mixes text, image, and video-shaped cases without forcing one aspect ratio", () => {
    expect(new Set(cases.map((item) => item.mediaKind))).toEqual(new Set(["text", "image", "video"]));

    const imageRatios = cases
      .filter((item) => item.mediaKind === "image")
      .map((item) => `${item.mediaWidth}:${item.mediaHeight}`);
    expect(new Set(imageRatios).size).toBeGreaterThanOrEqual(3);
    expect(
      cases
        .filter((item) => item.mediaKind === "image")
        .every((item) => item.imageSrc && item.mediaWidth && item.mediaHeight && item.mediaAlt),
    ).toBe(true);
    expect(cases.filter((item) => item.mediaKind === "text").every((item) => !item.imageSrc)).toBe(true);
  });

  it("gives every case three distinct discussion comments", () => {
    const allBodies = new Set<string>();

    for (const scenario of cases) {
      const discussion = scenario.seededDiscussion;
      expect(discussion.length).toBe(3);

      const names = discussion.map((item) => item.author.displayName);
      expect(new Set(names).size).toBe(names.length);

      const bodies = discussion.map((item) => item.body.trim());
      expect(new Set(bodies).size).toBe(bodies.length);

      for (const body of bodies) {
        expect(allBodies.has(body), `duplicate body across catalog: ${body.slice(0, 80)}`).toBe(false);
        allBodies.add(body);
        expect(body).not.toMatch(/call it as|look off this|\[sfp-|gen-\d|\(gen-/i);
      }

      expect(
        discussion.every((item) => item.author.avatarSrc && item.author.avatarInitials.length >= 1),
      ).toBe(true);
    }

    expect(FEED_PEOPLE.length).toBeGreaterThan(150);
  });

  it("never reuses the same image or video across posts", () => {
    const images = cases.filter((item) => item.mediaKind === "image").map((item) => item.imageSrc);
    const videos = cases.filter((item) => item.mediaKind === "video").map((item) => item.videoSrc);
    expect(new Set(images).size).toBe(images.length);
    expect(new Set(videos).size).toBe(videos.length);
  });
});
