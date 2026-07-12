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

export const demoDesk: Publisher = personToPublisher(
  {
    displayName: "ClearCall demo desk",
    role: "educator",
    organization: "Authored product prototype",
    gender: "men",
    nationality: "us",
    portraitIndex: 0,
  },
  "clearcall-demo-desk",
);

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

const OPENERS = [
  "Live, I sold",
  "On replay I keep landing on",
  "Match-day read:",
  "Clinic note:",
  "Honest take —",
  "From the AR angle,",
  "If I am writing the report,",
  "Gut first, then factors:",
  "This one is fiddly because",
  "After the second look,",
] as const;

const MIDDLES = [
  "the critical factor is doing more work than the appeal",
  "geometry beats volume every time",
  "I refuse to name a card before the restart logic is clean",
  "one missing angle still leaves doubt",
  "the paired teaching contrast is what decides it for me",
  "crowd noise is not evidence",
  "the body language after contact is a trap",
  "reaction time collapses half the handball debates",
  "covering defenders change the whole disciplinary picture",
  "advantage windows are shorter than people argue online",
] as const;

const CLOSERS = [
  "I am locking that in.",
  "Still open to a second angle.",
  "Would love an assessor note on this.",
  "Saving it for my next mentorship session.",
  "That is the call I would sell.",
  "Not my favourite, but it is coherent.",
  "Changed my mind once, then came back.",
  "Write it up carefully.",
] as const;

function composeThreadBody(input: {
  caseId: string;
  title: string;
  category: string;
  criticalFactor: string;
  ruleCitation: string;
  slot: number;
  agrees: boolean;
  role: string;
  random: () => number;
  usedBodies: Set<string>;
}): string {
  const { caseId, title, category, criticalFactor, ruleCitation, slot, agrees, role, random, usedBodies } = input;
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const opener = OPENERS[Math.floor(random() * OPENERS.length)]!;
    const middle = MIDDLES[Math.floor(random() * MIDDLES.length)]!;
    const closer = CLOSERS[Math.floor(random() * CLOSERS.length)]!;
    const stance = agrees
      ? `I am with the pinned ${category.toLowerCase()} read`
      : `I am pushing back on the pinned ${category.toLowerCase()} read`;
    const factorBit = `Focus on ${criticalFactor.replaceAll("-", " ")}`;
    const roleBit =
      role === "learner"
        ? "I am still building the checklist habit"
        : role === "educator"
          ? "Teaching point first"
          : "On the pitch I need a sellable signal";
    const angle = [
      `watching “${title}”`,
      `on the “${title}” clip`,
      `for “${title}”`,
      `after scrolling “${title}”`,
    ][attempt % 4]!;
    const body = [
      `${opener} ${stance} ${angle}.`,
      `${factorBit} — ${middle}.`,
      `${roleBit}. ${ruleCitation.split("—")[0]?.trim() ?? ruleCitation}.`,
      closer,
    ].join(" ");
    if (!usedBodies.has(body)) {
      usedBodies.add(body);
      return body;
    }
  }
  const fallback = `On “${title}” (${caseId} / slot ${slot}): ${agrees ? "agree" : "dissent"} around ${criticalFactor} for ${category}.`;
  usedBodies.add(fallback);
  return fallback;
}

function publisherFromPerson(person: FeedPersonSeed, caseId: string, slot: number): Publisher {
  return personToPublisher(person, `${caseId}-slot-${slot}`);
}

export interface DiscussionContext {
  category: string;
  criticalFactor: string;
  title?: string;
}

/**
 * Build a social-style discussion with variable length, unique commentators,
 * and case-specific bodies (no copy-paste comment spam).
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
  const replyCount = 2 + Math.floor(random() * 10); // 2–11 total replies
  const usedBodies = new Set<string>();

  const fallbackDissent =
    answerOptionIds.find((id) => id !== recommendedDecision) ?? recommendedDecision;
  const dissentOption = alternateOptionId && (answerOptionIds.length === 0 || answerOptionIds.includes(alternateOptionId))
    ? alternateOptionId
    : fallbackDissent;

  const assignedPeople: FeedPersonSeed[] = [];
  const drawPool = pickPeople(`people:${caseId}`, Math.max(replyCount + 4, 12), []);
  while (assignedPeople.length < replyCount && drawPool.length > 0) {
    const index = Math.min(drawPool.length - 1, Math.floor(random() * drawPool.length));
    const [nextPerson] = drawPool.splice(index, 1);
    if (!nextPerson) break;
    if (assignedPeople.some((item) => item.displayName === nextPerson.displayName)) continue;
    assignedPeople.push(nextPerson);
  }
  while (assignedPeople.length < replyCount) {
    const more = pickPeople(
      `people:${caseId}:pad:${assignedPeople.length}`,
      1,
      assignedPeople.map((person) => person.displayName),
    );
    if (!more[0]) break;
    assignedPeople.push(more[0]);
  }

  const pinnedEducator = context.title
    ? `${educatorBody.trim()} That is the read I would pin on “${context.title}”.`
    : educatorBody.trim();
  const pinnedReferee = context.title
    ? `${refereeBody.trim()} Match-day sell on “${context.title}”.`
    : refereeBody.trim();
  usedBodies.add(pinnedEducator);
  usedBodies.add(pinnedReferee);

  return assignedPeople.map((person, slot) => {
    const isPinned = slot === 0;
    const isLeadReferee = slot === 1 && replyCount > 1;
    const agrees = isPinned || isLeadReferee ? true : random() > 0.42;
    const selectedKeys = agrees
      ? factorKeys.slice(0, Math.max(1, factorKeys.length - (slot % 2)))
      : factorKeys.slice(0, 1);

    const body = isPinned
      ? pinnedEducator
      : isLeadReferee
        ? pinnedReferee
        : composeThreadBody({
            caseId,
            title: context.title ?? caseId,
            category: context.category,
            criticalFactor: context.criticalFactor,
            ruleCitation,
            slot,
            agrees,
            role: person.role,
            random,
            usedBodies,
          });

    return {
      id: `${caseId}-response-${slot}`,
      caseId,
      author: publisherFromPerson(person, caseId, slot),
      body,
      selectedOptionId: agrees ? recommendedDecision : dissentOption,
      confidence: isPinned ? 78 + Math.floor(random() * 12) : 55 + Math.floor(random() * 35),
      selectedFactorKeys: selectedKeys,
      ruleCitation: isPinned || (agrees && random() > 0.55) ? ruleCitation : undefined,
      helpfulCount: isPinned ? 12 + Math.floor(random() * 24) : 1 + Math.floor(random() * 18),
      factorReactions: makeFactorReactions(selectedKeys, 3 + slot + Math.floor(random() * 6)),
      postedAtLabel: isPinned
        ? "Pinned demo response"
        : TIME_LABELS[Math.min(TIME_LABELS.length - 1, Math.floor(random() * TIME_LABELS.length))]!,
      isPinned,
      isVerifiedExplanation: false,
      isSynthetic: true,
      disclosure: isPinned
        ? "Pinned authored demo rationale; it has not been independently verified."
        : "Authored fictional discussion response.",
    } satisfies DiscussionResponse;
  });
}

export function pickPublisher(seed: string): Publisher {
  const [person] = pickPeople(`publisher:${seed}`, 1);
  if (!person) return demoDesk;
  return personToPublisher(person, `case-${seed}`);
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
      },
    ),
  };
}

export { avatarSrcForIndex, initialsForName };
