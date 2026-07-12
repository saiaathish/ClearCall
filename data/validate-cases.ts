import type { OfficiatingCase } from "@/lib/types";

/** Phrases that signal broken generation templates. */
const BROKEN_PHRASES = [
  /call it as\b/i,
  /look off this\b/i,
  /once you see that the rest is noise/i,
  /changes how loud i get/i,
  /still not sold either way/i,
  /that's the whole argument for me/i,
  /\bblunt: if that's what we're judging\b/i,
  /\bon screen:/i,
  /\bshould you this\b/i,
  /\bthis clip be a\b/i,
  /\bthis still a\b/i,
  /\bfrom the side this clip\b/i,
] as const;

/** Internal IDs / generation artifacts that must not appear in public text. */
const INTERNAL_ARTIFACT =
  /\[(?:sfp|handball|offside|dogso|advantage|simulation|goalkeeper|gk|gen|restart|dissent|holding)-[^\]]+\]|\((?:gen|sfp|handball|offside|dogso|advantage|simulation|goalkeeper|gk|restart|dissent|holding)-[^)]+:\d+\)|\bgen-[a-z0-9-]+-\d{3}\b/i;


export type CaseValidationIssue = {
  caseId: string;
  field: string;
  message: string;
};

function collectPublicText(scenario: OfficiatingCase): Array<{ field: string; text: string }> {
  const fields: Array<{ field: string; text: string }> = [
    { field: "title", text: scenario.title },
    { field: "prompt", text: scenario.prompt },
    { field: "description", text: scenario.description },
    { field: "originalDecision", text: scenario.originalDecision },
    { field: "expertExplanation", text: scenario.expertExplanation },
    { field: "ruleReference", text: scenario.ruleReference },
    { field: "mediaAlt", text: scenario.mediaAlt },
  ];
  scenario.seededDiscussion.forEach((comment, index) => {
    fields.push({ field: `discussion[${index}]`, text: comment.body });
  });
  return fields;
}

function issuesForText(caseId: string, field: string, text: string): CaseValidationIssue[] {
  const issues: CaseValidationIssue[] = [];
  if (!text || !text.trim()) {
    issues.push({ caseId, field, message: "missing or empty" });
    return issues;
  }
  for (const pattern of BROKEN_PHRASES) {
    if (pattern.test(text)) {
      issues.push({
        caseId,
        field,
        message: `contains broken generated phrase matching ${pattern}`,
      });
    }
  }
  if (INTERNAL_ARTIFACT.test(text)) {
    issues.push({ caseId, field, message: "contains internal ID or generation artifact" });
  }
  if (text.includes(caseId) && field !== "id") {
    issues.push({ caseId, field, message: "contains raw case ID" });
  }
  return issues;
}

/**
 * Validate seeded/demo cases for public-facing content quality.
 * Returns issues; does not throw. Callers decide whether to omit cases in production.
 */
