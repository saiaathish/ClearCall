import type {
  AnswerOption,
  DiscussionResponse,
  Distribution,
  FactorReactionCounts,
  MediaKind,
  OfficiatingCase,
  Publisher,
  RuleFactor,
  CaseCategory,
  Difficulty,
  ScenarioStatus,
} from "@/lib/types";
import {
  avatarSrcForIndex,
  initialsForName,
  personToPublisher,
  pickPeople,
  seededRandom,
  type FeedPersonSeed,
} from "@/data/feed-people";

export const DEMO_REVIEW_DISCLAIMER =
  "Authored demonstration material only. The scenario, percentages, comments, and recommended decision require review by a qualified soccer officiating expert before production use; they are not official governing-body guidance.";

export const demoDesk: Publisher = personToPublisher({
  displayName: "ClearCall demo desk",
  role: "educator",
  organization: "Authored product prototype",
  gender: "men",
  nationality: "us",
  portraitIndex: 0,
});

export const makeDistribution = (
  label: string,
  percentages: Readonly<Record<string, number>>,
): Distribution => ({
  label,
  percentages,
  basis: "authored_demo",
  isSynthetic: true,
  disclaimer:
    "Illustrative authored percentages, not responses collected from real users or verified officials.",
});

export const makeFactorReactions = (
  factorKeys: readonly string[],
  seed: number,
): Readonly<Record<string, FactorReactionCounts>> => {
  const reactions: Record<string, FactorReactionCounts> = {};
  factorKeys.forEach((key, index) => {
    reactions[key] = {
      agree: seed + index * 2,
      disagree: Math.max(1, Math.floor(seed / 4) - index),
    };
  });
  return reactions;
};

export const factor = (
  key: string,
  label: string,
  value: string,
  supportsRecommendation: boolean,
  explanation: string,
): RuleFactor => ({
  key,
  label,
  value,
  supportsRecommendation,
  explanation,
});

export const option = (
  id: string,
  label: string,
  shortLabel: string,
  description: string,
): AnswerOption => ({ id, label, shortLabel, description });

export const foulOptions: readonly AnswerOption[] = [
  option("play-on", "Play on", "Play on", "No punishable foul is identified."),
  option(
    "direct-free-kick-no-card",
    "Direct free kick, no card",
    "Foul only",
    "Penalize the challenge without a disciplinary sanction.",
  ),
  option(
    "direct-free-kick-yellow",
    "Direct free kick and yellow card",
    "Yellow card",
    "Treat the challenge as reckless in this demo review.",
  ),
  option(
    "direct-free-kick-red",
    "Direct free kick and red card",
    "Red card",
    "Treat the challenge as serious foul play in this demo review.",
  ),
  option(
    "insufficient-evidence",
    "Not enough information",
    "Need more angles",
    "The supplied description is not enough to decide confidently.",
  ),
];

export const handballOptions: readonly AnswerOption[] = [
  option("no-handball", "No handball offence", "Play on", "Allow play to continue."),
  option(
    "direct-free-kick-handball",
    "Direct free kick for handball",
    "Direct free kick",
    "Penalize an offence outside the defender's penalty area.",
  ),
  option(
    "penalty-kick-handball",
    "Penalty kick for handball",
    "Penalty kick",
    "Penalize an offence by a defender inside their penalty area.",
  ),
  option(
    "penalty-kick-yellow",
    "Penalty kick and yellow card",
    "Penalty + yellow",
    "Award the penalty and add a caution in this demo review.",
  ),
  option(
    "insufficient-evidence",
    "Not enough information",
    "Need more angles",
    "Request a clearer view of arm position and ball movement.",
  ),
];

export const offsideOptions: readonly AnswerOption[] = [
  option("goal-awarded", "Award the goal", "Goal", "No offside offence is identified."),
  option(
    "offside-indirect-free-kick",
    "Offside offence — indirect free kick",
    "Offside",
    "Penalize active involvement by the attacker.",
  ),
  option(
    "attacking-foul-direct-free-kick",
    "Attacking foul — direct free kick",
    "Attacking foul",
    "Penalize a separate physical offence by the attacker.",
  ),
  option(
    "insufficient-evidence",
    "Not enough information",
    "Need more angles",
    "The available view does not establish position or involvement.",
  ),
];

