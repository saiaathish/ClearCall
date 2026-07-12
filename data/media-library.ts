/**
 * Ambient media pool for the feed. Cases without their own asset (or repeat
 * appearances in the infinite mix) draw a random item from here so the stream
 * stays visually varied. Real photos only — no SVG placeholders.
 */
import { PHOTO_ASSETS } from "@/data/media-assets";
import type { MediaLibraryItem } from "@/data/media-library-types";

export type { MediaLibraryItem } from "@/data/media-library-types";

export const mediaLibrary: readonly MediaLibraryItem[] = PHOTO_ASSETS.map((item, index) => ({
  id: `lib-${index}-${item.src.split("/").pop()?.replace(/\W+/g, "-") ?? index}`,
  src: item.src,
  width: item.width,
  height: item.height,
  alt: item.alt,
  tags: item.tags,
}));

export function mediaLibrarySrcs(): readonly string[] {
  return mediaLibrary.map((item) => item.src);
}
