import { describe, expect, it, beforeEach } from "vitest";
import { cases } from "@/data/cases";
import { mediaLibrary } from "@/data/media-library";
import {
  FEED_BATCH_SIZE,
  appendFeedBatch,
  pickRandomMedia,
  shuffleCases,
  shuffleCasesForMix,
  upcomingMediaSrcs,
  withLibraryBackdrop,
  type FeedItem,
} from "@/lib/feed-stream";
import {
  MediaPreloadCache,
  MEDIA_PRELOAD_CACHE_SIZE,
  resetMediaPreloadCache,
} from "@/lib/media-preload";

function sequentialRandom(values: number[]): () => number {
  let index = 0;
  return () => {
    const value = values[index % values.length] ?? 0;
    index += 1;
    return value;
  };
}

describe("feed stream", () => {
  it("shuffles without mutating the source pool", () => {
    const source = cases.slice(0, 5);
    const ids = source.map((item) => item.id);
    const shuffled = shuffleCases(source, sequentialRandom([0.9, 0.1, 0.5, 0.2, 0.8]));
    expect(source.map((item) => item.id)).toEqual(ids);
    expect(shuffled).toHaveLength(source.length);
    expect(new Set(shuffled.map((item) => item.id))).toEqual(new Set(ids));
  });

  it("stops once every unique case has appeared", () => {
    const pool = cases.slice(0, 5);
    let items: FeedItem[] = [];
    for (let round = 0; round < 6; round += 1) {
      items = appendFeedBatch(pool, items, {
        batchSize: FEED_BATCH_SIZE,
        random: sequentialRandom([0.2, 0.7, 0.4, 0.9, 0.1, 0.55, 0.33]),
      });
    }
    expect(items.length).toBe(pool.length);
    expect(new Set(items.map((item) => item.scenario.id)).size).toBe(pool.length);
  });

  it("never repeats a case id in the feed", () => {
    let items: FeedItem[] = [];
    items = appendFeedBatch(cases, items, { batchSize: cases.length, random: () => 0.1 });
    items = appendFeedBatch(cases, items, { batchSize: cases.length, random: () => 0.1 });
    expect(items.length).toBe(cases.length);
    expect(new Set(items.map((item) => item.scenario.id)).size).toBe(cases.length);
    expect(new Set(items.map((item) => item.key)).size).toBe(items.length);
  });

  it("leaves text-only cases as text", () => {
    const textCase = cases.find((item) => item.mediaKind === "text");
    expect(textCase).toBeTruthy();
    const enriched = withLibraryBackdrop(textCase!, () => 0);
    expect(enriched.mediaKind).toBe("text");
    expect(enriched.imageSrc).toBeNull();
  });

  it("keeps real demo video clips as video", () => {
    const videoCase = cases.find((item) => item.mediaKind === "video" && item.videoSrc);
    expect(videoCase).toBeTruthy();
    const enriched = withLibraryBackdrop(videoCase!, () => 0);
    expect(enriched.mediaKind).toBe("video");
    expect(enriched.videoSrc).toBe(videoCase!.videoSrc);
  });

  it("preserves authored image assets", () => {
    const imageCase = cases.find((item) => item.mediaKind === "image" && item.imageSrc);
    expect(imageCase).toBeTruthy();
    const enriched = withLibraryBackdrop(imageCase!, () => 0.9);
    expect(enriched.imageSrc).toBe(imageCase!.imageSrc);
  });

  it("exposes upcoming media urls for lookahead preload", () => {
    const pool = cases.slice(0, Math.min(6, cases.length));
    const items = appendFeedBatch(pool, [], { batchSize: pool.length, random: () => 0.15 });
    const upcoming = upcomingMediaSrcs(items, 2, 3);
    expect(upcoming.length).toBeGreaterThan(0);
    expect(upcoming.every((src) => typeof src === "string" && src.length > 0)).toBe(true);
  });

  it("picks media from the library", () => {
    const pick = pickRandomMedia(() => 0.99);
    expect(mediaLibrary.some((item) => item.id === pick.id)).toBe(true);
  });

  it("shuffles the mix so video clips surface early when available", () => {
    const mixed = shuffleCasesForMix(cases, sequentialRandom([0.2, 0.8, 0.1, 0.9, 0.4, 0.6, 0.3]));
    expect(mixed).toHaveLength(cases.length);
    const videoTotal = cases.filter(
      (item) => item.mediaKind === "video" || Boolean(item.videoSrc),
    ).length;
    if (videoTotal >= 3) {
      const firstEight = mixed.slice(0, Math.min(8, mixed.length));
      const videoCount = firstEight.filter(
        (item) => item.mediaKind === "video" || Boolean(item.videoSrc),
      ).length;
      expect(videoCount).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("media preload cache", () => {
  beforeEach(() => {
    resetMediaPreloadCache();
  });

  it("caps warmed entries and evicts oldest first", () => {
    const OriginalImage = globalThis.Image;
    const created: string[] = [];
    class FakeImage {
      decoding = "async";
      set src(value: string) {
        created.push(value);
      }
    }
    // @ts-expect-error test stub
    globalThis.Image = FakeImage;
    globalThis.window = globalThis as unknown as Window & typeof globalThis;

    try {
      const cache = new MediaPreloadCache(MEDIA_PRELOAD_CACHE_SIZE);
      const urls = Array.from({ length: MEDIA_PRELOAD_CACHE_SIZE + 3 }, (_, index) => `/media/${index}.svg`);
      cache.preload(urls);
      expect(cache.size).toBe(MEDIA_PRELOAD_CACHE_SIZE);
      expect(cache.has(urls[0]!)).toBe(false);
      expect(cache.has(urls[urls.length - 1]!)).toBe(true);
      expect(created).toHaveLength(MEDIA_PRELOAD_CACHE_SIZE + 3);
    } finally {
      globalThis.Image = OriginalImage;
    }
  });
});