export const dogsoOptions: readonly AnswerOption[] = [
  option("play-on", "Play on", "Play on", "No offence is identified."),
  option("direct-free-kick-no-card", "Direct free kick, no card", "Foul only", "Penalize without a card."),
  option("direct-free-kick-yellow", "Direct free kick and yellow card", "Yellow card", "Treat the foul as stopping a promising attack."),
  option("direct-free-kick-red", "Direct free kick and red card", "Red card", "Treat the foul as denying an obvious goal-scoring opportunity."),
];

export const advantageOptions: readonly AnswerOption[] = [
  option("continue-play", "Continue play", "Continue", "Treat the advantage as fully realized."),
  option("return-original-foul", "Return to the original foul", "Bring it back", "Award the original restart after the immediate advantage fails."),
  option("drop-ball", "Stop and restart with a dropped ball", "Dropped ball", "Use a dropped-ball restart."),
  option("insufficient-evidence", "Not enough information", "Need context", "The timing and pressure are not clear enough."),
];

export const simulationOptions: readonly AnswerOption[] = [
  option("penalty-kick", "Penalty kick", "Penalty", "Treat the defender's action as a foul."),
  option("play-on", "Play on", "Play on", "Find neither a defensive foul nor clear simulation."),
  option("indirect-free-kick-yellow-simulation", "Indirect free kick and yellow card for simulation", "Simulation", "Treat the attacker's action as an attempt to deceive."),
  option("insufficient-evidence", "Not enough information", "Need more angles", "The contact sequence cannot be established reliably."),
];

export const goalkeeperOptions: readonly AnswerOption[] = [
  option("play-on", "Play on", "Play on", "Find no handling restriction."),
  option("indirect-free-kick", "Indirect free kick", "Indirect free kick", "Penalize the goalkeeper handling restriction."),
  option("direct-free-kick", "Direct free kick", "Direct free kick", "Use a direct-free-kick restart."),
  option("penalty-kick", "Penalty kick", "Penalty kick", "Award a penalty against the goalkeeper's team."),
];

const TIME_LABELS = [
  "just now",
  "2m ago",
  "8m ago",
  "21m ago",
  "47m ago",
  "1h ago",
  "3h ago",
  "6h ago",
  "Yesterday",
  "2d ago",
  "4d ago",
] as const;

function publisherFromPerson(person: FeedPersonSeed): Publisher {
  return personToPublisher(person);
}

function cleanBody(text: string): string {
  return text
    .replaceAll("—", ",")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .trim();
}

function defaultAlternativeBody(context: DiscussionContext): string {
  const factor = context.criticalFactor.replaceAll("-", " ");
  const variants = [
    `I would want another angle before locking this in. If ${factor} reads differently from the reverse view, the sanction changes.`,
    `This angle leaves room for doubt. Confirm ${factor} clearly before ruling out the other option.`,
    `I am not fully sold yet. A closer look at ${factor} could move me off the pinned call.`,
    `Hold the recommendation lightly until ${factor} is confirmed. One limited view is not enough for certainty.`,
  ];
  // Deterministic pick from title so each case stays distinct without random spam.
  const seed = (context.title ?? context.criticalFactor)
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return variants[seed % variants.length]!;
}

export interface DiscussionContext {
  category: string;
  criticalFactor: string;
  title?: string;
  /** Skeptical / alternative viewpoint. Generated when omitted. */
  alternativeBody?: string;
}

/**
 * Build three concise discussion comments with distinct viewpoints:
 * 1) technical referee/assessor, 2) practical match referee, 3) skeptical alternative.
 */
