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
    avatarIndex: 50,
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
  "2m ago",
  "8m ago",
  "21m ago",
  "1h ago",
  "3h ago",
  "Yesterday",
  "2d ago",
  "Seeded demo response",
] as const;

const AGREE_BODIES = [
  "Working the factors in order keeps me from jumping to the card color first.",
  "The critical factor is doing the heavy lifting here — once that is settled, the restart becomes clearer.",
  "I landed on the same call after replaying the sequence twice.",
  "Agree with the pinned read. The geometry of the play matters more than the appeal.",
  "This is a good teaching example of separating what you saw from what you assumed.",
];

const DISSENT_BODIES = [
  "I am still not sold — the contact looks marginal enough that I would want a second angle before committing.",
  "Respectfully disagree on the disciplinary step. The foul is there; the card threshold feels soft.",
  "I keep coming back to covering defenders / reaction time. That alone pulls me toward a different option.",
  "If this is the only view, I would park it on insufficient evidence rather than force a label.",
  "Close either way. My match-day bias would be to sell the softer restart and write a detailed report.",
];

const LEARNER_BODIES = [
  "I initially focused on the outcome of the play. Comparing the structured factors makes the decision process easier to explain.",
  "New to this foul type — the factor checklist is what stopped me from guessing based on the crowd reaction.",
  "Noted for my next assessment: identify the critical factor before naming the sanction.",
  "Helpful thread. I changed my mind after reading the second response.",
  "Saving this one. The paired contrast with the sibling case is what finally clicked.",
];

function pickBody(pool: readonly string[], random: () => number): string {
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))]!;
}

function publisherFromPerson(person: FeedPersonSeed, caseId: string, slot: number): Publisher {
  return personToPublisher(person, `${caseId}-slot-${slot}`);
}

/**
 * Build a fuller social-style discussion with seeded-but-varied names and avatars.
 * Always pins an educator lead, then mixes referees/learners with agree + dissent takes.
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
): readonly DiscussionResponse[] {
  const random = seededRandom(`discussion:${caseId}`);
  const people = pickPeople(`people:${caseId}`, 7, []);
  const educator = people[0] ?? {
    displayName: "ClearCall demo desk",
    role: "educator" as const,
    organization: "Authored product prototype",
    avatarIndex: 50,
  };
  const referee = people[1] ?? {
    displayName: "Sam Rivera",
    role: "referee" as const,
    avatarIndex: 51,
  };
  const rest = people.slice(2);

  const fallbackDissent =
    answerOptionIds.find((id) => id !== recommendedDecision) ?? recommendedDecision;
  const dissentOption = alternateOptionId && (answerOptionIds.length === 0 || answerOptionIds.includes(alternateOptionId))
    ? alternateOptionId
    : fallbackDissent;

  const responses: DiscussionResponse[] = [
    {
      id: `${caseId}-response-pinned`,
      caseId,
      author: publisherFromPerson(educator, caseId, 0),
      body: educatorBody,
      selectedOptionId: recommendedDecision,
      confidence: 78 + Math.floor(random() * 12),
      selectedFactorKeys: factorKeys,
      ruleCitation,
      helpfulCount: 18 + Math.floor(random() * 20),
      factorReactions: makeFactorReactions(factorKeys, 10 + Math.floor(random() * 8)),
      postedAtLabel: TIME_LABELS[TIME_LABELS.length - 1]!,
      isPinned: true,
      isVerifiedExplanation: false,
      isSynthetic: true,
      disclosure: "Pinned authored demo rationale; it has not been independently verified.",
    },
    {
      id: `${caseId}-response-referee`,
      caseId,
      author: publisherFromPerson(referee, caseId, 1),
      body: refereeBody,
      selectedOptionId: recommendedDecision,
      confidence: 70 + Math.floor(random() * 14),
      selectedFactorKeys: factorKeys.slice(0, Math.max(1, factorKeys.length - 1)),
      ruleCitation,
      helpfulCount: 8 + Math.floor(random() * 12),
      factorReactions: makeFactorReactions(factorKeys, 6 + Math.floor(random() * 5)),
      postedAtLabel: TIME_LABELS[Math.floor(random() * 4)]!,
      isPinned: false,
      isVerifiedExplanation: false,
      isSynthetic: true,
      disclosure: "Authored fictional discussion response.",
    },
  ];

  rest.forEach((person, index) => {
    const agrees = random() > 0.38;
    const isLearner = person.role === "learner" || random() > 0.55;
    const body = agrees
      ? isLearner
        ? pickBody(LEARNER_BODIES, random)
        : pickBody(AGREE_BODIES, random)
      : pickBody(DISSENT_BODIES, random);
    const optionId = agrees ? recommendedDecision : dissentOption;
    const keys = agrees
      ? factorKeys.slice(0, Math.max(1, factorKeys.length - (index % 2)))
      : factorKeys.slice(0, 1);

    responses.push({
      id: `${caseId}-response-${index + 2}`,
      caseId,
      author: publisherFromPerson(person, caseId, index + 2),
      body,
      selectedOptionId: optionId,
      confidence: 58 + Math.floor(random() * 28),
      selectedFactorKeys: keys,
      ruleCitation: agrees && random() > 0.6 ? ruleCitation : undefined,
      helpfulCount: 2 + Math.floor(random() * 16),
      factorReactions: makeFactorReactions(keys, 3 + index),
      postedAtLabel: TIME_LABELS[Math.min(TIME_LABELS.length - 2, Math.floor(random() * (TIME_LABELS.length - 1)))]!,
      isPinned: false,
      isVerifiedExplanation: false,
      isSynthetic: true,
      disclosure: "Authored fictional discussion response.",
    });
  });

  return responses;
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
    ),
  };
}

export { avatarSrcForIndex, initialsForName };
