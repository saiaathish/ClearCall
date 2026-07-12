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

/**
 * Short-form discussion bodies (authentic-human protocol, Reddit/Discord mode).
 * Mind-in-motion: fragments, contractions, mid-thought flips. No em-dashes.
 * Don't quote case ids. Don't reuse opener+middle+closer every time.
 * Light emoji — about half the thread replies, never stacks, never on pinned educators.
 */
function pick<T>(list: readonly T[], random: () => number): T {
  return list[Math.floor(random() * list.length)]!;
}

function maybeSpiceBody(body: string, agrees: boolean, random: () => number): string {
  // Skip if it already has a react (some templates bake one in).
  if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(body)) return body;
  // ~half get one small react (user asked for a bit of life).
  if (random() > 0.52) return body;
  const spice = agrees
    ? pick(["👍", "👀", "✅", "🟨", "⚽", "🔥"], random)
    : pick(["🤔", "👀", "😅", "🟥", "😬", "🤷"], random);
  if (body.length < 64 && random() > 0.5) {
    return `${spice} ${body}`;
  }
  return `${body} ${spice}`;
}

function humanTitle(title: string, caseId: string): string {
  // Prefer the real title; never fall back to a slugy case id in quotes.
  if (!title || title === caseId || /^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(title)) {
    return "";
  }
  if (title.length <= 40) return title;
  const cut = title.slice(0, 38);
  const at = cut.lastIndexOf(" ");
  return `${(at > 20 ? cut.slice(0, at) : cut).trim()}…`;
}

/** Short spoken cue for comments: first clause, lowercased. */
function shortCue(title: string, caseId: string): string {
  const named = humanTitle(title, caseId) || title || caseId;
  const first = named.split(",")[0]!.trim();
  const cue = first.length >= 8 ? first : named;
  return cue.toLowerCase();
}

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
  const { caseId, title, category, criticalFactor, slot, agrees, role, random, usedBodies } = input;
  const factor = criticalFactor.replaceAll("-", " ");
  const cat = category.toLowerCase();
  // Short spoken cue is the uniqueness anchor. Never quote a slug.
  const cue = shortCue(title, caseId);

  const builds: Array<() => string> = [
    () =>
      agrees
        ? `yeah i'm with the pin on ${cue}. ${factor} is doing the work.`
        : `nah not buying the pin on ${cue}. ${factor} just isn't enough.`,
    () =>
      agrees
        ? `watched ${cue} twice. still with them. crowd noise isn't evidence lol`
        : `watched ${cue} twice and still flipping it. ${factor} feels thin.`,
    () =>
      `ok so ${cue}. ${agrees ? "i'd sell what they pinned." : "i'd go the other way."} ${
        role === "learner"
          ? "still trying to say the factor out loud before the card tbh"
          : "if i can't sell it live i'm not inventing it here"
      }`,
    () =>
      agrees
        ? `hmm pin feels right on ${cue}. ${factor} first. everything else is noise.`
        : `hmm pin feels off on ${cue}. people are reacting to the fall more than ${factor}.`,
    () =>
      `${agrees ? "locking it." : "pushing back."} stuck on ${factor} for ${cue}. ${
        role === "educator" ? "newer refs: name that before you colour the card." : "write it short and move."
      }`,
    () =>
      `live i went ${agrees ? "with" : "against"} the pin on ${cue}. replay didn't change much. ${factor} did.`,
    () =>
      agrees
        ? `${cue}. ${factor} is clean enough. same call.`
        : `${cue}. wait. ${factor} isn't enough for me. different call.`,
    () =>
      `${agrees ? "yeah that tracks." : "nah."} ${cat} threads always get loud. for ${cue} i'm still on ${factor}.`,
    () =>
      role === "learner"
        ? `gonna sit with ${cue} before next weekend. tentatively ${agrees ? "with the pin" : "against it"}. ${factor} is the bit i keep replaying.`
        : `match day i'd ${agrees ? "sell the pin" : "go the other way"} on ${cue}. ${factor}. that's it.`,
    () =>
      `anyone else flip once on ${cue}? i did. landed ${agrees ? "back with the pin" : "against it"} after staring at ${factor}.`,
    () =>
      agrees
        ? `blunt take on ${cue}: pin is fine. ignore the theatre, watch ${factor}.`
        : `blunt take on ${cue}: pin is wrong. it's all theatre if you skip ${factor}.`,
    () =>
      `from the ar angle on ${cue}… ${agrees ? "same place as pin." : "i'm out."} ${factor} or nothing.`,
    () =>
      agrees
        ? `idk why ${cue} is even a fight. ${factor} sells it.`
        : `idk man ${factor} isn't getting me to the pin on ${cue}.`,
    () =>
      agrees
        ? `same on ${cue}. ${factor}. moved on.`
        : `different read on ${cue}. ${factor} is the whole disagreement for me.`,
    () =>
      role === "learner"
        ? `ngl still learning these. leaning ${agrees ? "pin" : "other way"} on ${cue} cos of ${factor}.`
        : `honestly on ${cue}? ${agrees ? "sell it." : "don't sell it."} ${factor} is what i'd write in the report.`,
    () =>
      agrees
        ? `yep. ${cue}, ${factor} clears it for me.`
        : `nope. ${cue}, ${factor} doesn't clear it.`,
    () => `so ${factor} on ${cue}. ${agrees ? "with the pin." : "against the pin."}`,
    () =>
      agrees
        ? `came in skeptical on ${cue}, left agreeing. ${factor} flipped me.`
        : `came in agreeing on ${cue}, left skeptical. ${factor} flipped me the other way.`,
    () =>
      agrees
        ? `tbh ${cue} isn't close. ${factor} 👍`
        : `tbh ${cue} is messy. ${factor} has me elsewhere.`,
    () =>
      `${agrees ? "✅" : "🤔"} ${cue}. ${factor}. ${agrees ? "that's the call." : "not sold."}`,
  ];

  for (let attempt = 0; attempt < 40; attempt += 1) {
    let plain = pick(builds, random)()
      .replaceAll("—", ",")
      .replaceAll(/\s+/g, " ")
      .replaceAll(/\s+([,.!?])/g, "$1")
      .trim();
    // If a template somehow collides, add a soft slot crumb.
    if (usedBodies.has(plain)) {
      plain = `${plain} (${slot})`;
    }
    if (usedBodies.has(plain)) continue;
    usedBodies.add(plain);
    const body = maybeSpiceBody(plain, agrees, random);
    usedBodies.add(body);
    return body;
  }

  const fallback = `${agrees ? "same call" : "different call"} on ${cue}. ${factor}. #${slot}`;
  usedBodies.add(fallback);
  return fallback;
}

