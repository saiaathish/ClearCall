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
  /** Stable React key for this appearance (case can repeat across cycles). */
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

function recentIds(items: readonly FeedItem[], windowSize: number): Set<string> {
  const slice = items.slice(Math.max(0, items.length - windowSize));
  return new Set(slice.map((item) => item.scenario.id));
}

/**
 * Append the next batch of feed items. When the unique catalog is exhausted,
 * reshuffle and keep going while avoiding immediate repeats.
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
  const recentWindow = options.recentWindow ?? FEED_RECENT_WINDOW;
  const random = options.random ?? defaultRandom;
  let cycle = options.cycle ?? (existing.at(-1)?.cycle ?? 0);
  const next = [...existing];
  const usedInBatch = new Set<string>();
  const appearanceCounts = new Map<string, number>();
  for (const item of existing) {
    appearanceCounts.set(item.scenario.id, (appearanceCounts.get(item.scenario.id) ?? 0) + 1);
  }

  const usedMedia = new Set<string>();
  // Prefer fresh library stills within this batch; recycled cycles may reuse assets.

  let deck = shuffleCasesForMix(pool, random);
  let deckIndex = 0;

  const draw = (): OfficiatingCase | null => {
    const blocked = recentIds(next, recentWindow);
    for (let attempt = 0; attempt < pool.length * 2; attempt += 1) {
      if (deckIndex >= deck.length) {
        cycle += 1;
        deck = shuffleCasesForMix(pool, random);
        deckIndex = 0;
      }
      const candidate = deck[deckIndex]!;
      deckIndex += 1;
      if (pool.length > recentWindow && blocked.has(candidate.id)) continue;
      if (usedInBatch.has(candidate.id) && pool.length > batchSize) continue;
      return candidate;
    }
    return deck[0] ?? pool[0] ?? null;
  };

  for (let added = 0; added < batchSize; added += 1) {
    const drawn = draw();
    if (!drawn) break;
    usedInBatch.add(drawn.id);
    const appearance = appearanceCounts.get(drawn.id) ?? 0;
    appearanceCounts.set(drawn.id, appearance + 1);
    const scenario = withLibraryBackdrop(drawn, random, usedMedia);
    const mediaSrc = scenario.videoSrc ?? scenario.imageSrc ?? scenario.posterSrc;
    if (mediaSrc) usedMedia.add(mediaSrc);
    next.push({
      key: `${drawn.id}::${cycle}::${appearance}`,
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
