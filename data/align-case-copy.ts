import type { DiscussionResponse, MediaKind, OfficiatingCase } from "@/lib/types";

/**
 * Language that implies the reader can see attached footage or a still.
 * Intentionally avoids bare "watch" so "Watch the defender's feet" stays valid
 * in written protocol posts.
 */
const MEDIA_REFERENCE =
  /\b(clips?|videos?|footage|replays?|poster|this still|this image|this photo|this picture|watched|from (?:your |this |my |that )?angle|single[- ]angle|teaching clip|no clip|attached (?:clip|video|image|still)|same clip|trap clip|ar angle|camera certainty)\b/i;

function scrubMediaReferences(text: string): string {
  return text
    .replace(/\bNo clip is attached,?\s*only the written protocol question\.?\s*/gi, "")
    .replace(/\bSame clip\b/gi, "Same case")
    .replace(/\btrap clip\b/gi, "trap case")
    .replace(/\bteaching clip\b/gi, "teaching case")
    .replace(/\b(?:the |this |attached )?(?:clips?|videos?|footage)\b/gi, "this situation")
    .replace(/\b(?:the |this |attached )?(?:replay|poster|still|image|photo|picture)\b/gi, "this situation")
    .replace(/\bWatched\b/g, "Read")
    .replace(/\bwatched\b/g, "read")
    .replace(/\breplay(?:ed|ing)?\b/gi, "re-read")
    .replace(/\bFrom (?:your |this |my |that )?angle\b/gi, "On these facts")
    .replace(/\bfrom (?:your |this |my |that )?angle\b/gi, "on these facts")
    .replace(/\bSingle[- ]angle only,?\s*/gi, "From the written facts, ")
    .replace(/\bsingle[- ]angle\b/gi, "written-fact")
    .replace(/\bAR angle\b/gi, "AR report")
    .replace(/\bcamera certainty\b/gi, "evidence certainty")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .trim();
}

function ensureTextOnlyPrompt(prompt: string): string {
  const cleaned = scrubMediaReferences(prompt);
  if (!MEDIA_REFERENCE.test(cleaned)) return cleaned;
  return scrubMediaReferences(cleaned);
}

function ensureMediaPrompt(prompt: string, kind: "image" | "video"): string {
  let next = prompt
    .replace(/\bNo clip is attached,?\s*only the written protocol question\.?\s*/gi, "")
    .trim();
  if (kind === "video" && /\b(image|photo|picture|still)\b/i.test(next) && !/\b(clip|video|footage)\b/i.test(next)) {
    next = next.replace(/\b(this |the |attached )?(image|photo|picture|still)\b/gi, "this clip");
  }
  if (kind === "image" && /\b(clip|video|footage)\b/i.test(next) && !/\b(image|photo|still)\b/i.test(next)) {
    next = next.replace(/\b(this |the |attached )?(clip|video|footage)\b/gi, "this still");
  }
  return next.replace(/\s{2,}/g, " ").trim();
}

function alignDescription(
  description: string,
  kind: MediaKind,
  mediaAlt: string,
): string {
  if (kind === "text") {
    let next = scrubMediaReferences(description);
    if (!/written|protocol|fact pattern|text-only/i.test(next)) {
      next = `Written protocol case. ${next}`;
    }
    return next.replace(/\s{2,}/g, " ").trim();
  }

  let next = description
    .replace(/\bNo clip is attached,?\s*only the written protocol question\.?\s*/gi, "")
    .replace(/\bWritten protocol (?:case|question)\.?\s*/gi, "")
    .trim();

  const mediaLabel = kind === "video" ? "clip" : "still";
  const alt = mediaAlt.trim().replace(/\.$/, "");
  if (alt && !next.toLowerCase().includes(alt.toLowerCase())) {
    next = `${next} The attached ${mediaLabel} shows ${alt.charAt(0).toLowerCase()}${alt.slice(1)}.`;
  }
  return next.replace(/\s{2,}/g, " ").trim();
}

function alignDiscussionBody(body: string, kind: MediaKind): string {
  if (kind !== "text") {
    return body
      .replace(/\bNo clip is attached,?\s*/gi, "")
      .replace(/\bWritten protocol (?:case|question)\.?\s*/gi, "")
      .trim();
  }
  return scrubMediaReferences(body);
}

function alignDiscussion(
  discussion: readonly DiscussionResponse[],
  kind: MediaKind,
): readonly DiscussionResponse[] {
  return discussion.map((item) => ({
    ...item,
    body: alignDiscussionBody(item.body, kind),
  }));
}

/**
 * After media assignment, make prompt / description / discussion match the
 * final media kind and on-screen asset. Text posts never claim a clip exists.
 */
export function alignCaseCopy(
  scenario: OfficiatingCase,
  options: {
    mediaKind: MediaKind;
    mediaAlt: string;
  },
): OfficiatingCase {
  const { mediaKind, mediaAlt } = options;
  const prompt =
    mediaKind === "text"
      ? ensureTextOnlyPrompt(scenario.prompt)
      : ensureMediaPrompt(scenario.prompt, mediaKind);

  return {
    ...scenario,
    mediaKind,
    mediaAlt,
    prompt,
    description: alignDescription(scenario.description, mediaKind, mediaAlt),
    seededDiscussion: alignDiscussion(scenario.seededDiscussion, mediaKind),
  };
}

export function referencesMedia(text: string): boolean {
  return MEDIA_REFERENCE.test(text);
}
