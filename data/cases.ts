import type { OfficiatingCase } from "@/lib/types";
import { DEMO_REVIEW_DISCLAIMER } from "@/data/case-builders";
import { demoCatalog } from "@/data/demo-catalog";
import { alignCaseCopy } from "@/data/align-case-copy";
import { filterValidDemoCases } from "@/data/validate-cases";

export { DEMO_REVIEW_DISCLAIMER };

/**
 * Preserve authored media when unique. Only sanitize public copy.
 * Does not upgrade images to unrelated clips or backfill mismatched stills.
 */
function finalizeDemoCases(catalog: readonly OfficiatingCase[]): OfficiatingCase[] {
  const usedMedia = new Set<string>();
  const finalized: OfficiatingCase[] = [];

  for (const scenario of catalog) {
    const mediaSrc = scenario.videoSrc ?? scenario.imageSrc ?? scenario.posterSrc;
    if (mediaSrc && usedMedia.has(mediaSrc)) {
      // Convert colliding media posts to text protocol rather than reuse an asset.
      const mediaAlt = `Text-only teaching prompt: ${scenario.title}`;
      finalized.push(
        alignCaseCopy(
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
        ),
      );
      continue;
    }

    if (mediaSrc) usedMedia.add(mediaSrc);
    if (scenario.posterSrc && scenario.posterSrc !== mediaSrc) {
      usedMedia.add(scenario.posterSrc);
    }

    finalized.push(
      alignCaseCopy(scenario, {
        mediaKind: scenario.mediaKind ?? "text",
        mediaAlt: scenario.mediaAlt,
      }),
    );
  }

  return filterValidDemoCases(finalized);
}

export const cases: readonly OfficiatingCase[] = finalizeDemoCases(demoCatalog);
