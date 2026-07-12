import type { OfficiatingCase } from "@/lib/types";
import { alignCaseCopy } from "@/data/align-case-copy";
import {
  PHOTO_ASSETS,
  VIDEO_ASSETS,
  matchesCategory,
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

function assetTagsForSrc(src: string): readonly string[] {
  const known = PHOTO_ASSETS.find((item) => item.src === src);
  return known?.tags ?? (isAuthoredCaseStill(src) ? ["match"] : []);
}

function pickBestPhoto(
  preferred: string | null | undefined,
  category: string,
  usedPhotos: Set<string>,
  photoQueue: MediaAsset[],
  minScore: number,
): MediaAsset | null {
  // Authored /media/cases/* stills are preserved even when reused across related posts.
  if (preferred && isAuthoredCaseStill(preferred) && isRealPhoto(preferred)) {
    const known = PHOTO_ASSETS.find((item) => item.src === preferred);
    usedPhotos.add(preferred);
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

  // Stock placeholders only stick when their tags actually match the category.
  if (
    preferred &&
    isRealPhoto(preferred) &&
    !usedPhotos.has(preferred) &&
    matchesCategory(assetTagsForSrc(preferred), category, minScore)
  ) {
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
  const wanted = tagsForCategory(category);
  for (let i = 0; i < photoQueue.length; i += 1) {
    const candidate = photoQueue[i]!;
    if (usedPhotos.has(candidate.src)) continue;
    if (!matchesCategory(candidate.tags, category, minScore)) continue;
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
  category: string,
  videoCursor: number,
  usedVideos: Map<string, number>,
  maxUses: number,
  minScore: number,
): VideoAsset | null {
  const available = VIDEO_ASSETS.filter((video) => (usedVideos.get(video.videoSrc) ?? 0) < maxUses);
  const pool = available.length > 0 ? available : [...VIDEO_ASSETS];
  const wanted = tagsForCategory(category);

  let bestScore = -1;
  const tied: VideoAsset[] = [];
  for (const candidate of pool) {
    if (!matchesCategory(candidate.tags, category, minScore)) continue;
    const score = scoreTagOverlap(candidate.tags, wanted);
    if (score > bestScore) {
      bestScore = score;
      tied.length = 0;
      tied.push(candidate);
    } else if (score === bestScore) {
      tied.push(candidate);
    }
  }

  if (tied.length === 0) return null;

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
 * and that image posts do not share the same stock file across the catalog.
 * Specialty categories keep media only when primary tags match; otherwise the
 * post becomes text so copy never drifts from what is on screen.
 */
export function assignUniqueRealMedia(catalog: readonly OfficiatingCase[]): OfficiatingCase[] {
  const usedPhotos = new Set<string>();
  const photoQueue = [...PHOTO_ASSETS];
  const usedVideos = new Map<string, number>();
  let videoCursor = 0;
  // Fewer unique match clips → allow more reuse so the mix stays clip-heavy.
  const maxUsesPerClip = 5;
  const maxVideos = Math.min(
    VIDEO_ASSETS.length * maxUsesPerClip,
    Math.max(24, Math.floor(catalog.length * 0.6)),
  );

  const takeVideo = (scenario: OfficiatingCase, requireMatch: boolean): OfficiatingCase | null => {
    if (videoCursor >= maxVideos) return null;
    const minScore = requireMatch ? minScoreForCategory(scenario.category) : 0;
    // Specialty categories never accept unmatched clips.
    if (!requireMatch && minScoreForCategory(scenario.category) > 0) return null;
    const video = pickBestVideo(scenario.category, videoCursor, usedVideos, maxUsesPerClip, minScore);
    if (!video) return null;
    videoCursor += 1;
    return asVideoCase(scenario, video);
  };

  return catalog.map((scenario) => {
    const kind =
      scenario.mediaKind ??
      (scenario.videoSrc ? "video" : scenario.imageSrc || scenario.posterSrc ? "image" : "text");
    const minScore = minScoreForCategory(scenario.category);
    const preserveCaseStill = isAuthoredCaseStill(scenario.imageSrc);

    // Authored text posts stay text — never promote them into unrelated clips.
    if (kind === "text") {
      return asTextCase(scenario);
    }

    if (kind === "video") {
      return takeVideo(scenario, true) ?? asTextCase(scenario);
    }

    // Prefer a category-matched clip over a stock still when primary tags align.
    // Never upgrade away from an authored /media/cases/* still.
    if (kind === "image" && !preserveCaseStill) {
      const upgraded = takeVideo(scenario, true);
      if (upgraded) return upgraded;
    }

    const photo = pickBestPhoto(scenario.imageSrc, scenario.category, usedPhotos, photoQueue, minScore);
    if (photo) return asImageCase(scenario, photo);

    // Specialty image with no matching still: try a matched clip, else text.
    const fallbackVideo = takeVideo(scenario, true);
    if (fallbackVideo) return fallbackVideo;
    return asTextCase(scenario);
  });
}
