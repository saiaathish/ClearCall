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
import { PHOTO_ASSETS, VIDEO_ASSETS, photoAt } from "@/data/media-assets";
import { seededRandom } from "@/data/feed-people";

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

type Template = {
  category: CaseCategory;
  options: typeof foulOptions;
  recommended: string;
  alternate: string;
  ruleReference: string;
  rulePath: readonly string[];
  factors: ReturnType<typeof factor>[];
  criticalFactor: string;
  prompts: readonly string[];
  titles: readonly string[];
  description: (level: string, beat: string) => string;
  originalDecision: string;
  educatorBodies: readonly string[];
  refereeBodies: readonly string[];
};

const BEATS = [
  "right after a restart",
  "in the final ten minutes",
  "with the score still level",
  "after a long spell of possession",
  "on a wet pitch",
  "with substitutes waiting to enter",
  "under a loud sideline",
  "just after a warning for dissent",
] as const;

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
    prompts: [
      "Late challenge — does this stay yellow or tip into a red?",
      "How would you sell this midfield tackle from your angle?",
      "Is the follow-through enough to upgrade this from reckless to serious foul play?",
      "Card colour on this late arrival — caution or send-off?",
      "Would you stay with yellow if the attacker stays on their feet?",
      "Studs are partially showing — where do you land?",
      "Same contact height, more force: still a yellow for you?",
      "Defend your card here — yellow or red?",
    ],
    titles: [
      "Late challenge, low contact",
      "Midfield duel arrives a beat late",
      "Follow-through after the ball is gone",
      "Ankle-height side tackle",
      "Recoverable control or not?",
      "Studs angled through the duel",
      "Force threshold in open play",
      "Caution or send-off on the break",
    ],
    description: (level, beat) =>
      `${level} match, ${beat}. A defender arrives late into a midfield duel; contact is low but the follow-through carries force. Decide whether control still exists at impact.`,
    originalDecision: "Yellow card",
    educatorBodies: [
      "Threshold force and control together — neither factor alone sells the card colour.",
      "Start with contact height, then ask whether the player could still withdraw.",
      "If the follow-through rides up after the ball is gone, you are in red-card territory.",
      "Teach the paired comparison: same challenge shape, different force story.",
    ],
    refereeBodies: [
      "I sell the yellow unless the follow-through clearly rides up after the ball is gone.",
      "From that angle I need the stud path before I escalate.",
      "If the attacker stays upright and the contact stays low, I am staying yellow.",
      "I get close, separate them, and record the contact point for the review.",
    ],
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
    prompts: [
      "Arm contact after a deflection — still an offence?",
      "Is this arm making the body bigger or just bracing?",
      "Would you give a penalty on this handball look?",
      "Reaction time enough to clear the defender here?",
      "Natural position or deliberate block — your call?",
      "Close-range ricochet onto the arm: play on or penalty?",
      "Does the arm leave a natural path at all?",
      "Sell this handball the way you would in a game.",
    ],
    titles: [
      "Deflection onto a nearby arm",
      "Arm tucked near the torso",
      "Unexpected bounce in the box",
      "Handball or play on?",
      "Silhouette stays mostly natural",
      "Close-range arm contact",
      "Brace vs block in the area",
      "Arm path after a blocked shot",
    ],
    description: (level, beat) =>
      `${level}, ${beat}. A blocked ball changes direction quickly and strikes a nearby arm. The arm is close to the body. Decide whether reaction time and position clear the defender.`,
    originalDecision: "Play on",
    educatorBodies: [
      "Start with reaction time and silhouette before you invent intent.",
      "If the arm never leaves a natural path, play on is available.",
      "Deflection plus proximity is the whole lesson on this one.",
      "Separate make-the-body-bigger from an arm that simply cannot move in time.",
    ],
    refereeBodies: [
      "If the arm never leaves a natural path, I am selling play on immediately.",
      "I need a clearer view of whether the arm moved toward the ball.",
      "From my angle this looks like a brace, not a block.",
      "Close range plus tucked arm — I am staying with play on.",
    ],
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
    prompts: [
      "Offside position — but is there an actual offence?",
      "Does this attacker impact anyone before the shot?",
      "Would you flag involvement or stay down?",
      "Goal stands or offside offence — what do you sell?",
      "Position is clear. Involvement is not. Your call?",
      "Keeper sightline mostly clear — enough to play on?",
      "No touch, no challenge: still an offside offence?",
      "How do you talk through this with your AR?",
    ],
    titles: [
      "Offside position, unclear impact",
      "Attacker held in an offside spot",
      "Involvement vs position",
      "Keeper sightline stays mostly clear",
      "No touch before the finish",
      "Did the defender actually react?",
      "Passive look near the six",
      "AR check on opponent impact",
    ],
    description: (level, beat) =>
      `${level} teaching clip, ${beat}. An attacker starts offside when the pass is played. Separate position from involvement: touch, challenge, sightline, or impact on an opponent.`,
    originalDecision: "Offside offence",
    educatorBodies: [
      "Position is the start of the question, not the answer.",
      "If nobody reacts to the attacker, involvement is hard to sell.",
      "Teach the AR conversation: what did you see the defender do?",
      "No touch and no challenge leaves you hunting for real impact.",
    ],
    refereeBodies: [
      "I need my AR to tell me whether anyone actually reacted to that attacker.",
      "Sightline looks clear enough that I am awarding the goal.",
      "Without a touch or challenge I am reluctant to flag.",
      "I stay down unless the defender's movement is clearly affected.",
    ],
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
    prompts: [
      "Tactical foul — SPA yellow or DOGSO red?",
      "Is the chance still obvious with cover recovering?",
      "How do you read distance and direction on this break?",
      "Hold just outside the box: yellow or red?",
      "Would covering defenders save this from a send-off?",
      "Four DOGSO checks — where does this fail?",
      "Attacker in the channel: still an obvious goal-scoring opportunity?",
      "Sell SPA or DOGSO from this angle.",
    ],
    titles: [
      "SPA vs DOGSO on the break",
      "Tactical foul outside the box",
      "Cover recovering toward the ball",
      "Chance quality on a through ball",
      "Hold that ends a promising attack",
      "Central channel, late trip",
      "Direction toward goal, not wide",
      "Last look before the card colour",
    ],
    description: (level, beat) =>
      `${level}, ${beat}. An attacker is stopped by a tactical foul while progressing toward goal. Work all four DOGSO considerations before choosing the card.`,
    originalDecision: "Yellow card",
    educatorBodies: [
      "DOGSO fails if you skip covering defenders or direction.",
      "Distance alone does not answer the card colour.",
      "Teach the four considerations in order every time.",
      "If cover is genuinely recovering, SPA is often available.",
    ],
    refereeBodies: [
      "I glance at cover first, then decide whether the chance was still obvious.",
      "Direction is toward goal, but the recovering defender matters here.",
      "Outside the box with cover — I am landing on yellow.",
      "If the attacker keeps the ball under control into the box, I escalate.",
    ],
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
    prompts: [
      "Advantage signalled — bring it back or live with it?",
      "Did the attacking team actually get a benefit here?",
      "How long do you wait before returning to the foul?",
      "Possession looks unstable — still advantage?",
      "Would you bring this back under immediate pressure?",
      "Signal went up. Next action dies. Your call?",
      "Is the window still open after that touch?",
      "Advantage or original foul — sell it.",
    ],
    titles: [
      "Advantage window closes quickly",
      "Signal up, benefit never arrives",
      "Pressure kills the next touch",
      "Bring back or play on?",
      "Unstable possession after the foul",
      "Short window in midfield",
      "Advantage that never materialises",
      "Return to the original free kick",
    ],
    description: (level, beat) =>
      `Advantage puzzle in ${level}, ${beat}. The referee signals advantage after a foul, but the next action does not create a clear attacking benefit. Decide whether the window is still open.`,
    originalDecision: "Play continued",
    educatorBodies: [
      "The signal is not a life sentence — only the realized benefit is.",
      "If pressure is immediate, bring it back without apology.",
      "Teach the difference between a hopeful signal and a real advantage.",
      "Time elapsed plus possession quality answers most of these.",
    ],
    refereeBodies: [
      "I bring it back only if the failure is immediate and obvious.",
      "That next touch never escaped pressure — free kick.",
      "I already signalled, but the benefit never arrived.",
      "Under that press I am not waiting for a miracle.",
    ],
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
    prompts: [
      "Contact or con — what do you sell?",
      "Is the fall bigger than the contact?",
      "Would you caution for simulation on this look?",
      "Light contact in the area — penalty, yellow, or play on?",
      "Who initiates the contact in your view?",
      "Embellishment enough to punish without a clear foul?",
      "Single angle only — how confident are you?",
      "Separate the foul question from the simulation question.",
    ],
    titles: [
      "Light contact, big fall",
      "Simulation or genuine trip?",
      "Who created the contact?",
      "Embellished fall in the area",
      "Play on with a warning look",
      "Penalty appeal without a clear initiator",
      "Theatre after a legal challenge",
      "Single-angle deception call",
    ],
    description: (level, beat) =>
      `Deception case in ${level}, ${beat}. There may be light contact in the area, but the fall looks exaggerated. Separate the foul question from the simulation question.`,
    originalDecision: "Penalty kick",
    educatorBodies: [
      "Punish the foul you saw, or the deception you saw — not the crowd.",
      "Without a clear initiator, stay away from both extremes.",
      "Teach learners to name the contact before naming the theatre.",
      "Single-angle certainty is often lower than the sideline thinks.",
    ],
    refereeBodies: [
      "I need a clear initiator. Without that I stay away from both extremes.",
      "The fall is bigger than the contact — I am not giving a penalty.",
      "Legal challenge plus embellishment: play on, maybe a word.",
      "If I cannot sell the foul, I am not inventing simulation either.",
    ],
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
    prompts: [
      "Can the keeper handle this pass from a teammate?",
      "Footed back-pass — indirect free kick or play on?",
      "Does the teammate action trigger the handling restriction?",
      "Throw-in back to the keeper: legal to handle?",
      "Deliberate play or deflection into the keeper's hands?",
      "How do you read body part on this restart?",
      "Keeper picks it up after a teammate's pass — your call?",
      "Restriction offence or emergency handling?",
    ],
    titles: [
      "Back-pass into the keeper's hands",
      "Footed pass triggers the restriction",
      "Throw-in return to the goalkeeper",
      "Handling after a deliberate play",
      "Was it a pass or a deflection?",
      "Keeper collects a teammate's pass",
      "Indirect free kick near the six",
      "Body-part check before the whistle",
    ],
    description: (level, beat) =>
      `Handling restriction in ${level}, ${beat}. A teammate plays the ball back toward the goalkeeper, who uses the hands inside the area. Identify whether the teammate action triggers the restriction.`,
    originalDecision: "Play on",
    educatorBodies: [
      "Body part and deliberateness are the whole lesson.",
      "Head or chest back is different from a footed pass.",
      "Teach the restriction trigger before debating pressure.",
      "If the teammate deliberately played it with the foot, hands are out.",
    ],
    refereeBodies: [
      "I check foot vs head/chest before I even think about a whistle.",
      "That looks like a deliberate footed pass — indirect free kick.",
      "If it came off the body as a deflection, I am playing on.",
      "Low pressure does not erase a clear restriction offence.",
    ],
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

