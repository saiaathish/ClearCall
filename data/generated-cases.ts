import type { CaseCategory, Difficulty, MediaKind, OfficiatingCase } from "@/lib/types";
import {
  advantageOptions,
  buildCase,
  dogsoOptions,
  factor,
  foulOptions,
  goalkeeperOptions,
  handballOptions,
  makeDistribution,
  offsideOptions,
  simulationOptions,
} from "@/data/case-builders";
import { seededRandom } from "@/data/feed-people";

const IMAGE_POOL = [
  { src: "/media/cases/lunge-wide.png", width: 1600, height: 900 },
  { src: "/media/cases/handball-portrait.png", width: 900, height: 1125 },
  { src: "/media/cases/handball-raised-arm.png", width: 710, height: 530 },
  { src: "/media/cases/offside-square.png", width: 1000, height: 1000 },
  { src: "/media/cases/offside-no-impact.png", width: 1024, height: 576 },
  { src: "/media/cases/dogso-landscape.png", width: 1200, height: 800 },
  { src: "/media/cases/goalkeeper-tall.png", width: 720, height: 1280 },
  { src: "/media/cases/lunge-wide.svg", width: 1600, height: 900 },
  { src: "/media/library/field-lanes.svg", width: 1600, height: 900 },
  { src: "/media/library/box-angle.svg", width: 1400, height: 1050 },
  { src: "/media/library/midfield-press.svg", width: 1200, height: 1200 },
] as const;

const LEVELS = [
  "Youth U13 recreational",
  "Youth U15 academy",
  "Youth U17 regional",
  "Youth U19 elite",
  "College club",
  "Adult recreational",
  "Open-age amateur",
  "Semi-professional development",
] as const;

const DIFFICULTIES: readonly Difficulty[] = ["beginner", "intermediate", "advanced"];
const MEDIA_KINDS: readonly MediaKind[] = ["text", "image", "video", "image", "text", "video", "image"];

type Template = {
  category: CaseCategory;
  options: typeof foulOptions;
  recommended: string;
  alternate: string;
  ruleReference: string;
  rulePath: readonly string[];
  factors: ReturnType<typeof factor>[];
  criticalFactor: string;
  prompt: (n: number) => string;
  title: (n: number) => string;
  description: (n: number, level: string) => string;
  originalDecision: string;
  educator: (n: number) => string;
  referee: (n: number) => string;
};

