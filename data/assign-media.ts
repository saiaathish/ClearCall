import type { OfficiatingCase } from "@/lib/types";
import { PHOTO_ASSETS, VIDEO_ASSETS } from "@/data/media-assets";

function isRealPhoto(src: string | null | undefined): boolean {
  if (!src) return false;
  if (src.endsWith(".svg")) return false;
  return PHOTO_ASSETS.some((item) => item.src === src) || src.startsWith("/media/cases/") || src.startsWith("/media/stock/");
}

/**
 * Ensures every image/video post uses a real photo or demo clip — never SVG —
 * and that image posts do not share the same file across the catalog.
 * Surplus media-shaped posts become text-only so the feed stays honest.
 */
export function assignUniqueRealMedia(catalog: readonly OfficiatingCase[]): OfficiatingCase[] {
  const usedPhotos = new Set<string>();
  const photoQueue = [...PHOTO_ASSETS];
  let videoCursor = 0;

  const takePhoto = (preferred?: string | null) => {
    if (preferred && isRealPhoto(preferred) && !usedPhotos.has(preferred)) {
      usedPhotos.add(preferred);
      const known = PHOTO_ASSETS.find((item) => item.src === preferred);
      return (
        known ?? {
          src: preferred,
          width: 1200,
          height: 800,
          alt: "Match still for this teaching post",
        }
      );
    }
    while (photoQueue.length > 0) {
      const next = photoQueue.shift()!;
      if (usedPhotos.has(next.src)) continue;
      usedPhotos.add(next.src);
      return next;
    }
    return null;
  };

  return catalog.map((scenario) => {
    const kind =
      scenario.mediaKind ??
      (scenario.videoSrc ? "video" : scenario.imageSrc || scenario.posterSrc ? "image" : "text");

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
      if (videoCursor >= VIDEO_ASSETS.length * 3) {
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
      const video = VIDEO_ASSETS[videoCursor % VIDEO_ASSETS.length]!;
      videoCursor += 1;
      const poster = takePhoto(scenario.posterSrc) ?? takePhoto(scenario.imageSrc);
      if (!poster) {
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
      return {
        ...scenario,
        mediaKind: "video" as const,
        imageSrc: null,
        videoSrc: video.videoSrc,
        posterSrc: poster.src,
        mediaWidth: video.width,
        mediaHeight: video.height,
        mediaAlt: video.alt,
      };
    }

    const photo = takePhoto(scenario.imageSrc);
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
    return {
      ...scenario,
      mediaKind: "image" as const,
      imageSrc: photo.src,
      videoSrc: null,
      posterSrc: null,
      mediaWidth: photo.width,
      mediaHeight: photo.height,
      mediaAlt: photo.alt || scenario.mediaAlt,
    };
  });
}
