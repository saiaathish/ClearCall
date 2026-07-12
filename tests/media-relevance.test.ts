import { describe, expect, it } from "vitest";
import { cases } from "@/data/cases";
import { VIDEO_ASSETS } from "@/data/media-assets";
import { existsSync } from "node:fs";
import path from "node:path";

describe("media relevance", () => {
  it("wires video posters from the same clip folder, not unrelated stock", () => {
    const videos = cases.filter((item) => item.mediaKind === "video");
    expect(videos.length).toBeGreaterThan(0);
    for (const item of videos) {
      expect(item.videoSrc).toMatch(/^\/media\/demo\/clip-\d+\.mp4$/);
      expect(item.posterSrc).toMatch(/^\/media\/demo\/poster-\d+\.jpg$/);
      const clipNum = item.videoSrc!.match(/clip-(\d+)/)?.[1];
      const posterNum = item.posterSrc!.match(/poster-(\d+)/)?.[1];
      expect(posterNum).toBe(clipNum);
      expect(existsSync(path.join(process.cwd(), "public", item.videoSrc!))).toBe(true);
      expect(existsSync(path.join(process.cwd(), "public", item.posterSrc!))).toBe(true);
    }
  });

  it("uses multiple distinct soccer clips", () => {
    const clips = new Set(
      cases.filter((item) => item.mediaKind === "video").map((item) => item.videoSrc),
    );
    expect(clips.size).toBeGreaterThanOrEqual(Math.min(6, VIDEO_ASSETS.length));
  });

  it("keeps handball / keeper case images on matching assets when possible", () => {
    const handball = cases.filter(
      (item) => item.mediaKind === "image" && item.category.toLowerCase().includes("handball"),
    );
    expect(handball.length).toBeGreaterThan(0);
    // At least one should land on a handball/keeper tagged case still or arm-related alt
    const matched = handball.filter(
      (item) =>
        item.imageSrc?.includes("handball") ||
        item.imageSrc?.includes("goalkeeper") ||
        /arm|hand|keeper|wall|deflection/i.test(item.mediaAlt),
    );
    expect(matched.length).toBeGreaterThan(0);
  });
});
