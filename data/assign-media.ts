import type { OfficiatingCase } from "@/lib/types";
import {
  PHOTO_ASSETS,
  VIDEO_ASSETS,
  scoreTagOverlap,
  tagsForCategory,
  type MediaAsset,
  type VideoAsset,
} from "@/data/media-assets";

function isRealPhoto(src: string | null | undefined): boolean {
  if (!src) return false;
  if (src.endsWith(".svg")) return false;
  return (
    PHOTO_ASSETS.some((item) => item.src === src) ||
    src.startsWith("/media/cases/") ||
    src.startsWith("/media/stock/") ||
    src.startsWith("/media/demo/poster-")
  );
}

function pickBestPhoto(
  preferred: string | null | undefined,
  wanted: readonly string[],
  usedPhotos: Set<string>,
  photoQueue: MediaAsset[],
): MediaAsset | null {
  if (preferred && isRealPhoto(preferred) && !usedPhotos.has(preferred)) {
    usedPhotos.add(preferred);
    const known = PHOTO_ASSETS.find((item) => item.src === preferred);
    return (
      known ?? {
        src: preferred,
        width: 1200,
        height: 800,
        alt: "Match still for this teaching post",
        tags: ["match"],
      }
    );
  }

  let bestIndex = -1;
  let bestScore = -1;
  for (let i = 0; i < photoQueue.length; i += 1) {
    const candidate = photoQueue[i]!;
    if (usedPhotos.has(candidate.src)) continue;
    const score = scoreTagOverlap(candidate.tags, wanted);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  if (bestIndex >= 0) {
    const [picked] = photoQueue.splice(bestIndex, 1);
    if (picked) {
      usedPhotos.add(picked.src);
      return picked;
    }
  }

  while (photoQueue.length > 0) {
    const next = photoQueue.shift()!;
    if (usedPhotos.has(next.src)) continue;
    usedPhotos.add(next.src);
    return next;
  }
  return null;
}

function pickBestVideo(
  wanted: readonly string[],
  videoCursor: number,
  usedVideos: Map<string, number>,
): VideoAsset {
  const maxUses = 3;
  const available = VIDEO_ASSETS.filter((video) => (usedVideos.get(video.videoSrc) ?? 0) < maxUses);
  const pool = available.length > 0 ? available : [...VIDEO_ASSETS];

  let bestScore = -1;
  const tied: VideoAsset[] = [];
  for (const candidate of pool) {
    const score = scoreTagOverlap(candidate.tags, wanted);
    if (score > bestScore) {
      bestScore = score;
      tied.length = 0;
      tied.push(candidate);
    } else if (score === bestScore) {
      tied.push(candidate);
    }
  }

  const best = tied[videoCursor % tied.length] ?? pool[videoCursor % pool.length]!;
  usedVideos.set(best.videoSrc, (usedVideos.get(best.videoSrc) ?? 0) + 1);
  return best;
}

/**
 * Ensures every image/video post uses a real photo or demo clip — never SVG —
 * and that image posts do not share the same file across the catalog.
 * Videos keep posters extracted from the same clip. Media is matched to the
 * case category when possible. Surplus media-shaped posts become text-only.
 */
export function assignUniqueRealMedia(catalog: readonly OfficiatingCase[]): OfficiatingCase[] {
  const usedPhotos = new Set<string>();
  const photoQueue = [...PHOTO_ASSETS];
  const usedVideos = new Map<string, number>();
  let videoCursor = 0;
  const maxVideos = VIDEO_ASSETS.length * 3;

  return catalog.map((scenario) => {
    const kind =
      scenario.mediaKind ??
      (scenario.videoSrc ? "video" : scenario.imageSrc || scenario.posterSrc ? "image" : "text");
    const wanted = tagsForCategory(scenario.category);

    if (kind === "text") {
      return {
        ...scenario,
        mediaKind: "text" as const,
        imageSrc: null,
        videoSrc: null,
        posterSrc: null,
        mediaWidth: null,
        mediaHeight: null,
      };
    }

    if (kind === "video") {
      if (videoCursor >= maxVideos) {
        return {
          ...scenario,
          mediaKind: "text" as const,
          imageSrc: null,
          videoSrc: null,
          posterSrc: null,
          mediaWidth: null,
          mediaHeight: null,
          mediaAlt: `Text-only teaching prompt: ${scenario.title}`,
        };
      }
      const video = pickBestVideo(wanted, videoCursor, usedVideos);
      videoCursor += 1;
      return {
        ...scenario,
        mediaKind: "video" as const,
        imageSrc: null,
        videoSrc: video.videoSrc,
        posterSrc: video.posterSrc,
        mediaWidth: video.width,
        mediaHeight: video.height,
        mediaAlt: scenario.mediaAlt?.includes("placeholder")
          ? video.alt
          : scenario.mediaAlt || video.alt,
      };
    }

    const photo = pickBestPhoto(scenario.imageSrc, wanted, usedPhotos, photoQueue);
    if (!photo) {
      return {
        ...scenario,
        mediaKind: "text" as const,
        imageSrc: null,
        videoSrc: null,
        posterSrc: null,
        mediaWidth: null,
        mediaHeight: null,
        mediaAlt: `Text-only teaching prompt: ${scenario.title}`,
      };
    }

    const keepAuthoredAlt =
      scenario.imageSrc === photo.src &&
      scenario.mediaAlt &&
      !scenario.mediaAlt.toLowerCase().includes("placeholder");

    return {
      ...scenario,
      mediaKind: "image" as const,
      imageSrc: photo.src,
      videoSrc: null,
      posterSrc: null,
      mediaWidth: photo.width,
      mediaHeight: photo.height,
      mediaAlt: keepAuthoredAlt ? scenario.mediaAlt : photo.alt,
    };
  });
}
