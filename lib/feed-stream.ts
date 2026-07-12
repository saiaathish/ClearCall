import { mediaLibrary, type MediaLibraryItem } from "@/data/media-library";
import type { OfficiatingCase } from "@/lib/types";

export const FEED_BATCH_SIZE = 4;
/** How many media URLs to warm ahead of the last visible item. */
export const FEED_PRELOAD_AHEAD = 3;
/** Cap rendered feed nodes so infinite reshuffles do not grow the DOM forever. */
export const FEED_MAX_RENDERED = 40;
/** Prefer not to resurface the same case within this many recent slots. */
export const FEED_RECENT_WINDOW = 3;

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

export function pickRandomMedia(
  random: RandomFn = defaultRandom,
  excludeSrc?: string | null,
): MediaLibraryItem {
  if (mediaLibrary.length === 0) {
    throw new Error("mediaLibrary is empty");
  }

  const candidates = excludeSrc
    ? mediaLibrary.filter((item) => item.src !== excludeSrc)
    : mediaLibrary;
  const pool = candidates.length > 0 ? candidates : mediaLibrary;
  const index = Math.min(pool.length - 1, Math.floor(random() * pool.length));
  return pool[index]!;
}

/**
 * Give text / placeholder cases a random library still so the feed stays visual.
 * Authored image/video assets are kept as-is.
 */
export function withLibraryBackdrop(
  scenario: OfficiatingCase,
  random: RandomFn = defaultRandom,
): OfficiatingCase {
  const hasAuthoredImage = Boolean(scenario.imageSrc || scenario.posterSrc);
  const hasAuthoredVideo = Boolean(scenario.videoSrc);
  if (hasAuthoredImage || hasAuthoredVideo) return scenario;

  const pick = pickRandomMedia(random, scenario.imageSrc);
  return {
    ...scenario,
    mediaKind: "image",
    imageSrc: pick.src,
    mediaWidth: pick.width,
    mediaHeight: pick.height,
    mediaAlt: `${scenario.mediaAlt} · ambient: ${pick.alt}`,
  };
}

function recentIds(items: readonly FeedItem[], windowSize: number): Set<string> {
  const slice = items.slice(Math.max(0, items.length - windowSize));
  return new Set(slice.map((item) => item.scenario.id));
}

/**
 * Append the next batch of feed items. When the unique catalog is exhausted,
 * reshuffle and keep going (Instagram-style mix) while avoiding immediate repeats.
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

  let deck = shuffleCases(pool, random);
  let deckIndex = 0;

  const draw = (): OfficiatingCase | null => {
    const blocked = recentIds(next, recentWindow);
    for (let attempt = 0; attempt < pool.length * 2; attempt += 1) {
      if (deckIndex >= deck.length) {
        cycle += 1;
        deck = shuffleCases(pool, random);
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
    const appearance = next.filter((item) => item.scenario.id === drawn.id).length;
    const scenario = withLibraryBackdrop(drawn, random);
    next.push({
      key: `${drawn.id}::${cycle}::${appearance}`,
      scenario,
      cycle,
    });
  }

  return next;
}

/** Trim from the front when the rendered stream grows past the soft cap. */
export function trimFeedItems(
  items: readonly FeedItem[],
  maxRendered: number = FEED_MAX_RENDERED,
): FeedItem[] {
  if (items.length <= maxRendered) return [...items];
  return items.slice(items.length - maxRendered);
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
