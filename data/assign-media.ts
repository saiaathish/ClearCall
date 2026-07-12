import type { OfficiatingCase } from "@/lib/types";
import { alignCaseCopy } from "@/data/align-case-copy";
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

function isAuthoredCaseStill(src: string | null | undefined): boolean {
  return Boolean(src?.startsWith("/media/cases/"));
}

/** Specialty categories need a real tag hit — never a random unrelated clip. */
function minScoreForCategory(category: string): number {
  const key = category.toLowerCase();
  if (
    key.includes("handball") ||
    key.includes("offside") ||
    key.includes("dogso") ||
    key.includes("denial") ||
    key.includes("goalkeeper") ||
    key.includes("keeper") ||
    key.includes("simulation") ||
    key.includes("serious foul") ||
    key.includes("foul play")
  ) {
    return 1;
  }
  return 0;
}

function pickBestPhoto(
  preferred: string | null | undefined,
  wanted: readonly string[],
  usedPhotos: Set<string>,
  photoQueue: MediaAsset[],
  minScore: number,
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

  if (bestIndex >= 0 && bestScore >= minScore) {
    const [picked] = photoQueue.splice(bestIndex, 1);
    if (picked) {
      usedPhotos.add(picked.src);
      return picked;
    }
  }

  // Only fall back to an unmatched still when the category is generic.
  if (minScore <= 0) {
    while (photoQueue.length > 0) {
      const next = photoQueue.shift()!;
      if (usedPhotos.has(next.src)) continue;
      usedPhotos.add(next.src);
      return next;
    }
  }
  return null;
}

function pickBestVideo(
  wanted: readonly string[],
  videoCursor: number,
  usedVideos: Map<string, number>,
  maxUses: number,
  minScore: number,
): VideoAsset | null {
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

  if (bestScore < minScore || tied.length === 0) return null;

  const best = tied[videoCursor % tied.length]!;
  usedVideos.set(best.videoSrc, (usedVideos.get(best.videoSrc) ?? 0) + 1);
  return best;
}

function asTextCase(scenario: OfficiatingCase): OfficiatingCase {
  const mediaAlt = `Text-only teaching prompt: ${scenario.title}`;
  return alignCaseCopy(
    {
      ...scenario,
      mediaKind: "text",
      imageSrc: null,
      videoSrc: null,
      posterSrc: null,
      mediaWidth: null,
      mediaHeight: null,
      mediaAlt,
    },
    { mediaKind: "text", mediaAlt },
  );
}

function asVideoCase(scenario: OfficiatingCase, video: VideoAsset): OfficiatingCase {
  // Always describe the clip that is actually attached.
  const mediaAlt = video.alt;
  return alignCaseCopy(
    {
      ...scenario,
      mediaKind: "video",
      imageSrc: null,
      videoSrc: video.videoSrc,
      posterSrc: video.posterSrc,
      mediaWidth: video.width,
      mediaHeight: video.height,
      mediaAlt,
    },
    { mediaKind: "video", mediaAlt },
  );
}

function asImageCase(scenario: OfficiatingCase, photo: MediaAsset): OfficiatingCase {
  const keepAuthoredAlt =
    scenario.imageSrc === photo.src &&
    Boolean(scenario.mediaAlt) &&
    !scenario.mediaAlt!.toLowerCase().includes("placeholder");
  const mediaAlt = keepAuthoredAlt ? scenario.mediaAlt! : photo.alt;
  return alignCaseCopy(
    {
      ...scenario,
      mediaKind: "image",
      imageSrc: photo.src,
      videoSrc: null,
      posterSrc: null,
      mediaWidth: photo.width,
      mediaHeight: photo.height,
      mediaAlt,
    },
    { mediaKind: "image", mediaAlt },
  );
}

/**
 * Ensures every image/video post uses a real photo or demo clip — never SVG —
 * and that image posts do not share the same file across the catalog.
 * Videos keep posters extracted from the same clip. Media is matched to the
 * case category when tags overlap; otherwise the post stays or becomes text
 * so copy never drifts from what is on screen. Authored text posts stay text.
 */
export function assignUniqueRealMedia(catalog: readonly OfficiatingCase[]): OfficiatingCase[] {
  const usedPhotos = new Set<string>();
  const photoQueue = [...PHOTO_ASSETS];
  const usedVideos = new Map<string, number>();
  let videoCursor = 0;
  const maxUsesPerClip = 4;
  const maxVideos = Math.min(
    VIDEO_ASSETS.length * maxUsesPerClip,
    Math.max(24, Math.floor(catalog.length * 0.55)),
  );

  const takeVideo = (scenario: OfficiatingCase, requireMatch: boolean): OfficiatingCase | null => {
    if (videoCursor >= maxVideos) return null;
    const wanted = tagsForCategory(scenario.category);
    const minScore = requireMatch ? minScoreForCategory(scenario.category) : 0;
    const video = pickBestVideo(wanted, videoCursor, usedVideos, maxUsesPerClip, minScore);
    if (!video) return null;
    videoCursor += 1;
    return asVideoCase(scenario, video);
  };

  return catalog.map((scenario) => {
    const kind =
      scenario.mediaKind ??
      (scenario.videoSrc ? "video" : scenario.imageSrc || scenario.posterSrc ? "image" : "text");
    const wanted = tagsForCategory(scenario.category);
    const minScore = minScoreForCategory(scenario.category);
    const preserveCaseStill = isAuthoredCaseStill(scenario.imageSrc);

    // Authored text posts stay text — never promote them into unrelated clips.
    if (kind === "text") {
      return asTextCase(scenario);
    }

    if (kind === "video") {
      return takeVideo(scenario, true) ?? takeVideo(scenario, false) ?? asTextCase(scenario);
    }

    // Prefer a category-matched clip over a stock still when the tags align.
    if (kind === "image" && !preserveCaseStill) {
      const upgraded = takeVideo(scenario, true);
      if (upgraded) return upgraded;
    }

    const photo = pickBestPhoto(scenario.imageSrc, wanted, usedPhotos, photoQueue, minScore);
    if (photo) return asImageCase(scenario, photo);

    // Specialty image with no matching still: try a matched clip, else text.
    const fallbackVideo = takeVideo(scenario, true);
    if (fallbackVideo) return fallbackVideo;
    return asTextCase(scenario);
  });
}