/**
 * Procedural catalog filler. Uses unique real photos, real demo clips, or text-only —
 * never SVG placeholders, never "Variant ##" labels.
 */
export function buildGeneratedCases(needed: number, mediaStartIndex = 0): readonly OfficiatingCase[] {
  const cases: OfficiatingCase[] = [];
  let photoCursor = mediaStartIndex;

  for (let index = 0; index < needed; index += 1) {
    const template = templates[index % templates.length]!;
    const id = `gen-${template.category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${String(index + 1).padStart(3, "0")}`;
    const level = LEVELS[index % LEVELS.length]!;
    const difficulty = DIFFICULTIES[index % DIFFICULTIES.length]!;
    const beat = BEATS[index % BEATS.length]!;
    const title = template.titles[index % template.titles.length]!;
    const prompt = template.prompts[index % template.prompts.length]!;
    const educatorBody = template.educatorBodies[index % template.educatorBodies.length]!;
    const refereeBody = template.refereeBodies[index % template.refereeBodies.length]!;
    const optionIds = template.options.map((item) => item.id);
    const day = String((index % 27) + 1).padStart(2, "0");
    const hour = String((index % 20) + 4).padStart(2, "0");

    // Prefer unique photos, then a few real videos, then text-only when media is exhausted.
    let mediaKind: MediaKind = "text";
    let imageSrc: string | null = null;
    let videoSrc: string | null = null;
    let posterSrc: string | null = null;
    let mediaWidth: number | null = null;
    let mediaHeight: number | null = null;
    let mediaAlt = `Text-only teaching prompt: ${title}`;

    const slot = index % 5;
    if (slot === 0 && photoCursor < PHOTO_ASSETS.length) {
      const photo = photoAt(photoCursor);
      photoCursor += 1;
      mediaKind = "image";
      imageSrc = photo.src;
      mediaWidth = photo.width;
      mediaHeight = photo.height;
      mediaAlt = photo.alt;
    } else if (slot === 1 && index < VIDEO_ASSETS.length * 4) {
      const video = VIDEO_ASSETS[index % VIDEO_ASSETS.length]!;
      const poster = photoAt(photoCursor < PHOTO_ASSETS.length ? photoCursor : index);
      if (photoCursor < PHOTO_ASSETS.length) photoCursor += 1;
      mediaKind = "video";
      videoSrc = video.videoSrc;
      posterSrc = poster.src;
      mediaWidth = video.width;
      mediaHeight = video.height;
      mediaAlt = video.alt;
    } else if (slot === 2 && photoCursor < PHOTO_ASSETS.length) {
      const photo = photoAt(photoCursor);
      photoCursor += 1;
      mediaKind = "image";
      imageSrc = photo.src;
      mediaWidth = photo.width;
      mediaHeight = photo.height;
      mediaAlt = photo.alt;
    } else {
      mediaKind = "text";
    }

    cases.push(
      buildCase({
        id,
        slug: id,
        title,
        prompt,
        description: template.description(level, beat),
        competitionLevel: level,
        difficulty,
        category: template.category,
        originalDecision: template.originalDecision,
        answerOptions: template.options,
        recommendedDecision: template.recommended,
        expertExplanation:
          "Authored demo rationale for a teaching scenario only; requires qualified review before production use.",
        ruleReference: template.ruleReference,
        rulePath: template.rulePath,
        factors: template.factors,
        criticalFactor: template.criticalFactor,
        communityDistribution: makeDistribution(
          "Authored demo — community pattern",
          distribute(index + 1, optionIds, template.recommended),
        ),
        verifiedDistribution: makeDistribution(
          "Authored demo — reviewer pattern",
          distribute(index + 51, optionIds, template.recommended),
        ),
        learnerDistribution: makeDistribution(
          "Authored demo — learner pattern",
          distribute(index + 91, optionIds, template.alternate),
        ),
        disagreementScore: 0.25 + ((index * 7) % 55) / 100,
        freshnessScore: 0.55 + ((index * 11) % 40) / 100,
        publishedAt: `2026-05-${day}T${hour}:15:00.000Z`,
        mediaKind,
        imageSrc,
        videoSrc,
        posterSrc,
        mediaWidth,
        mediaHeight,
        mediaAlt,
        educatorBody,
        refereeBody,
        ruleCitation: template.ruleReference,
        alternateOptionId: template.alternate,
        publisherSeed: id,
      }),
    );
  }
  return cases;
}