function publisherFromPerson(person: FeedPersonSeed): Publisher {
  return personToPublisher(person);
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

  // Pinned educator stays authored; weave a short case cue so catalog bodies stay unique
  // without the old "Looking at…" template. Lead ref gets a light react sometimes.
  const cue = shortCue(context.title ?? "", caseId);
  const eduCrumb = cue
    ? pick(
        [
          ` On the ${cue}.`,
          ` For the ${cue}.`,
          ` re: ${cue}`,
          ` (${cue})`,
        ],
        random,
      )
    : "";
  const refCrumb = cue
    ? pick(
        [
          ` Same on the ${cue}.`,
          ` Match day: ${cue}.`,
          ` Thinking the ${cue}.`,
          "",
        ],
        random,
      )
    : "";
  const pinnedEducator = `${educatorBody.trim()}${eduCrumb}`.replaceAll("—", ",");
  const refereePlain = `${refereeBody.trim()}${refCrumb}`.replaceAll("—", ",");
  const pinnedReferee = maybeSpiceBody(refereePlain, true, random);
  usedBodies.add(pinnedEducator);
  usedBodies.add(refereePlain);
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
      author: publisherFromPerson(person),
      body,
      selectedOptionId: agrees ? recommendedDecision : dissentOption,
      confidence: isPinned ? 78 + Math.floor(random() * 12) : 55 + Math.floor(random() * 35),
      selectedFactorKeys: selectedKeys,
      ruleCitation: isPinned || (agrees && random() > 0.55) ? ruleCitation : undefined,
      helpfulCount: isPinned ? 12 + Math.floor(random() * 24) : 1 + Math.floor(random() * 18),
      factorReactions: makeFactorReactions(selectedKeys, 3 + slot + Math.floor(random() * 6)),
      postedAtLabel: isPinned
        ? "Pinned"
        : TIME_LABELS[Math.min(TIME_LABELS.length - 1, Math.floor(random() * TIME_LABELS.length))]!,
      isPinned,
      isVerifiedExplanation: false,
      isSynthetic: true,
      disclosure: isPinned
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