const templates: readonly Template[] = [
  {
    category: "Serious foul play",
    options: foulOptions,
    recommended: "direct-free-kick-yellow",
    alternate: "direct-free-kick-red",
    ruleReference: "Law 12 concept — reckless challenges",
    rulePath: ["Law 12", "Fouls and misconduct", "Serious foul play"],
    factors: [
      factor("speed", "Speed", "Medium-high", true, "Approach speed elevates risk."),
      factor("contact-height", "Point of contact", "Lower leg", true, "Contact height frames the card."),
      factor("studs", "Studs exposure", "Partial", true, "Stud angle matters."),
      factor("control", "Control", "Borderline", true, "Withdrawal opportunity is unclear."),
      factor("force", "Force", "Elevated", true, "Force separates yellow from red."),
    ],
    criticalFactor: "force",
    prompt: (n) => `Variant ${n}: does this late challenge stay yellow or tip into a red?`,
    title: (n) => `Late challenge threshold #${n}`,
    description: (n, level) =>
      `Clip bank case ${n} from a ${level} match. A defender arrives a beat late into a midfield duel; contact is low but the follow-through carries noticeable force. Teaching focus is whether control still exists at impact.`,
    originalDecision: "Yellow card",
    educator: (n) =>
      `Case ${n} is about thresholding force and control together — neither factor alone sells the card colour.`,
    referee: (n) =>
      `On case ${n} I would sell the yellow unless the follow-through clearly rides up after the ball is gone.`,
  },
  {
    category: "Handball",
    options: handballOptions,
    recommended: "no-handball",
    alternate: "penalty-kick-handball",
    ruleReference: "Law 12 concept — handling the ball",
    rulePath: ["Law 12", "Fouls and misconduct", "Handling the ball"],
    factors: [
      factor("arm-position", "Arm position", "Near torso", true, "Natural vs enlarged."),
      factor("arm-movement", "Movement toward ball", "Limited", true, "Deliberateness check."),
      factor("proximity", "Ball proximity", "Close", true, "Reaction time."),
      factor("silhouette", "Body silhouette", "Mostly natural", true, "Make-the-body-bigger test."),
      factor("deflection", "Prior deflection", "Possible", true, "Unexpected path."),
    ],
    criticalFactor: "arm-position",
    prompt: (n) => `Variant ${n}: is arm contact after a deflection still an offence?`,
    title: (n) => `Deflection handball debate #${n}`,
    description: (n, level) =>
      `Scenario ${n} in ${level}: a blocked ball changes direction quickly and strikes a nearby arm. The arm is close to the body. Decide whether reaction time and position clear the defender.`,
    originalDecision: "Play on",
    educator: (n) =>
      `For handball case ${n}, start with reaction time and silhouette before you invent intent.`,
    referee: (n) =>
      `Case ${n}: if the arm never leaves a natural path, I am selling play on immediately.`,
  },
  {
    category: "Offside interference",
    options: offsideOptions,
    recommended: "goal-awarded",
    alternate: "offside-indirect-free-kick",
    ruleReference: "Law 11 concept — offside position and offence",
    rulePath: ["Law 11", "Offside", "Interfering with an opponent"],
    factors: [
      factor("position", "Position", "Offside", true, "Position triggers the check."),
      factor("line-of-vision", "Line of vision", "Mostly clear", true, "Keeper sightline."),
      factor("challenge", "Challenge for ball", "None", true, "Physical involvement."),
      factor("opponent-impact", "Opponent impact", "Unclear", true, "Did position matter?"),
      factor("touch", "Ball touch", "No touch", true, "Interfering with play."),
    ],
    criticalFactor: "opponent-impact",
    prompt: (n) => `Variant ${n}: position is offside — but is there an actual offence?`,
    title: (n) => `Offside involvement check #${n}`,
    description: (n, level) =>
      `Teaching clip ${n} (${level}). An attacker starts offside when the pass is played. Before deciding, separate position from involvement: touch, challenge, sightline, or impact on an opponent.`,
    originalDecision: "Offside offence",
    educator: (n) =>
      `Offside case ${n}: position is the start of the question, not the answer.`,
    referee: (n) =>
      `On ${n} I need my AR to tell me whether anyone actually reacted to that attacker.`,
  },
  {
    category: "Denial of an obvious goal-scoring opportunity",
    options: dogsoOptions,
    recommended: "direct-free-kick-yellow",
    alternate: "direct-free-kick-red",
    ruleReference: "Law 12 concept — DOGSO and SPA",
    rulePath: ["Law 12", "Disciplinary action", "Denial of an obvious goal-scoring opportunity"],
    factors: [
      factor("distance-to-goal", "Distance to goal", "Outside the box", true, "Chance quality."),
      factor("direction", "Direction of play", "Toward goal / channel", true, "Central vs wide."),
      factor("ball-control", "Likelihood of control", "Good", true, "Attacker had the ball."),
      factor("defenders", "Covering defenders", "Recovering", true, "Cover changes DOGSO."),
      factor("foul-type", "Foul type", "Hold / trip", true, "How the chance ended."),
    ],
    criticalFactor: "defenders",
    prompt: (n) => `Variant ${n}: tactical foul — SPA yellow or DOGSO red?`,
    title: (n) => `SPA vs DOGSO threshold #${n}`,
    description: (n, level) =>
      `Case ${n} from ${level}. An attacker is stopped by a tactical foul while progressing toward goal. Work all four DOGSO considerations before choosing the card.`,
    originalDecision: "Yellow card",
    educator: (n) =>
      `DOGSO case ${n} fails if you skip covering defenders or direction.`,
    referee: (n) =>
      `For ${n} I glance at cover first, then decide whether the chance was still obvious.`,
  },
  {
    category: "Advantage",
    options: advantageOptions,
    recommended: "return-original-foul",
    alternate: "continue-play",
    ruleReference: "Law 5 concept — advantage",
    rulePath: ["Law 5", "Powers and duties", "Advantage"],
    factors: [
      factor("time-elapsed", "Time elapsed", "Very short", true, "Advantage window."),
      factor("possession", "Possession", "Unstable", true, "Was there a benefit?"),
      factor("pressure", "Opponent pressure", "Immediate", true, "Pressure kills advantage."),
      factor("space", "Attacking space", "Limited", true, "Room to play."),
      factor("severity", "Original foul severity", "Careless", true, "Still available to punish."),
    ],
    criticalFactor: "time-elapsed",
    prompt: (n) => `Variant ${n}: advantage signalled — bring it back or live with it?`,
    title: (n) => `Advantage window #${n}`,
    description: (n, level) =>
      `Advantage puzzle ${n} in ${level}. The referee signals advantage after a foul, but the next action does not create a clear attacking benefit. Decide whether the window is still open.`,
    originalDecision: "Play continued",
    educator: (n) =>
      `Advantage case ${n}: the signal is not a life sentence — only the realized benefit is.`,
    referee: (n) =>
      `On ${n} I bring it back only if the failure is immediate and obvious.`,
  },
  {
    category: "Simulation",
    options: simulationOptions,
    recommended: "play-on",
    alternate: "indirect-free-kick-yellow-simulation",
    ruleReference: "Law 12 concept — simulation",
    rulePath: ["Law 12", "Disciplinary action", "Unsporting behaviour", "Simulation"],
    factors: [
      factor("initiator", "Contact initiator", "Contested", true, "Who created contact."),
      factor("defender-movement", "Defender movement", "Mostly legal", true, "Was there a foul?"),
      factor("fall-pattern", "Fall pattern", "Embellished", true, "Theatre vs contact."),
      factor("ball-path", "Ball path", "Still playable", true, "Did the attacker need to fall?"),
      factor("camera-certainty", "View certainty", "Single angle", true, "Evidence quality."),
    ],
    criticalFactor: "initiator",
    prompt: (n) => `Variant ${n}: contact or con — what do you sell?`,
    title: (n) => `Simulation judgement #${n}`,
    description: (n, level) =>
      `Deception case ${n} (${level}). There may be light contact in the area, but the fall looks exaggerated. Separate the foul question from the simulation question.`,
    originalDecision: "Penalty kick",
    educator: (n) =>
      `Simulation case ${n}: punish the foul you saw, or the deception you saw — not the crowd.`,
    referee: (n) =>
      `For ${n} I need a clear initiator. Without that I stay away from both extremes.`,
  },
  {
    category: "Goalkeeper handling",
    options: goalkeeperOptions,
    recommended: "indirect-free-kick",
    alternate: "play-on",
    ruleReference: "Law 12 concept — goalkeeper handling restrictions",
    rulePath: ["Law 12", "Indirect free kicks", "Goalkeeper handling restriction"],
    factors: [
      factor("teammate-action", "Teammate action", "Deliberate play", true, "What restarted the sequence."),
      factor("body-part", "Body part used", "Foot / throw-in", true, "Restriction trigger."),
      factor("goalkeeper-action", "Goalkeeper action", "Handles", true, "Hands after the pass."),
      factor("pressure", "Opponent pressure", "Low", true, "Emergency context."),
      factor("trick", "Deliberate trick", "None", false, "Separate trick scenarios."),
    ],
    criticalFactor: "teammate-action",
    prompt: (n) => `Variant ${n}: can the keeper handle this pass from a teammate?`,
    title: (n) => `Keeper handling restriction #${n}`,
    description: (n, level) =>
      `Handling restriction case ${n} in ${level}. A teammate plays the ball back toward the goalkeeper, who uses the hands inside the area. Identify whether the teammate action triggers the restriction.`,
    originalDecision: "Play on",
    educator: (n) =>
      `Keeper case ${n}: body part and deliberateness are the whole lesson.`,
    referee: (n) =>
      `On ${n} I check foot vs head/chest before I even think about a whistle.`,
  },
];

