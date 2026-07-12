/**
 * Bounded browser image warm-cache for the feed.
 * Keeps only a few decoded requests live so scroll feels instant without
 * pinning the whole library in memory.
 */

export const MEDIA_PRELOAD_CACHE_SIZE = 10;

export class MediaPreloadCache {
  private readonly entries = new Map<string, HTMLImageElement>();
  private readonly order: string[] = [];

  constructor(private readonly maxSize: number = MEDIA_PRELOAD_CACHE_SIZE) {}

  get size(): number {
    return this.entries.size;
  }

  has(src: string): boolean {
    return this.entries.has(src);
  }

  /** Warm a small set of URLs; evicts oldest when over capacity. */
  preload(srcs: readonly string[]): void {
    if (typeof window === "undefined" || this.maxSize <= 0) return;

    for (const src of srcs) {
      if (!src || this.entries.has(src)) {
        if (src && this.entries.has(src)) this.touch(src);
        continue;
      }

      const image = new window.Image();
      image.decoding = "async";
      image.src = src;
      this.entries.set(src, image);
      this.order.push(src);
      this.evictIfNeeded();
    }
  }

  clear(): void {
    this.entries.clear();
    this.order.length = 0;
  }

  private touch(src: string): void {
    const index = this.order.indexOf(src);
    if (index >= 0) {
      this.order.splice(index, 1);
      this.order.push(src);
    }
  }

  private evictIfNeeded(): void {
    while (this.order.length > this.maxSize) {
      const oldest = this.order.shift();
      if (oldest) this.entries.delete(oldest);
    }
  }
}

let sharedCache: MediaPreloadCache | null = null;

export function getMediaPreloadCache(): MediaPreloadCache {
  if (!sharedCache) sharedCache = new MediaPreloadCache();
  return sharedCache;
}

/** Test helper — resets the singleton between suites. */
export function resetMediaPreloadCache(): void {
  sharedCache?.clear();
  sharedCache = null;
}