export function makeDiscussion(
  caseId: string,
  recommendedDecision: string,
  factorKeys: readonly string[],
  educatorBody: string,
  refereeBody: string,
  ruleCitation: string,
  alternateOptionId?: string,
  answerOptionIds: readonly string[] = [],
  context: DiscussionContext = { category: "Incident", criticalFactor: factorKeys[0] ?? "factor" },
): readonly DiscussionResponse[] {
  const random = seededRandom(`discussion:${caseId}`);

  const fallbackDissent =
    answerOptionIds.find((id) => id !== recommendedDecision) ?? recommendedDecision;
  const dissentOption =
    alternateOptionId && (answerOptionIds.length === 0 || answerOptionIds.includes(alternateOptionId))
      ? alternateOptionId
      : fallbackDissent;

  const people = pickPeople(`people:${caseId}`, 6, []);
  const authors: FeedPersonSeed[] = [];
  for (const person of people) {
    if (authors.some((item) => item.displayName === person.displayName)) continue;
    authors.push(person);
    if (authors.length === 3) break;
  }
  while (authors.length < 3) {
    const more = pickPeople(
      `people:${caseId}:pad:${authors.length}`,
      1,
      authors.map((person) => person.displayName),
    );
    if (!more[0]) break;
    authors.push(more[0]);
  }

  const technical = cleanBody(educatorBody);
  const practical = cleanBody(refereeBody);
  const alternative = cleanBody(context.alternativeBody ?? defaultAlternativeBody(context));

  const bodies = [technical, practical, alternative];
  // Guarantee uniqueness within the thread without leaking case IDs.
  for (let index = 1; index < bodies.length; index += 1) {
    if (bodies.slice(0, index).includes(bodies[index]!)) {
      bodies[index] = `${bodies[index]} That changes my confidence in the call.`;
    }
  }

  const roles: Array<{
    body: string;
    agrees: boolean;
    isPinned: boolean;
    postedAtLabel: string;
  }> = [
    { body: bodies[0]!, agrees: true, isPinned: true, postedAtLabel: "Pinned" },
    { body: bodies[1]!, agrees: true, isPinned: false, postedAtLabel: TIME_LABELS[2]! },
    { body: bodies[2]!, agrees: false, isPinned: false, postedAtLabel: TIME_LABELS[4]! },
  ];

  return roles.map((role, slot) => {
    const person = authors[slot] ?? authors[0]!;
    const selectedKeys = role.agrees
      ? factorKeys.slice(0, Math.max(1, factorKeys.length - (slot % 2)))
      : factorKeys.slice(0, 1);

    return {
      id: `${caseId}-response-${slot}`,
      caseId,
      author: publisherFromPerson(person),
      body: role.body,
      selectedOptionId: role.agrees ? recommendedDecision : dissentOption,
      confidence: role.isPinned ? 82 : role.agrees ? 70 + Math.floor(random() * 12) : 58 + Math.floor(random() * 14),
      selectedFactorKeys: selectedKeys,
      ruleCitation: role.isPinned || slot === 1 ? ruleCitation : undefined,
      helpfulCount: role.isPinned ? 18 + Math.floor(random() * 16) : 3 + Math.floor(random() * 12),
      factorReactions: makeFactorReactions(selectedKeys, 4 + slot + Math.floor(random() * 5)),
      postedAtLabel: role.postedAtLabel,
      isPinned: role.isPinned,
      isVerifiedExplanation: false,
      isSynthetic: true,
      disclosure: role.isPinned
        ? "Pinned demo take — not an official ruling."
        : "Fictional discussion reply for the demo.",
    } satisfies DiscussionResponse;
  });
}

export function pickPublisher(seed: string): Publisher {
  const [person] = pickPeople(`publisher:${seed}`, 1);
  if (!person) return demoDesk;
  return personToPublisher(person);
}

