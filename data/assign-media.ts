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
  // Preferred authored still only if unused (strict one-asset-per-post).
  if (
    preferred &&
    isAuthoredCaseStill(preferred) &&
    isRealPhoto(preferred) &&
    !usedPhotos.has(preferred)
  ) {
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

  // Stock placeholders only stick when unused AND tags match.
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

  // Generic categories may take any unused still.
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

function pickAnyUnusedPhoto(
  usedPhotos: Set<string>,
  photoQueue: MediaAsset[],
): MediaAsset | null {
  while (photoQueue.length > 0) {
    const next = photoQueue.shift()!;
    if (usedPhotos.has(next.src)) continue;
    usedPhotos.add(next.src);
    return next;
  }
  for (const candidate of PHOTO_ASSETS) {
    if (usedPhotos.has(candidate.src)) continue;
    usedPhotos.add(candidate.src);
    return candidate;
  }
  return null;
}

function pickBestVideo(
  category: string,
  usedVideos: Set<string>,
  minScore: number,
): VideoAsset | null {
  const available = VIDEO_ASSETS.filter((video) => !usedVideos.has(video.videoSrc));
  if (available.length === 0) return null;
  const wanted = tagsForCategory(category);

  let bestScore = -1;
  const tied: VideoAsset[] = [];
  for (const candidate of available) {
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

  // Specialty with no match: do not fall back to unrelated clips.
  if (tied.length === 0) {
    if (minScore > 0) return null;
    const next = available[0]!;
    usedVideos.add(next.videoSrc);
    return next;
  }

  const best = tied[0]!;
  usedVideos.add(best.videoSrc);
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
  // Always use the honest asset alt so copy matches what is on screen.
  const mediaAlt = photo.alt;
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
 * One post = one unique media file. No photo or video reuse across the catalog.
 * Specialty categories prefer tag-matched media; leftover unused photos are
 * backfilled onto text posts so the feed stays image-heavy.
 * Descriptions and comments are aligned to the attached asset after assignment.
 */
export function assignUniqueRealMedia(catalog: readonly OfficiatingCase[]): OfficiatingCase[] {
  const usedPhotos = new Set<string>();
  const photoQueue = [...PHOTO_ASSETS];
  const usedVideos = new Set<string>();

  const takeVideo = (scenario: OfficiatingCase, requireMatch: boolean): OfficiatingCase | null => {
    const minScore = requireMatch ? minScoreForCategory(scenario.category) : 0;
    if (!requireMatch && minScoreForCategory(scenario.category) > 0) return null;
    const video = pickBestVideo(scenario.category, usedVideos, minScore);
    if (!video) return null;
    return asVideoCase(scenario, video);
  };

  const assigned = catalog.map((scenario) => {
    const kind =
      scenario.mediaKind ??
      (scenario.videoSrc ? "video" : scenario.imageSrc || scenario.posterSrc ? "image" : "text");
    const minScore = minScoreForCategory(scenario.category);
    const preserveCaseStill =
      isAuthoredCaseStill(scenario.imageSrc) && !usedPhotos.has(scenario.imageSrc ?? "");

    if (kind === "text") {
      // Try a category-matched still first so authored text posts can become images.
      const photo = pickBestPhoto(null, scenario.category, usedPhotos, photoQueue, minScore);
      if (photo) return asImageCase(scenario, photo);
      return asTextCase(scenario);
    }

    if (kind === "video") {
      return takeVideo(scenario, true) ?? asTextCase(scenario);
    }

    // Prefer unique matched clip for image drafts unless an unused authored still wins.
    if (kind === "image" && !preserveCaseStill) {
      const upgraded = takeVideo(scenario, true);
      if (upgraded) return upgraded;
    }

    const photo = pickBestPhoto(scenario.imageSrc, scenario.category, usedPhotos, photoQueue, minScore);
    if (photo) return asImageCase(scenario, photo);

    const fallbackVideo = takeVideo(scenario, true);
    if (fallbackVideo) return fallbackVideo;
    return asTextCase(scenario);
  });

  // Backfill: leftover unique photos go onto remaining text posts.
  // Prefer a tag match; otherwise attach any unused still and ground the copy.
  for (let index = 0; index < assigned.length; index += 1) {
    const scenario = assigned[index]!;
    if (scenario.mediaKind !== "text") continue;

    const matched = pickBestPhoto(null, scenario.category, usedPhotos, photoQueue, 1);
    if (matched) {
      assigned[index] = asImageCase(scenario, matched);
      continue;
    }

    const anyPhoto = pickAnyUnusedPhoto(usedPhotos, photoQueue);
    if (!anyPhoto) break;
    assigned[index] = asImageCase(scenario, anyPhoto);
  }

  return assigned;
}
