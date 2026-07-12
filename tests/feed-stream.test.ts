import { describe, expect, it, beforeEach } from "vitest";
import { cases } from "@/data/cases";
import { mediaLibrary } from "@/data/media-library";
import {
  FEED_BATCH_SIZE,
  appendFeedBatch,
  pickRandomMedia,
  shuffleCases,
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

  it("keeps appending past the unique catalog via reshuffle", () => {
    const pool = cases.slice(0, 5);
    let items: FeedItem[] = [];
    for (let round = 0; round < 6; round += 1) {
      items = appendFeedBatch(pool, items, {
        batchSize: FEED_BATCH_SIZE,
        random: sequentialRandom([0.2, 0.7, 0.4, 0.9, 0.1, 0.55, 0.33]),
      });
    }
    expect(items.length).toBeGreaterThan(pool.length);
    expect(items.length).toBe(6 * FEED_BATCH_SIZE);
    const uniqueKeys = new Set(items.map((item) => item.key));
    expect(uniqueKeys.size).toBe(items.length);
  });

  it("assigns unique keys when the same case reappears", () => {
    const pool = cases.slice(0, 3);
    let items: FeedItem[] = [];
    items = appendFeedBatch(pool, items, { batchSize: 3, random: () => 0.1 });
    items = appendFeedBatch(pool, items, { batchSize: 3, random: () => 0.1 });
    expect(new Set(items.map((item) => item.key)).size).toBe(items.length);
  });

  it("leaves text-only cases as text", () => {
    const textCase = cases.find((item) => item.mediaKind === "text");
    expect(textCase).toBeTruthy();
    const enriched = withLibraryBackdrop(textCase!, () => 0);
    expect(enriched.mediaKind).toBe("text");
    expect(enriched.imageSrc).toBeNull();
  });

  it("leaves video placeholders as video", () => {
    const videoCase = cases.find((item) => item.mediaKind === "video" && !item.videoSrc);
    expect(videoCase).toBeTruthy();
    const enriched = withLibraryBackdrop(videoCase!, () => 0);
    expect(enriched.mediaKind).toBe("video");
  });

  it("preserves authored image assets", () => {
    const imageCase = cases.find((item) => item.mediaKind === "image" && item.imageSrc);
    expect(imageCase).toBeTruthy();
    const enriched = withLibraryBackdrop(imageCase!, () => 0.9);
    expect(enriched.imageSrc).toBe(imageCase!.imageSrc);
  });

  it("exposes upcoming media urls for lookahead preload", () => {
    const pool = cases.slice(0, 6);
    const items = appendFeedBatch(pool, [], { batchSize: 6, random: () => 0.15 });
    const upcoming = upcomingMediaSrcs(items, 2, 3);
    expect(upcoming.length).toBeGreaterThan(0);
    expect(upcoming.every((src) => typeof src === "string" && src.length > 0)).toBe(true);
  });

  it("picks media from the library", () => {
    const pick = pickRandomMedia(() => 0.99);
    expect(mediaLibrary.some((item) => item.id === pick.id)).toBe(true);
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