export const commonCaseFields = {
  sport: "soccer" as const,
  publisher: demoDesk,
  ruleset: "Soccer Laws of the Game — demo reference",
  rulesetVersion: "Prototype snapshot — version review pending",
  mediaKind: "video" as MediaKind,
  imageSrc: null as string | null,
  mediaWidth: 1600 as number | null,
  mediaHeight: 900 as number | null,
  videoSrc: null as string | null,
  posterSrc: null as string | null,
  sourceType: "authored-demo" as const,
  permissionStatus: "demo-only" as const,
  isDemo: true,
  reviewState: "DEMO_REVIEW_REQUIRED" as const,
  reviewDisclaimer: DEMO_REVIEW_DISCLAIMER,
};

export interface CaseDraft {
  id: string;
  slug: string;
  title: string;
  prompt: string;
  description: string;
  competitionLevel: string;
  difficulty: Difficulty;
  category: CaseCategory;
  scenarioStatus?: ScenarioStatus;
  originalDecision: string;
  answerOptions: readonly AnswerOption[];
  recommendedDecision: string;
  expertExplanation: string;
  ruleReference: string;
  rulePath: readonly string[];
  factors: readonly RuleFactor[];
  criticalFactor: string;
  communityDistribution: Distribution;
  verifiedDistribution: Distribution;
  learnerDistribution: Distribution;
  disagreementScore: number;
  freshnessScore: number;
  publishedAt: string;
  mediaKind: MediaKind;
  imageSrc?: string | null;
  mediaWidth?: number | null;
  mediaHeight?: number | null;
  videoSrc?: string | null;
  posterSrc?: string | null;
  mediaAlt: string;
  similarCaseIds?: readonly string[];
  educatorBody: string;
  refereeBody: string;
  alternativeBody?: string;
  ruleCitation: string;
  alternateOptionId?: string;
  publisherSeed?: string;
}

export function buildCase(draft: CaseDraft): OfficiatingCase {
  const publisher = draft.publisherSeed ? pickPublisher(draft.publisherSeed) : demoDesk;
  return {
    ...commonCaseFields,
    id: draft.id,
    slug: draft.slug,
    title: draft.title,
    prompt: draft.prompt,
    description: draft.description,
    competitionLevel: draft.competitionLevel,
    difficulty: draft.difficulty,
    category: draft.category,
    scenarioStatus: draft.scenarioStatus ?? "OPEN_DISCUSSION",
    originalDecision: draft.originalDecision,
    answerOptions: draft.answerOptions,
    recommendedDecision: draft.recommendedDecision,
    expertExplanation: draft.expertExplanation,
    ruleReference: draft.ruleReference,
    rulePath: draft.rulePath,
    factors: draft.factors,
    criticalFactor: draft.criticalFactor,
    publisher,
    communityDistribution: draft.communityDistribution,
    verifiedDistribution: draft.verifiedDistribution,
    learnerDistribution: draft.learnerDistribution,
    disagreementScore: draft.disagreementScore,
    freshnessScore: draft.freshnessScore,
    publishedAt: draft.publishedAt,
    mediaKind: draft.mediaKind,
    imageSrc: draft.imageSrc ?? null,
    mediaWidth: draft.mediaWidth ?? (draft.mediaKind === "text" ? null : 1600),
    mediaHeight: draft.mediaHeight ?? (draft.mediaKind === "text" ? null : 900),
    videoSrc: draft.videoSrc ?? null,
    posterSrc: draft.posterSrc ?? null,
    mediaAlt: draft.mediaAlt,
    similarCaseIds: draft.similarCaseIds ?? [],
    seededDiscussion: makeDiscussion(
      draft.id,
      draft.recommendedDecision,
      draft.factors.filter((item) => item.supportsRecommendation).map((item) => item.key).slice(0, 4),
      draft.educatorBody,
      draft.refereeBody,
      draft.ruleCitation,
      draft.alternateOptionId,
      draft.answerOptions.map((item) => item.id),
      {
        category: draft.category,
        criticalFactor: draft.criticalFactor,
        title: draft.title,
        alternativeBody: draft.alternativeBody,
      },
    ),
  };
}

export { avatarSrcForIndex, initialsForName };