function distribute(seed: number, keys: readonly string[], favorite: string) {
  const random = seededRandom(`dist:${seed}:${favorite}`);
  const weights = keys.map((key) => (key === favorite ? 45 + Math.floor(random() * 30) : 4 + Math.floor(random() * 12)));
  const total = weights.reduce((sum, value) => sum + value, 0);
  const percentages: Record<string, number> = {};
  let allocated = 0;
  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      percentages[key] = 100 - allocated;
      return;
    }
    const value = Math.max(1, Math.round((weights[index]! / total) * 100));
    percentages[key] = value;
    allocated += value;
  });
  return percentages;
}

/** Procedural unique catalog entries to reach 100 total posts. */
export function buildGeneratedCases(needed: number): readonly OfficiatingCase[] {
  const cases: OfficiatingCase[] = [];
  for (let index = 0; index < needed; index += 1) {
    const template = templates[index % templates.length]!;
    const n = index + 1;
    const id = `gen-${template.category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${String(n).padStart(3, "0")}`;
    const level = LEVELS[index % LEVELS.length]!;
    const difficulty = DIFFICULTIES[index % DIFFICULTIES.length]!;
    const mediaKind = MEDIA_KINDS[index % MEDIA_KINDS.length]!;
    const image = IMAGE_POOL[index % IMAGE_POOL.length]!;
    const optionIds = template.options.map((item) => item.id);
    const day = String((index % 27) + 1).padStart(2, "0");
    const hour = String((index % 20) + 4).padStart(2, "0");

    cases.push(
      buildCase({
        id,
        slug: id,
        title: template.title(n),
        prompt: template.prompt(n),
        description: template.description(n, level),
        competitionLevel: level,
        difficulty,
        category: template.category,
        originalDecision: template.originalDecision,
        answerOptions: template.options,
        recommendedDecision: template.recommended,
        expertExplanation: `Authored demo rationale for ${id}: teaching material only; requires qualified review.`,
        ruleReference: template.ruleReference,
        rulePath: template.rulePath,
        factors: template.factors.map((item, factorIndex) =>
          factor(
            item.key,
            item.label,
            `${item.value} · v${n}.${factorIndex + 1}`,
            item.supportsRecommendation,
            `${item.explanation} (case ${n})`,
          ),
        ),
        criticalFactor: template.criticalFactor,
        communityDistribution: makeDistribution(
          "Authored demo — community pattern",
          distribute(n, optionIds, template.recommended),
        ),
        verifiedDistribution: makeDistribution(
          "Authored demo — reviewer pattern",
          distribute(n + 50, optionIds, template.recommended),
        ),
        learnerDistribution: makeDistribution(
          "Authored demo — learner pattern",
          distribute(n + 90, optionIds, template.alternate),
        ),
        disagreementScore: 0.25 + ((index * 7) % 55) / 100,
        freshnessScore: 0.55 + ((index * 11) % 40) / 100,
        publishedAt: `2026-05-${day}T${hour}:15:00.000Z`,
        mediaKind,
        imageSrc: mediaKind === "image" ? image.src : null,
        mediaWidth: mediaKind === "text" ? null : image.width,
        mediaHeight: mediaKind === "text" ? null : image.height,
        mediaAlt:
          mediaKind === "text"
            ? `Text-only teaching prompt for ${id}`
            : mediaKind === "video"
              ? `Demo clip placeholder for ${id}`
              : `Still frame for ${id}`,
        educatorBody: template.educator(n),
        refereeBody: template.referee(n),
        ruleCitation: template.ruleReference,
        alternateOptionId: template.alternate,
        publisherSeed: id,
      }),
    );
  }
  return cases;
}
