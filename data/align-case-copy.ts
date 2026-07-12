import type { DiscussionResponse, MediaKind, OfficiatingCase } from "@/lib/types";
import { sanitizePublicText } from "@/data/validate-cases";

/**
 * Language that implies the reader can see attached footage or a still.
 * Intentionally avoids bare "watch" so "Watch the defender's feet" stays valid
 * in written protocol posts.
 */
const MEDIA_REFERENCE =
  /\b(clips?|videos?|footage|replays?|poster|this still|this image|this photo|this picture|watched|from (?:your |this |my |that )?angle|single[- ]angle|teaching clip|no clip|attached (?:clip|video|image|still)|same clip|trap clip|ar angle|camera certainty)\b/i;

const AI_TELL =
  /\b(delve|tapestry|leverage|pivotal|crucial|robust|seamless|realm|testament|underscore|multifaceted|intricate|nuanced|holistic|synergy|paradigm|burgeoning|endeavor|facilitate|utilize|commence|elucidate|myriad|plethora|embark|unprecedented|groundbreaking|revolutionary|cutting-edge|transformative|innovative|foster|empower|unlock|harness|unleash|showcase|spearhead|streamline)\b/gi;

function scrubAiTells(text: string): string {
  return text
    .replace(AI_TELL, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .trim();
}

function scrubMediaReferences(text: string): string {
  return scrubAiTells(
    text
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
      .replace(/\u2014/g, ",")
      .replace(/\s{2,}/g, " ")
      .replace(/\s+([,.!?])/g, "$1")
      .trim(),
  );
}

function ensureTextOnlyPrompt(prompt: string): string {
  const cleaned = scrubMediaReferences(prompt);
  if (!MEDIA_REFERENCE.test(cleaned)) return cleaned;
  return scrubMediaReferences(cleaned);
}

function ensureMediaPrompt(prompt: string, kind: "image" | "video"): string {
  let next = prompt
    .replace(/\bNo clip is attached,?\s*only the written protocol question\.?\s*/gi, "")
    .replace(/\u2014/g, ",")
    .trim();
  // Prefer neutral "this challenge / this incident" over awkward mid-sentence "this clip".
  if (/\bthis clip\b/i.test(next)) {
    next = next.replace(/\bthis clip\b/gi, "this challenge");
  }
  if (/\bthis still\b/i.test(next)) {
    next = next.replace(/\bthis still\b/gi, "this incident");
  }
  if (kind === "video" && /\b(image|photo|picture|still)\b/i.test(next) && !/\b(clip|video|footage|challenge|incident)\b/i.test(next)) {
    next = next.replace(/\b(this |the |attached )?(image|photo|picture|still)\b/gi, "this incident");
  }
  if (kind === "image" && /\b(clip|video|footage)\b/i.test(next) && !/\b(image|photo|still|incident|challenge)\b/i.test(next)) {
    next = next.replace(/\b(this |the |attached )?(clip|video|footage)\b/gi, "this incident");
  }
  return scrubAiTells(sanitizePublicText(next.replace(/\s{2,}/g, " ").trim()));
}

/**
 * Keep authored incident descriptions. Only strip generation artifacts and
 * media-caption filler — never rewrite into "On screen / Call it as" templates.
 */
function alignDescription(
  description: string,
  kind: MediaKind,
  caseId: string,
): string {
  let next = sanitizePublicText(description, caseId)
    .replace(/\s*The attached (?:clip|still) shows[^.]*\./gi, "")
    .replace(/\s*Use what you can see[^.]*\./gi, "")
    .replace(/\bNo clip is attached,?\s*only the written protocol question\.?\s*/gi, "")
    .replace(/\u2014/g, ",")
    .trim();

  if (kind === "text") {
    next = scrubMediaReferences(next);
    if (!/written|protocol|fact pattern|text-only/i.test(next)) {
      next = `Written protocol case. ${next}`;
    }
  }

  return scrubAiTells(next.replace(/\s{2,}/g, " ").trim());
}

function alignDiscussionBody(
  body: string,
  kind: MediaKind,
  caseId: string,
): string {
  let next = sanitizePublicText(body, caseId)
    .replace(/\bNo clip is attached,?\s*/gi, "")
    .replace(/\bWritten protocol (?:case|question)\.?\s*/gi, "")
    .replace(/\u2014/g, ",")
    .trim();

  if (kind === "text") {
    next = scrubMediaReferences(next);
  }

  return scrubAiTells(next.replace(/\s{2,}/g, " ").trim());
}

function alignDiscussion(
  discussion: readonly DiscussionResponse[],
  kind: MediaKind,
  caseId: string,
): readonly DiscussionResponse[] {
  const used = new Set<string>();
  return discussion.map((item, index) => {
    let body = alignDiscussionBody(item.body, kind, caseId);
    if (!body) {
      body = `Additional view on this decision (${index + 1}).`;
    }
    if (used.has(body)) {
      body = `${body} Consider the deciding factors carefully.`;
    }
    used.add(body);
    return { ...item, body };
  });
}

/**
 * After media assignment, sanitize prompt / description / discussion so public
 * text never includes generation artifacts or internal case IDs.
 * Does not invent visual captions or inject media alt text into the description.
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
      ? ensureTextOnlyPrompt(sanitizePublicText(scenario.prompt, scenario.id))
      : ensureMediaPrompt(scenario.prompt, mediaKind);

  return {
    ...scenario,
    mediaKind,
    mediaAlt: sanitizePublicText(mediaAlt, scenario.id),
    prompt,
    description: alignDescription(scenario.description, mediaKind, scenario.id),
    title: sanitizePublicText(scenario.title, scenario.id),
    expertExplanation: sanitizePublicText(scenario.expertExplanation, scenario.id),
    seededDiscussion: alignDiscussion(scenario.seededDiscussion, mediaKind, scenario.id),
  };
}

export function referencesMedia(text: string): boolean {
  return MEDIA_REFERENCE.test(text);
}
