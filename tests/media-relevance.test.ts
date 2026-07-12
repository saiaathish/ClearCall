import { describe, expect, it } from "vitest";
import { cases } from "@/data/cases";
import { referencesMedia } from "@/data/align-case-copy";
import {
  VIDEO_ASSETS,
  matchesCategory,
  primaryTagsForCategory,
  scoreTagOverlap,
  tagsForCategory,
} from "@/data/media-assets";
import { existsSync } from "node:fs";
import path from "node:path";

describe("media relevance", () => {
  it("wires video posters from the same clip folder, not unrelated stock", () => {
    const videos = cases.filter((item) => item.mediaKind === "video");
    expect(videos.length).toBeGreaterThan(0);
    for (const item of videos) {
      expect(item.videoSrc).toMatch(/^\/media\/demo\/pitch\/pitch-\d+\.mp4$/);
      expect(item.posterSrc).toMatch(/^\/media\/demo\/pitch\/pitch-\d+\.jpg$/);
      const clipNum = item.videoSrc!.match(/pitch-(\d+)/)?.[1];
      const posterNum = item.posterSrc!.match(/pitch-(\d+)/)?.[1];
      expect(posterNum).toBe(clipNum);
      expect(existsSync(path.join(process.cwd(), "public", item.videoSrc!))).toBe(true);
      expect(existsSync(path.join(process.cwd(), "public", item.posterSrc!))).toBe(true);
    }
  });

  it("uses multiple distinct soccer clips", () => {
    const clips = new Set(
      cases.filter((item) => item.mediaKind === "video").map((item) => item.videoSrc),
    );
    expect(clips.size).toBeGreaterThanOrEqual(12);
  });

  it("keeps the catalog video-heavy for an engaging feed", () => {
    const videos = cases.filter((item) => item.mediaKind === "video");
    expect(videos.length).toBeGreaterThanOrEqual(40);
  });

  it("keeps handball / keeper case images on matching assets when possible", () => {
    const handball = cases.filter(
      (item) => item.mediaKind === "image" && item.category.toLowerCase().includes("handball"),
    );
    expect(handball.length).toBeGreaterThan(0);
    const matched = handball.filter(
      (item) =>
        item.imageSrc?.includes("handball") ||
        item.imageSrc?.includes("goalkeeper") ||
        /arm|hand|keeper|wall|deflection/i.test(item.mediaAlt),
    );
    expect(matched.length).toBeGreaterThan(0);
  });

  it("anchors media post copy to the attached asset", () => {
    const withMedia = cases.filter((item) => item.mediaKind === "video" || item.mediaKind === "image");
    expect(withMedia.length).toBeGreaterThan(0);
    for (const item of withMedia) {
      expect(item.description.toLowerCase()).toContain(
        item.mediaAlt.toLowerCase().replace(/\.$/, ""),
      );
      expect(item.description).not.toMatch(/no clip is attached/i);
    }
  });

  it("keeps text-only posts from referencing clips or images", () => {
    const textOnly = cases.filter((item) => item.mediaKind === "text");
    expect(textOnly.length).toBeGreaterThan(0);
    for (const item of textOnly) {
      expect(item.imageSrc).toBeNull();
      expect(item.videoSrc).toBeNull();
      expect(item.posterSrc).toBeNull();
      expect(referencesMedia(item.prompt)).toBe(false);
      expect(referencesMedia(item.description)).toBe(false);
      for (const comment of item.seededDiscussion) {
        expect(referencesMedia(comment.body)).toBe(false);
      }
    }
  });

  it("matches specialty video cases to overlapping category tags", () => {
    const specialty = cases.filter(
      (item) =>
        item.mediaKind === "video" &&
        /handball|offside|dogso|goalkeeper|serious foul|simulation/i.test(item.category),
    );
    expect(specialty.length).toBeGreaterThan(0);
    for (const item of specialty) {
      const video = VIDEO_ASSETS.find((asset) => asset.videoSrc === item.videoSrc);
      expect(video).toBeTruthy();
      expect(scoreTagOverlap(video!.tags, tagsForCategory(item.category))).toBeGreaterThanOrEqual(1);
      expect(matchesCategory(video!.tags, item.category, 1)).toBe(true);
      const primary = primaryTagsForCategory(item.category);
      if (primary) {
        expect(primary.some((tag) => video!.tags.includes(tag))).toBe(true);
      }
    }
  });

  it("keeps the Celine Martin handball shot-blocker on authored still media", () => {
    const item = cases.find((entry) => entry.id === "handball-shot-blocker");
    expect(item).toBeTruthy();
    expect(item!.mediaKind).toBe("image");
    expect(item!.imageSrc).toBe("/media/cases/handball-raised-arm.png");
    expect(item!.videoSrc).toBeNull();
    expect(item!.prompt).toContain("outstretched arm");
  });
});
