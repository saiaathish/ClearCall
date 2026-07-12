import { mediaLibrary, type MediaLibraryItem } from "@/data/media-library";
import { matchesCategory, scoreTagOverlap, tagsForCategory } from "@/data/media-assets";
import type { OfficiatingCase } from "@/lib/types";

export const FEED_BATCH_SIZE = 10;
/** First paint batch — large enough that the stream feels full immediately. */
export const FEED_SEED_SIZE = 16;
/** How many media URLs to warm ahead of the last visible item. */
export const FEED_PRELOAD_AHEAD = 8;
/** Prefer not to resurface the same case within this many recent slots. */
export const FEED_RECENT_WINDOW = 5;

export interface FeedItem {
  /** Stable React key for this appearance. */
  key: string;
  scenario: OfficiatingCase;
  cycle: number;
}

export type RandomFn = () => number;

function defaultRandom(): number {
  return Math.random();
}

/** Fisher–Yates shuffle; does not mutate the input. */
export function shuffleCases(
  pool: readonly OfficiatingCase[],
  random: RandomFn = defaultRandom,
): OfficiatingCase[] {
  const next = [...pool];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = next[index]!;
    next[index] = next[swapIndex]!;
    next[swapIndex] = current;
  }
  return next;
}

function isVideoCase(scenario: OfficiatingCase): boolean {
  return scenario.mediaKind === "video" || Boolean(scenario.videoSrc);
}

/**
 * Shuffle so clips surface early and often in the mix — video, other, video…
 * instead of long text/image streaks from a pure random deck.
 */
export function shuffleCasesForMix(
  pool: readonly OfficiatingCase[],
  random: RandomFn = defaultRandom,
): OfficiatingCase[] {
  const videos = shuffleCases(
    pool.filter((scenario) => isVideoCase(scenario)),
    random,
  );
  const rest = shuffleCases(
    pool.filter((scenario) => !isVideoCase(scenario)),
    random,
  );
  if (videos.length === 0 || rest.length === 0) {
    return videos.length > 0 ? videos : rest;
  }

  const next: OfficiatingCase[] = [];
  let videoIndex = 0;
  let restIndex = 0;
  while (videoIndex < videos.length || restIndex < rest.length) {
    if (videoIndex < videos.length) {
      next.push(videos[videoIndex]!);
      videoIndex += 1;
      if (videoIndex < videos.length && random() < 0.4) {
        next.push(videos[videoIndex]!);
        videoIndex += 1;
      }
    }
    if (restIndex < rest.length) {
      next.push(rest[restIndex]!);
      restIndex += 1;
    }
  }
  return next;
}

export function pickRandomMedia(
  random: RandomFn = defaultRandom,
  excludeSrc?: string | null,
  preferredTags: readonly string[] = [],
): MediaLibraryItem {
  if (mediaLibrary.length === 0) {
    throw new Error("mediaLibrary is empty");
  }

  const candidates = excludeSrc
    ? mediaLibrary.filter((item) => item.src !== excludeSrc)
    : mediaLibrary;
  const pool = candidates.length > 0 ? candidates : mediaLibrary;

  if (preferredTags.length > 0) {
    let bestScore = -1;
    const ranked: MediaLibraryItem[] = [];
    for (const item of pool) {
      const score = scoreTagOverlap(item.tags, preferredTags);
      if (score > bestScore) {
        bestScore = score;
        ranked.length = 0;
        ranked.push(item);
      } else if (score === bestScore) {
        ranked.push(item);
      }
    }
    if (ranked.length > 0 && bestScore > 0) {
      return ranked[Math.min(ranked.length - 1, Math.floor(random() * ranked.length))]!;
    }
  }

  const index = Math.min(pool.length - 1, Math.floor(random() * pool.length));
  return pool[index]!;
}

/**
 * Give image-shaped cases without an authored asset a category-matched library still.
 * Never mutates description copy. Text and video posts are left alone.
 */
export function withLibraryBackdrop(
  scenario: OfficiatingCase,
  random: RandomFn = defaultRandom,
  usedMedia: ReadonlySet<string> = new Set(),
): OfficiatingCase {
  const mediaKind = scenario.mediaKind
    ?? (scenario.videoSrc ? "video" : scenario.imageSrc || scenario.posterSrc ? "image" : "text");
  if (mediaKind === "text" || mediaKind === "video") return scenario;

  const hasAuthoredImage = Boolean(scenario.imageSrc || scenario.posterSrc);
  if (hasAuthoredImage) return scenario;

  const category = scenario.category;
  const preferred = tagsForCategory(category);
  const matchedPool = mediaLibrary.filter(
    (item) => matchesCategory(item.tags, category, 1) && !usedMedia.has(item.src),
  );
  if (matchedPool.length === 0 && preferred.length > 0) {
    return scenario;
  }

  const available = matchedPool.length > 0
    ? matchedPool
    : mediaLibrary.filter((item) => !usedMedia.has(item.src));
  if (available.length === 0) return scenario;

  const pick = available[Math.min(available.length - 1, Math.floor(random() * available.length))]!;
  return {
    ...scenario,
    mediaKind: "image",
    imageSrc: pick.src,
    mediaWidth: pick.width,
    mediaHeight: pick.height,
    mediaAlt: pick.alt,
  };
}

/**
 * Append the next batch of unique feed items.
 * Deduplicates by stable case ID and never reshuffles exhausted cases back in.
 */
export function appendFeedBatch(
  pool: readonly OfficiatingCase[],
  existing: readonly FeedItem[],
  options: {
    batchSize?: number;
    recentWindow?: number;
    random?: RandomFn;
    cycle?: number;
  } = {},
): FeedItem[] {
  if (pool.length === 0) return [...existing];

  const batchSize = options.batchSize ?? FEED_BATCH_SIZE;
  const random = options.random ?? defaultRandom;
  const cycle = options.cycle ?? (existing.at(-1)?.cycle ?? 0);
  const next = [...existing];
  const seenIds = new Set(existing.map((item) => item.scenario.id));
  const usedMedia = new Set<string>();
  for (const item of existing) {
    const src = item.scenario.videoSrc ?? item.scenario.imageSrc ?? item.scenario.posterSrc;
    if (src) usedMedia.add(src);
  }

  const remaining = shuffleCasesForMix(
    pool.filter((scenario) => !seenIds.has(scenario.id)),
    random,
  );

  for (const drawn of remaining) {
    if (next.length - existing.length >= batchSize) break;
    if (seenIds.has(drawn.id)) continue;

    const scenario = withLibraryBackdrop(drawn, random, usedMedia);
    const mediaSrc = scenario.videoSrc ?? scenario.imageSrc ?? scenario.posterSrc;
    if (mediaSrc) usedMedia.add(mediaSrc);

    seenIds.add(drawn.id);
    next.push({
      key: drawn.id,
      scenario,
      cycle,
    });
  }

  return next;
}

export function collectMediaSrcs(items: readonly FeedItem[]): string[] {
  const srcs: string[] = [];
  for (const item of items) {
    const src = item.scenario.imageSrc ?? item.scenario.posterSrc ?? item.scenario.videoSrc;
    if (src) srcs.push(src);
  }
  return srcs;
}

/** URLs that should be warmed for the next few items after the visible window. */
export function upcomingMediaSrcs(
  items: readonly FeedItem[],
  visibleCount: number,
  ahead: number = FEED_PRELOAD_AHEAD,
): string[] {
  const upcoming = items.slice(visibleCount, visibleCount + ahead);
  return [...new Set(collectMediaSrcs(upcoming))];
}
