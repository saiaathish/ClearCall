import type { DiscussionResponse, MediaKind, OfficiatingCase } from "@/lib/types";

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
      .replace(/\u2014/g, ",") // no em-dashes
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
  if (kind === "video" && /\b(image|photo|picture|still)\b/i.test(next) && !/\b(clip|video|footage)\b/i.test(next)) {
    next = next.replace(/\b(this |the |attached )?(image|photo|picture|still)\b/gi, "this clip");
  }
  if (kind === "image" && /\b(clip|video|footage)\b/i.test(next) && !/\b(image|photo|still)\b/i.test(next)) {
    next = next.replace(/\b(this |the |attached )?(clip|video|footage)\b/gi, "this still");
  }
  return scrubAiTells(next.replace(/\s{2,}/g, " ").trim());
}

function visualPhrase(mediaAlt: string): string {
  return mediaAlt.trim().replace(/\.$/, "");
}

/**
 * Ground the teaching scenario in what is actually on screen.
 * Human-centric: short bursts, concrete visual first, then the call question.
 */
function alignDescription(
  description: string,
  kind: MediaKind,
  mediaAlt: string,
  category: string,
): string {
  if (kind === "text") {
    let next = scrubMediaReferences(description);
    if (!/written|protocol|fact pattern|text-only/i.test(next)) {
      next = `Written protocol case. ${next}`;
    }
    return next.replace(/\s{2,}/g, " ").trim();
  }

  const mediaLabel = kind === "video" ? "clip" : "still";
  const visual = visualPhrase(mediaAlt);
  const teaching = description
    .replace(/\s*The attached (?:clip|still) shows[^.]*\./gi, "")
    .replace(/\s*On screen:[^.]*\./gi, "")
    .replace(/\s*Use what you can see[^.]*\./gi, "")
    .replace(/\bNo clip is attached,?\s*only the written protocol question\.?\s*/gi, "")
    .replace(/\bWritten protocol (?:case|question)\.?\s*/gi, "")
    .replace(/\u2014/g, ",")
    .trim();

  // Lead with the visual using the exact mediaAlt, then the teaching beat.
  const grounded = [
    `On screen: ${visual}.`,
    teaching,
    `Call it as a ${category.toLowerCase()} look off this ${mediaLabel}.`,
  ].join(" ");

  return scrubAiTells(grounded.replace(/\s{2,}/g, " ").trim());
}

const MEDIA_COMMENT_HOOKS = [
  (visual: string, noun: string) => `yeah looking at this ${noun}. ${visual}. that's the whole argument for me.`,
  (visual: string, noun: string) => `paused the ${noun} on ${visual.charAt(0).toLowerCase()}${visual.slice(1)}. still not sold either way.`,
  (visual: string, noun: string) => `ok the ${noun} shows ${visual.charAt(0).toLowerCase()}${visual.slice(1)}. once you see that the rest is noise.`,
  (visual: string, noun: string) => `hmm. rewatched. ${visual}. changes how loud i get about the card.`,
  (visual: string) => `blunt: if that's what we're judging, ${visual.charAt(0).toLowerCase()}${visual.slice(1)}. write that first.`,
];

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function sharesVisualCue(body: string, visual: string): boolean {
  const tokens = visual
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 5)
    .slice(0, 4);
  if (tokens.length === 0) return body.toLowerCase().includes(visual.toLowerCase().slice(0, 24));
  const lower = body.toLowerCase();
  return tokens.some((token) => lower.includes(token));
}

function alignDiscussionBody(
  body: string,
  kind: MediaKind,
  mediaAlt: string,
  index: number,
  caseId: string,
): string {
  if (kind === "text") {
    return scrubMediaReferences(body);
  }

  const noun = kind === "video" ? "clip" : "still";
  const visual = visualPhrase(mediaAlt);
  let next = body
    .replace(/\bNo clip is attached,?\s*/gi, "")
    .replace(/\bWritten protocol (?:case|question)\.?\s*/gi, "")
    .replace(/\u2014/g, ",")
    .replace(/\bwatched [^.!?]{0,80}/gi, `rewatched ${caseId}'s ${noun}`)
    .replace(/\breplay(?:ed|ing)?\b/gi, `${noun} check`)
    .replace(/\bfrom the ar angle\b/gi, `from this ${noun}`)
    .trim();

  // Pin + a couple replies must talk about what's actually visible (Reddit-style, short).
  if ((index === 0 || index === 2 || index === 4) && !sharesVisualCue(next, visual)) {
    const hook = MEDIA_COMMENT_HOOKS[(hashSeed(`${caseId}:${index}`) + index) % MEDIA_COMMENT_HOOKS.length]!;
    const grounded = `${hook(visual, noun)} [${caseId}]`;
    next = index === 0 ? `${next} ${grounded}` : grounded;
  } else if (!next.includes(caseId)) {
    // Keep catalog-wide uniqueness even when the template already mentioned the visual.
    next = `${next} (${caseId}:${index})`;
  }

  return scrubAiTells(next.replace(/\s{2,}/g, " ").trim());
}

function alignDiscussion(
  discussion: readonly DiscussionResponse[],
  kind: MediaKind,
  mediaAlt: string,
  caseId: string,
): readonly DiscussionResponse[] {
  const used = new Set<string>();
  return discussion.map((item, index) => {
    let body = alignDiscussionBody(item.body, kind, mediaAlt, index, caseId);
    if (used.has(body)) {
      body = `${body} (${index + 1})`;
    }
    used.add(body);
    return { ...item, body };
  });
}

/**
 * After media assignment, make prompt / description / discussion match the
 * final media kind and on-screen asset. Text posts never claim a clip exists.
 * Media posts talk about what is actually attached (human, concrete, short).
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
    description: alignDescription(scenario.description, mediaKind, mediaAlt, scenario.category),
    seededDiscussion: alignDiscussion(scenario.seededDiscussion, mediaKind, mediaAlt, scenario.id),
  };
}

export function referencesMedia(text: string): boolean {
  return MEDIA_REFERENCE.test(text);
}
