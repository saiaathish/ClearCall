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

  it("uses distinct soccer clips without reuse", () => {
    const clips = new Set(
      cases.filter((item) => item.mediaKind === "video").map((item) => item.videoSrc),
    );
    expect(clips.size).toBe(cases.filter((item) => item.mediaKind === "video").length);
    expect(clips.size).toBeGreaterThanOrEqual(3);
  });

  it("keeps the catalog mixed without forcing video reuse", () => {
    const videos = cases.filter((item) => item.mediaKind === "video");
    expect(videos.length).toBeGreaterThanOrEqual(3);
    expect(videos.length).toBeLessThanOrEqual(VIDEO_ASSETS.length);
  });

  it("never reuses the same image or video across posts", () => {
    const images = cases.filter((item) => item.mediaKind === "image").map((item) => item.imageSrc);
    const videos = cases.filter((item) => item.mediaKind === "video").map((item) => item.videoSrc);
    expect(new Set(images).size).toBe(images.length);
    expect(new Set(videos).size).toBe(videos.length);
  });

  it("keeps public copy free of generation artifacts and media-caption filler", () => {
    for (const item of cases) {
      const publicText = [
        item.title,
        item.prompt,
        item.description,
        ...item.seededDiscussion.map((entry) => entry.body),
      ].join("\n");
      expect(publicText).not.toMatch(/call it as/i);
      expect(publicText).not.toMatch(/look off this/i);
      expect(publicText).not.toMatch(/on screen:/i);
      expect(publicText).not.toMatch(/once you see that the rest is noise/i);
      expect(publicText).not.toMatch(/changes how loud i get/i);
      expect(publicText).not.toMatch(/still not sold either way/i);
      expect(publicText).not.toMatch(/\[[a-z0-9]+(?:-[a-z0-9]+)+\]/i);
      expect(publicText).not.toMatch(/\(gen-[^)]+\)/i);
      expect(publicText).not.toContain(item.id);
    }
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
        /arm|hand|keeper|wall|deflection|sliding/i.test(item.mediaAlt),
    );
    expect(matched.length).toBeGreaterThan(0);
  });

  it("keeps incident descriptions free of raw media alt dumps", () => {
    const withMedia = cases.filter((item) => item.mediaKind === "video" || item.mediaKind === "image");
    expect(withMedia.length).toBeGreaterThan(0);
    for (const item of withMedia) {
      expect(item.description).not.toMatch(/no clip is attached/i);
      expect(item.description).not.toMatch(/^On screen:/i);
      expect(item.description.toLowerCase()).not.toBe(item.mediaAlt.toLowerCase());
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

  it("matches specialty video cases to overlapping category tags when tagged", () => {
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

  it("keeps authored handball cases on case still media", () => {
    const item = cases.find((entry) => entry.id === "handball-supporting-arm");
    expect(item).toBeTruthy();
    expect(item!.mediaKind).toBe("image");
    expect(item!.imageSrc?.startsWith("/media/cases/")).toBe(true);
    expect(item!.videoSrc).toBeNull();
  });
});