export function validateCases(catalog: readonly OfficiatingCase[]): CaseValidationIssue[] {
  const issues: CaseValidationIssue[] = [];
  const seenIds = new Set<string>();
  const seenMedia = new Set<string>();
  const seenBodies = new Set<string>();

  for (const scenario of catalog) {
    if (seenIds.has(scenario.id)) {
      issues.push({ caseId: scenario.id, field: "id", message: "duplicate case ID" });
    }
    seenIds.add(scenario.id);

    if (!scenario.title?.trim()) {
      issues.push({ caseId: scenario.id, field: "title", message: "missing title" });
    }
    if (!scenario.description?.trim()) {
      issues.push({ caseId: scenario.id, field: "description", message: "missing description" });
    }
    if (!scenario.originalDecision?.trim()) {
      issues.push({ caseId: scenario.id, field: "originalDecision", message: "missing original decision" });
    }
    if (!scenario.ruleReference?.trim()) {
      issues.push({ caseId: scenario.id, field: "ruleReference", message: "missing law/rule concept" });
    }

    if (scenario.title.length > 90) {
      issues.push({
        caseId: scenario.id,
        field: "title",
        message: `title exceeds 90 characters (${scenario.title.length})`,
      });
    }

    for (const { field, text } of collectPublicText(scenario)) {
      issues.push(...issuesForText(scenario.id, field, text));
    }

    const discussion = scenario.seededDiscussion;
    if (discussion.length !== 3) {
      issues.push({
        caseId: scenario.id,
        field: "seededDiscussion",
        message: `expected exactly 3 discussion comments, got ${discussion.length}`,
      });
    }

    const bodies = discussion.map((item) => item.body.trim());
    if (new Set(bodies).size !== bodies.length) {
      issues.push({
        caseId: scenario.id,
        field: "seededDiscussion",
        message: "duplicated discussion comments within case",
      });
    }

    for (const body of bodies) {
      if (seenBodies.has(body)) {
        issues.push({
          caseId: scenario.id,
          field: "seededDiscussion",
          message: `discussion body reused across catalog: ${body.slice(0, 72)}`,
        });
      }
      seenBodies.add(body);

      if (scenario.mediaAlt && body.toLowerCase().includes(scenario.mediaAlt.toLowerCase().trim())) {
        issues.push({
          caseId: scenario.id,
          field: "seededDiscussion",
          message: "comment contains media alt text verbatim",
        });
      }
    }

    const mediaSrc = scenario.videoSrc ?? scenario.imageSrc ?? scenario.posterSrc;
    if (mediaSrc) {
      if (seenMedia.has(mediaSrc)) {
        issues.push({
          caseId: scenario.id,
          field: "media",
          message: `duplicate media asset: ${mediaSrc}`,
        });
      }
      seenMedia.add(mediaSrc);
    }

    if (scenario.mediaKind === "video" && !scenario.videoSrc) {
      issues.push({ caseId: scenario.id, field: "videoSrc", message: "video kind missing videoSrc" });
    }
    if (scenario.mediaKind === "image" && !scenario.imageSrc) {
      issues.push({ caseId: scenario.id, field: "imageSrc", message: "image kind missing imageSrc" });
    }
    if (scenario.mediaKind === "text" && (scenario.imageSrc || scenario.videoSrc)) {
      issues.push({
        caseId: scenario.id,
        field: "mediaKind",
        message: "text case unexpectedly has media src",
      });
    }
  }

  return issues;
}

/**
 * Strip internal IDs and broken generation leftovers from public text.
 */
export function sanitizePublicText(text: string, caseId?: string): string {
  let next = text
    .replace(/\[[a-z0-9]+(?:-[a-z0-9]+)+\]/gi, "")
    .replace(/\((?:gen|[a-z]+)-[a-z0-9-]+:\d+\)/gi, "")
    .replace(/\bgen-[a-z0-9-]+-\d{3}\b/gi, "")
    .replace(/\s*On screen:[^.]*\./gi, "")
    .replace(/\s*Call it as a [^.]*\./gi, "")
    .replace(/\s*look off this (?:clip|still)\.?/gi, "")
    .replace(/\s*The attached still shows[^.]*\./gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .trim();

  if (caseId) {
    next = next
      .replaceAll(`[${caseId}]`, "")
      .replace(new RegExp(`\\(${caseId}:\\d+\\)`, "g"), "")
      .replaceAll(caseId, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  return next;
}

/**
 * Load-time filter: keep valid cases; log issues. Never throws in production paths.
 */
export function filterValidDemoCases(
  catalog: readonly OfficiatingCase[],
  options: { log?: (message: string) => void; strict?: boolean } = {},
): OfficiatingCase[] {
  const log = options.log ?? ((message: string) => {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[clearcall-cases] ${message}`);
    }
  });

  const issues = validateCases(catalog);
  if (issues.length === 0) return [...catalog];

  const byCase = new Map<string, CaseValidationIssue[]>();
  for (const issue of issues) {
    const list = byCase.get(issue.caseId) ?? [];
    list.push(issue);
    byCase.set(issue.caseId, list);
  }

  for (const [caseId, caseIssues] of byCase) {
    log(
      `case "${caseId}": ${caseIssues.map((item) => `${item.field}: ${item.message}`).join("; ")}`,
    );
  }

  if (options.strict) {
    throw new Error(`Demo case validation failed with ${issues.length} issue(s).`);
  }

  // Soft failures: omit only cases with hard blockers (duplicate id handled upstream,
  // missing required fields, or broken phrase / internal ID in public text).
  const hard = new Set(
    issues
      .filter(
        (issue) =>
          issue.message.startsWith("missing") ||
          issue.message.includes("broken generated") ||
          issue.message.includes("internal ID") ||
          issue.message.includes("raw case ID") ||
          issue.message === "duplicate case ID",
      )
      .map((issue) => issue.caseId),
  );

  return catalog.filter((scenario) => !hard.has(scenario.id));
}
