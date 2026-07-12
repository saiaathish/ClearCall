import { describe, expect, it, beforeEach } from "vitest";
import { cases } from "@/data/cases";
import { mediaLibrary } from "@/data/media-library";
import {
  FEED_BATCH_SIZE,
  FEED_MAX_RENDERED,
  appendFeedBatch,
  pickRandomMedia,
  shuffleCases,
  trimFeedItems,
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

  it("assigns library backdrops to text-only cases", () => {
    const textCase = cases.find((item) => item.mediaKind === "text");
    expect(textCase).toBeTruthy();
    const enriched = withLibraryBackdrop(textCase!, () => 0);
    expect(enriched.mediaKind).toBe("image");
    expect(enriched.imageSrc).toBe(mediaLibrary[0]!.src);
    expect(textCase!.imageSrc).toBeNull();
  });

  it("preserves authored image assets", () => {
    const imageCase = cases.find((item) => item.mediaKind === "image" && item.imageSrc);
    expect(imageCase).toBeTruthy();
    const enriched = withLibraryBackdrop(imageCase!, () => 0.9);
    expect(enriched.imageSrc).toBe(imageCase!.imageSrc);
  });

  it("trims from the front once the soft render cap is hit", () => {
    const pool = cases.slice(0, 8);
    let items: FeedItem[] = [];
    while (items.length < FEED_MAX_RENDERED + FEED_BATCH_SIZE) {
      items = appendFeedBatch(pool, items, { batchSize: FEED_BATCH_SIZE, random: () => 0.3 });
    }
    const trimmed = trimFeedItems(items, FEED_MAX_RENDERED);
    expect(trimmed).toHaveLength(FEED_MAX_RENDERED);
    expect(trimmed[0]!.key).not.toBe(items[0]!.key);
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
