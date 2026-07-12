import type { OfficiatingCase } from "@/lib/types";
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
  option,
  simulationOptions,
} from "@/data/case-builders";
import { PHOTO_ASSETS, VIDEO_ASSETS } from "@/data/media-assets";

function photo(src: string) {
  const asset = PHOTO_ASSETS.find((item) => item.src === src);
  if (!asset) throw new Error(`Missing photo asset: ${src}`);
  return asset;
}

function video(index: number) {
  const asset = VIDEO_ASSETS[index];
  if (!asset) throw new Error(`Missing video asset at index ${index}`);
  return asset;
}

const misconductOptions = [
  option("verbal-warning", "Verbal warning only", "Warning", "Manage without a card."),
  option("yellow-dissent", "Yellow card for dissent", "Yellow card", "Caution for dissent."),
  option("yellow-usb", "Yellow card for unsporting behaviour", "USB yellow", "Caution for unsporting behaviour."),
  option("red-offensive", "Red card for offensive language", "Red card", "Send off for offensive, insulting, or abusive language."),
  option("insufficient-evidence", "Not enough information", "Need context", "Tone and words are not clear enough."),
] as const;

const holdingOptions = [
  option("play-on", "Play on", "Play on", "No punishable hold."),
  option("direct-free-kick", "Direct free kick", "Free kick", "Penalize holding outside the area."),
  option("penalty-kick", "Penalty kick", "Penalty", "Penalize holding inside the penalty area."),
  option("penalty-yellow", "Penalty kick and yellow card", "Penalty + yellow", "Award the penalty and caution for SPA or USB."),
  option("insufficient-evidence", "Not enough information", "Need more angles", "Contact sequence is unclear."),
] as const;

const restartOptions = [
  option("retake", "Order a retake", "Retake", "The restart was incorrect and must be taken again."),
  option("play-continues", "Allow play to continue", "Continue", "Any irregularity did not require a stoppage."),
  option("indirect-free-kick", "Indirect free kick", "IFK", "Award an indirect free kick for the offence."),
  option("drop-ball", "Dropped ball", "Dropped ball", "Restart with a dropped ball."),
  option("insufficient-evidence", "Not enough information", "Need context", "The sequence is incomplete."),
] as const;

/**
 * Curated hackathon demo feed: varied topics, unique media, clean copy.
 * Quality over volume — roughly a dozen strong teaching posts.
 */
export const demoCatalog: readonly OfficiatingCase[] = [
  buildCase({
    id: "sfp-controlled-lunge",
    slug: "controlled-lunge-lower-contact",
    title: "Is this low challenge a yellow or a red?",
    prompt: "Does this late challenge stay at caution level, or cross into serious foul play?",
    description:
      "A midfielder arrives late into a U17 duel. Contact is low across the top of the opponent's boot, approach speed is moderate, and the tackler still appears able to withdraw some force.",
    competitionLevel: "Youth U17 regional",
    difficulty: "intermediate",
    category: "Serious foul play",
    originalDecision: "Yellow card",
    answerOptions: foulOptions,
    recommendedDecision: "direct-free-kick-yellow",
    expertExplanation:
      "Low contact, moderate force, and recoverable control support a caution rather than a sending-off.",
    ruleReference: "Law 12 concept: reckless challenges and serious foul play",
    rulePath: ["Law 12", "Fouls and misconduct", "Serious foul play"],
    factors: [
      factor("speed", "Speed", "Medium", true, "Approach speed raises risk but is not decisive alone."),
      factor("contact-height", "Point of contact", "Top of foot", true, "The contact remains comparatively low."),
      factor("studs", "Studs exposure", "Partial", true, "Partial exposure is considered with force and contact height."),
      factor("control", "Control", "Recoverable", true, "The tackler retains some ability to withdraw."),
      factor("force", "Force", "Moderate", true, "Force does not match a high-endangering challenge."),
    ],
    criticalFactor: "control",
    communityDistribution: makeDistribution("Authored demo: community pattern", {
      "play-on": 4, "direct-free-kick-no-card": 11, "direct-free-kick-yellow": 51, "direct-free-kick-red": 29, "insufficient-evidence": 5,
    }),
    verifiedDistribution: makeDistribution("Authored demo: reviewer pattern", {
      "play-on": 1, "direct-free-kick-no-card": 6, "direct-free-kick-yellow": 67, "direct-free-kick-red": 23, "insufficient-evidence": 3,
    }),
    learnerDistribution: makeDistribution("Authored demo: learner pattern", {
      "play-on": 7, "direct-free-kick-no-card": 12, "direct-free-kick-yellow": 42, "direct-free-kick-red": 31, "insufficient-evidence": 8,
    }),
    disagreementScore: 0.62,
    freshnessScore: 0.84,
    publishedAt: "2026-06-24T14:00:00.000Z",
    mediaKind: "image",
    imageSrc: photo("/media/cases/lunge-wide.png").src,
    mediaWidth: photo("/media/cases/lunge-wide.png").width,
    mediaHeight: photo("/media/cases/lunge-wide.png").height,
    mediaAlt: photo("/media/cases/lunge-wide.png").alt,
    similarCaseIds: ["sfp-high-contact-lunge"],
    educatorBody:
      "Contact height matters, but it is not decisive by itself. Weigh speed, force, stud direction, and whether the defender retained control.",
    refereeBody:
      "I would show yellow and communicate firmly. The challenge is reckless, but this view does not show enough force for serious foul play.",
    alternativeBody:
      "I would want the reverse angle before ruling out red. If the studs are driven through rather than glancing down, the sanction changes.",
    ruleCitation: "Law 12 concept: reckless challenges",
    publisherSeed: "sfp-controlled-lunge",
  }),

  buildCase({
    id: "sfp-high-contact-lunge",
    slug: "high-contact-uncontrolled-lunge",
    title: "Is this studs-up challenge serious foul play?",
    prompt: "Which sanction best fits the danger created by this late, raised challenge?",
    description:
      "An attacker arrives late at high pace with the leading foot raised. The studs make direct contact across the top of the opponent's boot, and there is little chance to pull out before impact.",
    competitionLevel: "Open-age amateur",
    difficulty: "advanced",
    category: "Serious foul play",
    originalDecision: "Yellow card",
    answerOptions: foulOptions,
    recommendedDecision: "direct-free-kick-red",
    expertExplanation:
      "High contact, exposed studs, and no realistic withdrawal support a sending-off for serious foul play.",
    ruleReference: "Law 12 concept: serious foul play",
    rulePath: ["Law 12", "Fouls and misconduct", "Serious foul play"],
    factors: [
      factor("speed", "Speed", "High", true, "High approach speed increases the danger created."),
      factor("contact-height", "Point of contact", "Above ankle", true, "Contact is higher than a routine caution."),
      factor("studs", "Studs exposure", "Full", true, "Exposed studs contribute to the risk profile."),
      factor("control", "Control", "Low", true, "The tackler has little capacity to reduce force."),
      factor("force", "Force", "High", true, "Force and contact height combine to raise the danger."),
    ],
    criticalFactor: "contact-height",
    communityDistribution: makeDistribution("Authored demo: community pattern", {
      "play-on": 1, "direct-free-kick-no-card": 3, "direct-free-kick-yellow": 28, "direct-free-kick-red": 64, "insufficient-evidence": 4,
    }),
    verifiedDistribution: makeDistribution("Authored demo: reviewer pattern", {
      "play-on": 0, "direct-free-kick-no-card": 1, "direct-free-kick-yellow": 12, "direct-free-kick-red": 84, "insufficient-evidence": 3,
    }),
    learnerDistribution: makeDistribution("Authored demo: learner pattern", {
      "play-on": 2, "direct-free-kick-no-card": 5, "direct-free-kick-yellow": 35, "direct-free-kick-red": 51, "insufficient-evidence": 7,
    }),
    disagreementScore: 0.55,
    freshnessScore: 0.81,
    publishedAt: "2026-06-22T16:30:00.000Z",
    mediaKind: "video",
    videoSrc: video(0).videoSrc,
    posterSrc: video(0).posterSrc,
    mediaWidth: video(0).width,
    mediaHeight: video(0).height,
    mediaAlt: video(0).alt,
    similarCaseIds: ["sfp-controlled-lunge"],
    educatorBody:
      "Start with contact height and stud exposure, then ask whether the player could still withdraw. This profile points to red.",
    refereeBody:
      "I would freeze the moment of contact, show red, and keep the restart calm. Do not negotiate the colour on the field.",
    alternativeBody:
      "If pace is lower than it looks and the boot only brushes rather than drives through, I could still land on yellow.",
    ruleCitation: "Law 12 concept: serious foul play",
    publisherSeed: "sfp-high-contact-lunge",
  }),

  buildCase({
    id: "sfp-studs-high-follow",
    slug: "studs-high-follow-through",
    title: "Can a high follow-through be red after winning the ball?",
    prompt: "If the ball is won cleanly, can a high follow-through still be serious foul play?",
    description:
      "A defender wins the ball first with an open-foot tackle, but the follow-through continues upward into the attacker's shin at speed with studs exposed.",
    competitionLevel: "Semi-professional development",
    difficulty: "advanced",
    category: "Serious foul play",
    originalDecision: "Yellow card",
    answerOptions: foulOptions,
    recommendedDecision: "direct-free-kick-red",
    expertExplanation:
      "Winning the ball does not excuse an endangering follow-through with studs into the shin.",
    ruleReference: "Law 12 concept: serious foul play",
    rulePath: ["Law 12", "Fouls and misconduct", "Serious foul play"],
    factors: [
      factor("speed", "Speed", "High", true, "Challenge is at pace."),
      factor("contact-height", "Point of contact", "Shin on follow-through", true, "Danger arrives after the ball."),
      factor("studs", "Studs exposure", "Full", true, "Studs contact the shin."),
      factor("control", "Control", "Low on follow-through", true, "Cannot withdraw the rising boot."),
      factor("force", "Force", "High", true, "Significant force into the leg."),
    ],
    criticalFactor: "contact-height",
    communityDistribution: makeDistribution("Authored demo: community pattern", {
      "play-on": 2, "direct-free-kick-no-card": 6, "direct-free-kick-yellow": 34, "direct-free-kick-red": 52, "insufficient-evidence": 6,
    }),
    verifiedDistribution: makeDistribution("Authored demo: reviewer pattern", {
      "play-on": 0, "direct-free-kick-no-card": 3, "direct-free-kick-yellow": 18, "direct-free-kick-red": 74, "insufficient-evidence": 5,
    }),
    learnerDistribution: makeDistribution("Authored demo: learner pattern", {
      "play-on": 3, "direct-free-kick-no-card": 8, "direct-free-kick-yellow": 40, "direct-free-kick-red": 42, "insufficient-evidence": 7,
    }),
    disagreementScore: 0.6,
    freshnessScore: 0.89,
    publishedAt: "2026-07-11T08:05:00.000Z",
    mediaKind: "video",
    videoSrc: video(7).videoSrc,
    posterSrc: video(7).posterSrc,
    mediaWidth: video(7).width,
    mediaHeight: video(7).height,
    mediaAlt: video(7).alt,
    educatorBody:
      "Ball first is not a free pass. Judge the endangering contact that arrives on the follow-through.",
    refereeBody:
      "I am selling the red on the shin contact, not reacting to applause for winning the ball.",
    alternativeBody:
      "If the rising boot only glances after the ball is gone and force looks moderate, I might still stay with yellow.",
    ruleCitation: "Law 12 concept: serious foul play",
    alternateOptionId: "direct-free-kick-yellow",
    publisherSeed: "sfp-studs-high-follow",
  }),

  buildCase({
    id: "handball-supporting-arm",
    slug: "supporting-arm-ground-contact",
    title: "Is arm contact during a slide a handball?",
    prompt: "Should the ball striking the arm of a sliding defender be penalized?",
    description:
      "A defender commits to a slide to intercept a through ball. As they go to ground, the trailing arm extends for balance; the ball deflects off a nearby opponent and strikes that arm.",
    competitionLevel: "Adult recreational",
    difficulty: "intermediate",
    category: "Handball",
    originalDecision: "Play on",
    answerOptions: handballOptions,
    recommendedDecision: "no-handball",
    expertExplanation:
      "The arm looks like it is bracing the fall rather than making the body unnaturally bigger.",
    ruleReference: "Law 12 concept: handling the ball",
    rulePath: ["Law 12", "Fouls and misconduct", "Handling the ball"],
    factors: [
      factor("arm-position", "Arm position", "Supporting the body", true, "The arm is bracing a natural fall."),
      factor("arm-movement", "Movement toward ball", "None", true, "No deliberate sweep toward the ball."),
      factor("proximity", "Ball proximity", "Very close", true, "Little time to react after the deflection."),
      factor("silhouette", "Body silhouette", "Natural for slide", true, "Arm position follows the sliding action."),
      factor("deflection", "Prior deflection", "Nearby opponent", true, "A short deflection reduces reaction time."),
    ],
    criticalFactor: "arm-position",
    communityDistribution: makeDistribution("Authored demo: community pattern", {
      "no-handball": 48, "direct-free-kick-handball": 7, "penalty-kick-handball": 36, "penalty-kick-yellow": 4, "insufficient-evidence": 5,
    }),
    verifiedDistribution: makeDistribution("Authored demo: reviewer pattern", {
      "no-handball": 71, "direct-free-kick-handball": 3, "penalty-kick-handball": 20, "penalty-kick-yellow": 1, "insufficient-evidence": 5,
    }),
    learnerDistribution: makeDistribution("Authored demo: learner pattern", {
      "no-handball": 39, "direct-free-kick-handball": 5, "penalty-kick-handball": 43, "penalty-kick-yellow": 6, "insufficient-evidence": 7,
    }),
    disagreementScore: 0.71,
    freshnessScore: 0.91,
    publishedAt: "2026-07-02T11:15:00.000Z",
    mediaKind: "image",
    imageSrc: photo("/media/cases/handball-portrait.png").src,
    mediaWidth: photo("/media/cases/handball-portrait.png").width,
    mediaHeight: photo("/media/cases/handball-portrait.png").height,
    mediaAlt: photo("/media/cases/handball-portrait.png").alt,
    similarCaseIds: ["handball-raised-arm"],
    educatorBody:
      "Ask whether the arm is working for the body or for the ball. Supporting a slide is usually play on.",
    refereeBody:
      "I would signal play on clearly and keep moving. Balance arms in a slide are not automatic handballs.",
    alternativeBody:
      "If the arm pushed out into the ball's path rather than bracing the fall, I would reverse to a free kick or penalty.",
    ruleCitation: "Law 12 concept: handling the ball",
    publisherSeed: "handball-supporting-arm",
  }),

  buildCase({
    id: "handball-raised-arm",
    slug: "raised-arm-blocks-cross",
    title: "Does a raised arm on a cross make a penalty?",
    prompt: "Was a penalty correctly awarded for raised-arm contact on a cross?",
    description:
      "A defender turns toward an inswinging cross inside the penalty area with one arm raised above shoulder height. The ball travels directly from the wide player and strikes the elevated arm.",
    competitionLevel: "Adult recreational",
    difficulty: "intermediate",
    category: "Handball",
    originalDecision: "Play on",
    answerOptions: handballOptions,
    recommendedDecision: "penalty-kick-handball",
    expertExplanation:
      "Arm raised, time to react, and an enlarged silhouette support a penalty kick.",
    ruleReference: "Law 12 concept: handling the ball",
    rulePath: ["Law 12", "Fouls and misconduct", "Handling the ball"],
    factors: [
      factor("arm-position", "Arm position", "Above shoulder", true, "The elevated arm is central to the recommendation."),
      factor("arm-movement", "Movement toward ball", "Turns into path", true, "The turn carries the arm toward the flight path."),
      factor("proximity", "Ball proximity", "Several metres", true, "More opportunity to react than in a close deflection."),
      factor("silhouette", "Body silhouette", "Clearly enlarged", true, "The raised arm expands the space occupied."),
      factor("deflection", "Prior deflection", "None", true, "The flight is direct."),
    ],
    criticalFactor: "arm-position",
    communityDistribution: makeDistribution("Authored demo: community pattern", {
      "no-handball": 14, "direct-free-kick-handball": 4, "penalty-kick-handball": 67, "penalty-kick-yellow": 11, "insufficient-evidence": 4,
    }),
    verifiedDistribution: makeDistribution("Authored demo: reviewer pattern", {
      "no-handball": 5, "direct-free-kick-handball": 2, "penalty-kick-handball": 82, "penalty-kick-yellow": 8, "insufficient-evidence": 3,
    }),
    learnerDistribution: makeDistribution("Authored demo: learner pattern", {
      "no-handball": 19, "direct-free-kick-handball": 5, "penalty-kick-handball": 58, "penalty-kick-yellow": 12, "insufficient-evidence": 6,
    }),
    disagreementScore: 0.43,
    freshnessScore: 0.89,
    publishedAt: "2026-06-30T09:45:00.000Z",
    mediaKind: "image",
    imageSrc: photo("/media/cases/handball-raised-arm.png").src,
    mediaWidth: photo("/media/cases/handball-raised-arm.png").width,
    mediaHeight: photo("/media/cases/handball-raised-arm.png").height,
    mediaAlt: photo("/media/cases/handball-raised-arm.png").alt,
    similarCaseIds: ["handball-supporting-arm"],
    educatorBody:
      "Raised arm above the shoulder with time to react usually enlarges the silhouette. That is the penalty case.",
    refereeBody:
      "I would point to the spot, sell the decision early, and manage the wall before the restart.",
    alternativeBody:
      "If the arm was already up for balance and the ball arrived too quickly after a deflection, I could still stay with play on.",
    ruleCitation: "Law 12 concept: handling the ball",
    publisherSeed: "handball-raised-arm",
  }),

  buildCase({
    id: "offside-line-of-vision",
    slug: "offside-position-blocks-view",
    title: "Does a nearby offside attacker interfere with play?",
    prompt: "Is the attacker in an offside position actively interfering during this challenge?",
    description:
      "Two players contest the ball in midfield. A third attacker in an offside position is nearby in the background. The defending team claims interference, though the offside attacker does not touch the ball.",
    competitionLevel: "College club",
    difficulty: "advanced",
    category: "Offside interference",
    originalDecision: "Goal awarded",
    answerOptions: offsideOptions,
    recommendedDecision: "offside-indirect-free-kick",
    expertExplanation:
      "Proximity that affects an opponent's ability to play the ball can be interference even without a touch.",
    ruleReference: "Law 11 concept: interfering with an opponent",
    rulePath: ["Law 11", "Offside", "Interfering with an opponent"],
    factors: [
      factor("position", "Position at involvement", "Offside position", true, "Position is established before evaluating involvement."),
      factor("line-of-vision", "Line of vision", "Contested", true, "Proximity may affect the defender's read."),
      factor("challenge", "Challenge for ball", "Nearby", true, "The offside attacker is close to the duel."),
      factor("opponent-impact", "Opponent impact", "Affects challenge", true, "Defenders react to the third player."),
      factor("touch", "Ball touch", "No touch", false, "A touch is not always required for interference."),
    ],
    criticalFactor: "opponent-impact",
    communityDistribution: makeDistribution("Authored demo: community pattern", {
      "goal-awarded": 34, "offside-indirect-free-kick": 56, "attacking-foul-direct-free-kick": 3, "insufficient-evidence": 7,
    }),
    verifiedDistribution: makeDistribution("Authored demo: reviewer pattern", {
      "goal-awarded": 16, "offside-indirect-free-kick": 77, "attacking-foul-direct-free-kick": 1, "insufficient-evidence": 6,
    }),
    learnerDistribution: makeDistribution("Authored demo: learner pattern", {
      "goal-awarded": 42, "offside-indirect-free-kick": 45, "attacking-foul-direct-free-kick": 4, "insufficient-evidence": 9,
    }),
    disagreementScore: 0.68,
    freshnessScore: 0.77,
    publishedAt: "2026-06-17T18:00:00.000Z",
    mediaKind: "image",
    imageSrc: photo("/media/cases/offside-square.png").src,
    mediaWidth: photo("/media/cases/offside-square.png").width,
    mediaHeight: photo("/media/cases/offside-square.png").height,
    mediaAlt: photo("/media/cases/offside-square.png").alt,
    similarCaseIds: ["offside-no-impact"],
    educatorBody:
      "Position first, then ask whether the offside player actually changed the challenge. Proximity can be enough.",
    refereeBody:
      "I would check with the assistant on involvement, not only on the freeze of the pass.",
    alternativeBody:
      "If the offside attacker stays still and away from the duel, I would award the goal despite the offside position.",
    ruleCitation: "Law 11 concept: interfering with an opponent",
    publisherSeed: "offside-line-of-vision",
  }),

  buildCase({
    id: "offside-no-impact",
    slug: "offside-position-away-from-play",
    title: "Does offside position alone create an offence?",
    prompt: "An attacker is confirmed offside. Does that position constitute an active offence?",
    description:
      "An attacker is in an offside position at the moment of the pass. The attacker does not touch the ball, challenge an opponent, or obstruct the goalkeeper before a teammate finishes.",
    competitionLevel: "College club",
    difficulty: "intermediate",
    category: "Offside interference",
    originalDecision: "Offside offence",
    answerOptions: offsideOptions,
    recommendedDecision: "goal-awarded",
    expertExplanation:
      "Being in an offside position is not an offence by itself when there is no involvement.",
    ruleReference: "Law 11 concept: offside position and offence",
    rulePath: ["Law 11", "Offside", "Interfering with an opponent"],
    factors: [
      factor("position", "Position at pass", "Offside position", true, "Position triggers the involvement check."),
      factor("line-of-vision", "Line of vision", "Clear", true, "Outside the goalkeeper's sightline."),
      factor("challenge", "Challenge for ball", "None", true, "No nearby opponent is challenged."),
      factor("opponent-impact", "Opponent impact", "None", true, "No opponent response is caused."),
      factor("touch", "Ball touch", "No touch", true, "The attacker does not play the ball."),
    ],
    criticalFactor: "opponent-impact",
    communityDistribution: makeDistribution("Authored demo: community pattern", {
      "goal-awarded": 61, "offside-indirect-free-kick": 29, "attacking-foul-direct-free-kick": 2, "insufficient-evidence": 8,
    }),
    verifiedDistribution: makeDistribution("Authored demo: reviewer pattern", {
      "goal-awarded": 83, "offside-indirect-free-kick": 12, "attacking-foul-direct-free-kick": 1, "insufficient-evidence": 4,
    }),
    learnerDistribution: makeDistribution("Authored demo: learner pattern", {
      "goal-awarded": 52, "offside-indirect-free-kick": 36, "attacking-foul-direct-free-kick": 3, "insufficient-evidence": 9,
    }),
    disagreementScore: 0.49,
    freshnessScore: 0.73,
    publishedAt: "2026-06-15T13:20:00.000Z",
    mediaKind: "image",
    imageSrc: photo("/media/cases/offside-no-impact.png").src,
    mediaWidth: photo("/media/cases/offside-no-impact.png").width,
    mediaHeight: photo("/media/cases/offside-no-impact.png").height,
    mediaAlt: photo("/media/cases/offside-no-impact.png").alt,
    similarCaseIds: ["offside-line-of-vision"],
    educatorBody:
      "Technology can confirm position. You still have to answer whether involvement exists. Here every check is empty.",
    refereeBody:
      "Keep the flag down and award the goal. Explain that position alone is not an offence.",
    alternativeBody:
      "If the attacker even briefly screens the keeper while the shot is struck, I would reverse to offside.",
    ruleCitation: "Law 11 concept: offside position and offence",
    publisherSeed: "offside-no-impact",
  }),

  buildCase({
    id: "dogso-central-breakaway",
    slug: "central-breakaway-pulled-back",
    title: "Is this central hold DOGSO or only SPA?",
    prompt: "What disciplinary sanction fits a deliberate hold on a central run toward goal?",
    description:
      "An attacker drives centrally toward goal and is held by a defender just outside the penalty area. Only the goalkeeper is ahead, and the nearest covering defender is positioned wide.",
    competitionLevel: "Open-age amateur",
    difficulty: "advanced",
    category: "Denial of an obvious goal-scoring opportunity",
    originalDecision: "Direct free kick and yellow card",
    answerOptions: dogsoOptions,
    recommendedDecision: "direct-free-kick-red",
    expertExplanation:
      "Central direction, control of the ball, and thin cover support DOGSO.",
    ruleReference: "Law 12 concept: denial of an obvious goal-scoring opportunity",
    rulePath: ["Law 12", "Disciplinary action", "Denial of an obvious goal-scoring opportunity"],
    factors: [
      factor("distance-to-goal", "Distance to goal", "About 22 metres", true, "Close enough for the opportunity analysis."),
      factor("direction", "Direction of play", "Central toward goal", true, "Moving toward goal rather than away."),
      factor("ball-control", "Likelihood of control", "High", true, "The attacker has the ball under control."),
      factor("defenders", "Covering defenders", "One, wide", true, "Cover cannot intervene in time."),
      factor("foul-type", "Foul type", "Pull-back", true, "The deliberate foul ends the opportunity."),
    ],
    criticalFactor: "defenders",
    communityDistribution: makeDistribution("Authored demo: community pattern", {
      "play-on": 2, "direct-free-kick-no-card": 5, "direct-free-kick-yellow": 39, "direct-free-kick-red": 54,
    }),
    verifiedDistribution: makeDistribution("Authored demo: reviewer pattern", {
      "play-on": 0, "direct-free-kick-no-card": 2, "direct-free-kick-yellow": 23, "direct-free-kick-red": 75,
    }),
    learnerDistribution: makeDistribution("Authored demo: learner pattern", {
      "play-on": 3, "direct-free-kick-no-card": 8, "direct-free-kick-yellow": 46, "direct-free-kick-red": 43,
    }),
    disagreementScore: 0.57,
    freshnessScore: 0.68,
    publishedAt: "2026-06-10T20:10:00.000Z",
    mediaKind: "image",
    imageSrc: photo("/media/cases/dogso-landscape.png").src,
    mediaWidth: photo("/media/cases/dogso-landscape.png").width,
    mediaHeight: photo("/media/cases/dogso-landscape.png").height,
    mediaAlt: photo("/media/cases/dogso-landscape.png").alt,
    educatorBody:
      "Run the four DOGSO checks. Wide cover only counts if that defender can actually arrive before a shot.",
    refereeBody:
      "I would show red, restart quickly, and look to the assistant for the covering defender's real position.",
    alternativeBody:
      "If the covering defender is closer than this framing suggests, I could still land on yellow for SPA.",
    ruleCitation: "Law 12 concept: denial of an obvious goal-scoring opportunity",
    publisherSeed: "dogso-central-breakaway",
  }),

  buildCase({
    id: "dogso-wide-channel",
    slug: "wide-channel-hold",
    title: "Is a wide tactical hold DOGSO or SPA?",
    prompt: "Is a tactical hold on the wing denial of an obvious goal-scoring opportunity, or only stopping a promising attack?",
    description:
      "An attacker is pulled back on the right touchline about 30 metres from goal. One covering defender is recovering centrally. The chance is promising but not clearly goal-bound.",
    competitionLevel: "Adult recreational",
    difficulty: "intermediate",
    category: "Denial of an obvious goal-scoring opportunity",
    originalDecision: "Yellow card",
    answerOptions: dogsoOptions,
    recommendedDecision: "direct-free-kick-yellow",
    expertExplanation:
      "Wide location and recovering cover lean SPA rather than DOGSO.",
    ruleReference: "Law 12 concept: stopping a promising attack",
    rulePath: ["Law 12", "Disciplinary action", "Stopping a promising attack"],
    factors: [
      factor("distance-to-goal", "Distance to goal", "About 30 metres", true, "Still far for DOGSO."),
      factor("direction", "Direction of play", "Toward corner / wide", true, "Not central."),
      factor("ball-control", "Likelihood of control", "High", true, "Attacker had the ball."),
      factor("defenders", "Covering defenders", "One recovering centrally", true, "Cover exists."),
      factor("foul-type", "Foul type", "Hold", true, "Tactical foul."),
    ],
    criticalFactor: "direction",
    communityDistribution: makeDistribution("Authored demo: community pattern", {
      "play-on": 2, "direct-free-kick-no-card": 8, "direct-free-kick-yellow": 64, "direct-free-kick-red": 26,
    }),
    verifiedDistribution: makeDistribution("Authored demo: reviewer pattern", {
      "play-on": 0, "direct-free-kick-no-card": 4, "direct-free-kick-yellow": 78, "direct-free-kick-red": 18,
    }),
    learnerDistribution: makeDistribution("Authored demo: learner pattern", {
      "play-on": 3, "direct-free-kick-no-card": 10, "direct-free-kick-yellow": 55, "direct-free-kick-red": 32,
    }),
    disagreementScore: 0.5,
    freshnessScore: 0.88,
    publishedAt: "2026-07-02T21:00:00.000Z",
    mediaKind: "text",
    mediaAlt: "Text-only teaching prompt: wide-channel hold near the touchline",
    educatorBody:
      "Wide channel plus recovering cover usually means yellow for SPA, not red for DOGSO.",
    refereeBody:
      "I sell the yellow as tactical, restart quickly, and avoid getting pulled into a red-card debate.",
    alternativeBody:
      "If the attacker had already cut inside onto goal with no realistic cover, I would upgrade to DOGSO.",
    ruleCitation: "Law 12 concept: stopping a promising attack",
    alternateOptionId: "direct-free-kick-red",
    publisherSeed: "dogso-wide-channel",
  }),

  buildCase({
    id: "advantage-quick-breakdown",
    slug: "advantage-breaks-down-immediately",
    title: "Can you bring play back after advantage fails?",
    prompt: "Can the referee return to the original foul after the apparent advantage fails immediately?",
    description:
      "A midfielder is fouled but releases a pass to a nearby teammate. The referee signals advantage; about one second later the teammate miscontrols under immediate pressure and possession is lost.",
    competitionLevel: "Youth U19 elite",
    difficulty: "advanced",
    category: "Advantage",
    originalDecision: "Play continued",
    answerOptions: advantageOptions,
    recommendedDecision: "return-original-foul",
    expertExplanation:
      "When advantage never materializes and breaks down immediately, return to the original foul.",
    ruleReference: "Law 5 concept: advantage",
    rulePath: ["Law 5", "Powers and duties", "Advantage"],
    factors: [
      factor("time-elapsed", "Time elapsed", "About one second", true, "The decision window remains very short."),
      factor("possession", "Possession", "Immediately lost", true, "No useful attacking phase is retained."),
      factor("pressure", "Opponent pressure", "Immediate", true, "Pressure contributes to the failed benefit."),
      factor("space", "Attacking space", "Limited", true, "The receiver has little room to exploit."),
      factor("severity", "Original foul severity", "Careless", true, "The original offence remains available."),
    ],
    criticalFactor: "time-elapsed",
    communityDistribution: makeDistribution("Authored demo: community pattern", {
      "continue-play": 31, "return-original-foul": 57, "drop-ball": 4, "insufficient-evidence": 8,
    }),
    verifiedDistribution: makeDistribution("Authored demo: reviewer pattern", {
      "continue-play": 19, "return-original-foul": 74, "drop-ball": 1, "insufficient-evidence": 6,
    }),
    learnerDistribution: makeDistribution("Authored demo: learner pattern", {
      "continue-play": 38, "return-original-foul": 49, "drop-ball": 5, "insufficient-evidence": 8,
    }),
    disagreementScore: 0.66,
    freshnessScore: 0.95,
    publishedAt: "2026-07-06T17:05:00.000Z",
    mediaKind: "text",
    mediaAlt: "Text-only teaching prompt: advantage that breaks down after one pass",
    educatorBody:
      "Advantage is a short door. If it dies in the next beat, bring the foul back. Timing is the whole call.",
    refereeBody:
      "Use a loud voice, bring it back cleanly, and make sure both teams understand why play is returning.",
    alternativeBody:
      "If the receiver had a clear touch into space before losing the ball, I might live with the advantage and play on.",
    ruleCitation: "Law 5 concept: advantage",
    publisherSeed: "advantage-quick-breakdown",
  }),

  buildCase({
    id: "advantage-clear-benefit",
    slug: "advantage-clear-benefit",
    title: "Should you still caution after a successful advantage?",
    prompt: "Should the referee still issue a caution after playing advantage that leads to a shot?",
    description:
      "A reckless challenge is ignored for advantage. The fouled team immediately creates a shot on target that is saved. Play continues from the rebound, and the original foul still requires disciplinary action at the next stoppage.",
    competitionLevel: "Youth U19 elite",
    difficulty: "intermediate",
    category: "Advantage",
    originalDecision: "Advantage applied, then yellow at next stoppage",
    answerOptions: advantageOptions,
    recommendedDecision: "continue-play",
    expertExplanation:
      "A clear attacking benefit means advantage stands; the caution can wait for the next stoppage.",
    ruleReference: "Law 5 concept: advantage",
    rulePath: ["Law 5", "Powers and duties", "Advantage"],
    factors: [
      factor("time-elapsed", "Time elapsed", "Immediate", true, "Benefit appears at once."),
      factor("possession", "Possession", "Retained into a shot", true, "Clear attacking outcome."),
      factor("pressure", "Opponent pressure", "Beaten", true, "Advantage materialized."),
      factor("space", "Attacking space", "Shot created", true, "Useful attacking phase."),
      factor("severity", "Original foul severity", "Reckless", true, "Card still due later."),
    ],
    criticalFactor: "possession",
    communityDistribution: makeDistribution("Authored demo: community pattern", {
      "continue-play": 70, "return-original-foul": 18, "drop-ball": 3, "insufficient-evidence": 9,
    }),
    verifiedDistribution: makeDistribution("Authored demo: reviewer pattern", {
      "continue-play": 86, "return-original-foul": 8, "drop-ball": 1, "insufficient-evidence": 5,
    }),
    learnerDistribution: makeDistribution("Authored demo: learner pattern", {
      "continue-play": 61, "return-original-foul": 26, "drop-ball": 4, "insufficient-evidence": 9,
    }),
    disagreementScore: 0.34,
    freshnessScore: 0.87,
    publishedAt: "2026-06-30T12:35:00.000Z",
    mediaKind: "video",
    videoSrc: video(3).videoSrc,
    posterSrc: video(3).posterSrc,
    mediaWidth: video(3).width,
    mediaHeight: video(3).height,
    mediaAlt: video(3).alt,
    educatorBody:
      "When the benefit is obvious, keep playing, then come back for the card at the next stoppage.",
    refereeBody:
      "I shout that I saw the foul so the offender knows the caution is coming when play next stops.",
    alternativeBody:
      "If the shot was forced and possession never really improved, I would have brought the foul back instead.",
    ruleCitation: "Law 5 concept: advantage",
    publisherSeed: "advantage-clear-benefit",
  }),

  buildCase({
    id: "simulation-initiated-contact",
    slug: "attacker-initiates-contact",
    title: "Is this a penalty or simulation?",
    prompt: "Is this contact a penalty, play on, or simulation?",
    description:
      "An attacker moves past a defender in the penalty area, extends a leg sideways toward the defender's planted leg, then falls while appealing. The defender makes no additional movement into the path.",
    competitionLevel: "Semi-professional development",
    difficulty: "advanced",
    category: "Simulation",
    originalDecision: "Penalty kick",
    answerOptions: simulationOptions,
    recommendedDecision: "indirect-free-kick-yellow-simulation",
    expertExplanation:
      "The attacker appears to create the contact. Treat it as an attempt to deceive unless another angle shows otherwise.",
    ruleReference: "Law 12 concept: unsporting behaviour and simulation",
    rulePath: ["Law 12", "Disciplinary action", "Unsporting behaviour", "Simulation"],
    factors: [
      factor("initiator", "Contact initiator", "Attacker", true, "The attacker changes the leg path toward the defender."),
      factor("defender-movement", "Defender movement", "Planted", true, "The defender does not step into the path."),
      factor("fall-pattern", "Fall pattern", "Delayed", true, "The fall follows the leg extension."),
      factor("ball-path", "Ball path", "Moving away", true, "The attacker is losing access to the ball."),
      factor("evidence-certainty", "View certainty", "Single authored angle", false, "A real decision would prefer another view."),
    ],
    criticalFactor: "initiator",
    communityDistribution: makeDistribution("Authored demo: community pattern", {
      "penalty-kick": 29, "play-on": 24, "indirect-free-kick-yellow-simulation": 39, "insufficient-evidence": 8,
    }),
    verifiedDistribution: makeDistribution("Authored demo: reviewer pattern", {
      "penalty-kick": 13, "play-on": 22, "indirect-free-kick-yellow-simulation": 57, "insufficient-evidence": 8,
    }),
    learnerDistribution: makeDistribution("Authored demo: learner pattern", {
      "penalty-kick": 35, "play-on": 25, "indirect-free-kick-yellow-simulation": 31, "insufficient-evidence": 9,
    }),
    disagreementScore: 0.82,
    freshnessScore: 0.87,
    publishedAt: "2026-06-28T19:40:00.000Z",
    mediaKind: "text",
    mediaAlt: "Text-only teaching prompt: attacker extends a leg toward a planted defender",
    educatorBody:
      "Only sell simulation if you saw the attacker create the contact. If unsure, drop the confidence rather than auto-labelling.",
    refereeBody:
      "Do not guess from the appeal. Watch the defender's feet and the attacker's leg path before showing the card.",
    alternativeBody:
      "If the defender's trailing foot actually clips the attacker, I would award the penalty instead.",
    ruleCitation: "Law 12 concept: simulation",
    publisherSeed: "simulation-initiated-contact",
  }),

  buildCase({
    id: "goalkeeper-deliberate-kick",
    slug: "goalkeeper-handles-deliberate-kick",
    title: "What restart follows a deliberate back-pass?",
    prompt: "What restart follows after the goalkeeper handles a deliberate kick from a teammate?",
    description:
      "A defender under pressure makes a sliding clearance, directing the ball deliberately with the foot back toward their goalkeeper. With no opponent pressure on the goalkeeper, the keeper collects it with both hands inside the penalty area.",
    competitionLevel: "Youth U15 academy",
    difficulty: "beginner",
    category: "Goalkeeper handling",
    originalDecision: "Play on",
    answerOptions: goalkeeperOptions,
    recommendedDecision: "indirect-free-kick",
    expertExplanation:
      "A deliberate kick from a teammate that the goalkeeper handles is an indirect free kick.",
    ruleReference: "Law 12 concept: goalkeeper handling restrictions",
    rulePath: ["Law 12", "Indirect free kicks", "Goalkeeper handling restriction"],
    factors: [
      factor("teammate-action", "Teammate action", "Deliberate kick", true, "The teammate intentionally plays the ball with the foot."),
      factor("body-part", "Body part used", "Foot", true, "The teammate action is a kick."),
      factor("goalkeeper-action", "Goalkeeper action", "Handles ball", true, "The goalkeeper uses a hand after the pass."),
      factor("pressure", "Opponent pressure", "None", true, "No emergency clearance ambiguity."),
      factor("trick", "Deliberate trick", "None", false, "No separate trick scenario is part of this case."),
    ],
    criticalFactor: "teammate-action",
    communityDistribution: makeDistribution("Authored demo: community pattern", {
      "play-on": 12, "indirect-free-kick": 72, "direct-free-kick": 10, "penalty-kick": 6,
    }),
    verifiedDistribution: makeDistribution("Authored demo: reviewer pattern", {
      "play-on": 3, "indirect-free-kick": 91, "direct-free-kick": 4, "penalty-kick": 2,
    }),
    learnerDistribution: makeDistribution("Authored demo: learner pattern", {
      "play-on": 18, "indirect-free-kick": 63, "direct-free-kick": 12, "penalty-kick": 7,
    }),
    disagreementScore: 0.27,
    freshnessScore: 0.79,
    publishedAt: "2026-06-20T10:25:00.000Z",
    mediaKind: "image",
    imageSrc: photo("/media/cases/goalkeeper-tall.png").src,
    mediaWidth: photo("/media/cases/goalkeeper-tall.png").width,
    mediaHeight: photo("/media/cases/goalkeeper-tall.png").height,
    mediaAlt: photo("/media/cases/goalkeeper-tall.png").alt,
    educatorBody:
      "Judge the teammate's body action, not how pretty the pass looked. A deliberate kick back that is handled is an indirect free kick.",
    refereeBody:
      "Stop play, signal the indirect free kick clearly, and manage the wall before the restart.",
    alternativeBody:
      "If the clearance was a pure deflection off the defender rather than a deliberate kick, I would allow the handling.",
    ruleCitation: "Law 12 concept: goalkeeper handling restrictions",
    publisherSeed: "goalkeeper-deliberate-kick",
  }),

  buildCase({
    id: "dissent-persistent-complaint",
    slug: "dissent-persistent-complaint",
    title: "When does public complaint become a caution?",
    prompt: "Has this public complaint crossed from management into a yellow card for dissent?",
    description:
      "After a throw-in decision goes against the home team, a captain repeatedly approaches the referee, shouts that the call is a joke, and continues the complaint after being told to return to play.",
    competitionLevel: "Adult recreational",
    difficulty: "intermediate",
    category: "Dissent / misconduct",
    originalDecision: "Verbal warning",
    answerOptions: misconductOptions,
    recommendedDecision: "yellow-dissent",
    expertExplanation:
      "Public, persistent protest after a clear warning supports a caution for dissent.",
    ruleReference: "Law 12 concept: dissent by word or action",
    rulePath: ["Law 12", "Disciplinary action", "Dissent"],
    factors: [
      factor("public", "Public nature", "In front of players", true, "Complaint is visible and audible."),
      factor("persistence", "Persistence", "Continues after warning", true, "Management step already used."),
      factor("language", "Language", "Shows dissent", true, "Words challenge the referee's authority."),
      factor("impact", "Match impact", "Delays restart", true, "Complaint holds up play."),
      factor("role", "Player role", "Captain", false, "Leadership role does not excuse dissent."),
    ],
    criticalFactor: "persistence",
    communityDistribution: makeDistribution("Authored demo: community pattern", {
      "verbal-warning": 22, "yellow-dissent": 58, "yellow-usb": 12, "red-offensive": 3, "insufficient-evidence": 5,
    }),
    verifiedDistribution: makeDistribution("Authored demo: reviewer pattern", {
      "verbal-warning": 10, "yellow-dissent": 74, "yellow-usb": 10, "red-offensive": 2, "insufficient-evidence": 4,
    }),
    learnerDistribution: makeDistribution("Authored demo: learner pattern", {
      "verbal-warning": 28, "yellow-dissent": 49, "yellow-usb": 14, "red-offensive": 4, "insufficient-evidence": 5,
    }),
    disagreementScore: 0.44,
    freshnessScore: 0.9,
    publishedAt: "2026-07-08T15:10:00.000Z",
    mediaKind: "text",
    mediaAlt: "Text-only teaching prompt: captain continues public dissent after a warning",
    educatorBody:
      "One warning is management. Continuing the protest in public is dissent. Show the card and restart.",
    refereeBody:
      "I would isolate the captain, show yellow, and get the throw-in taken before the argument spreads.",
    alternativeBody:
      "If the language stayed private and stopped immediately after the warning, I might still manage without a card.",
    ruleCitation: "Law 12 concept: dissent by word or action",
    publisherSeed: "dissent-persistent-complaint",
  }),

  buildCase({
    id: "holding-box-shirt-pull",
    slug: "penalty-area-shirt-hold",
    title: "Is this shirt hold inside the box a penalty?",
    prompt: "Does a clear shirt hold at a corner require a penalty kick?",
    description:
      "At a corner kick, an attacker and defender wrestle near the penalty spot. The defender grabs and holds the attacker's shirt, preventing a jump as the ball arrives in the six-yard area.",
    competitionLevel: "Open-age amateur",
    difficulty: "intermediate",
    category: "Penalty area holding",
    originalDecision: "Play on",
    answerOptions: holdingOptions,
    recommendedDecision: "penalty-kick",
    expertExplanation:
      "A clear shirt hold that prevents a challenge for the ball inside the area is a penalty.",
    ruleReference: "Law 12 concept: holding an opponent",
    rulePath: ["Law 12", "Fouls and misconduct", "Holding an opponent"],
    factors: [
      factor("hold", "Holding action", "Shirt grab", true, "Clear restriction of movement."),
      factor("location", "Location", "Inside penalty area", true, "Restart is a penalty if penalized."),
      factor("impact", "Impact on play", "Prevents jump", true, "Attacker cannot contest the ball."),
      factor("mutual", "Mutual holding", "Defender initiates", true, "Not balanced wrestling."),
      factor("ball-arrival", "Ball arrival", "Into the area", true, "Hold occurs as the ball becomes playable."),
    ],
    criticalFactor: "hold",
    communityDistribution: makeDistribution("Authored demo: community pattern", {
      "play-on": 18, "direct-free-kick": 4, "penalty-kick": 62, "penalty-yellow": 10, "insufficient-evidence": 6,
    }),
    verifiedDistribution: makeDistribution("Authored demo: reviewer pattern", {
      "play-on": 8, "direct-free-kick": 2, "penalty-kick": 78, "penalty-yellow": 8, "insufficient-evidence": 4,
    }),
    learnerDistribution: makeDistribution("Authored demo: learner pattern", {
      "play-on": 24, "direct-free-kick": 5, "penalty-kick": 54, "penalty-yellow": 11, "insufficient-evidence": 6,
    }),
    disagreementScore: 0.48,
    freshnessScore: 0.86,
    publishedAt: "2026-07-07T11:40:00.000Z",
    mediaKind: "text",
    mediaAlt: "Text-only teaching prompt: shirt hold at a corner inside the penalty area",
    educatorBody:
      "Mutual jostling is common at corners. A clear shirt grab that stops the jump is holding and a penalty.",
    refereeBody:
      "Point to the spot early, explain the hold briefly, and manage both boxes before the kick.",
    alternativeBody:
      "If both players are equally wrapped up and neither has a clear advantage, I could still play on.",
    ruleCitation: "Law 12 concept: holding an opponent",
    publisherSeed: "holding-box-shirt-pull",
  }),

  buildCase({
    id: "restart-quick-free-kick",
    slug: "quick-free-kick-ceremony",
    title: "Was this quick free kick taken correctly?",
    prompt: "May the attacking team take a quick free kick before the referee has finished ceremony?",
    description:
      "After a foul outside the area, the referee is still managing the wall and has not given a signal to restart. An attacker plays the free kick quickly into the box and a teammate scores.",
    competitionLevel: "College club",
    difficulty: "advanced",
    category: "Restart procedure",
    originalDecision: "Goal awarded",
    answerOptions: restartOptions,
    recommendedDecision: "retake",
    expertExplanation:
      "Once the referee has begun ceremony or clearly delayed the restart, the kick cannot be taken until the signal is given.",
    ruleReference: "Law 13 concept: free kick procedure",
    rulePath: ["Law 13", "Free kicks", "Procedure"],
    factors: [
      factor("signal", "Referee signal", "Not given", true, "Ceremony is incomplete."),
      factor("ceremony", "Ceremony started", "Wall being managed", true, "Referee is actively delaying."),
      factor("ball-placement", "Ball placement", "Correct spot", true, "Location itself is fine."),
      factor("opponents", "Opponent distance", "Wall not set", true, "Defenders are still being managed."),
      factor("goal", "Resulting goal", "Scored", true, "Outcome does not validate the restart."),
    ],
    criticalFactor: "signal",
    communityDistribution: makeDistribution("Authored demo: community pattern", {
      "retake": 57, "play-continues": 28, "indirect-free-kick": 5, "drop-ball": 3, "insufficient-evidence": 7,
    }),
    verifiedDistribution: makeDistribution("Authored demo: reviewer pattern", {
      "retake": 78, "play-continues": 14, "indirect-free-kick": 2, "drop-ball": 1, "insufficient-evidence": 5,
    }),
    learnerDistribution: makeDistribution("Authored demo: learner pattern", {
      "retake": 49, "play-continues": 34, "indirect-free-kick": 6, "drop-ball": 3, "insufficient-evidence": 8,
    }),
    disagreementScore: 0.52,
    freshnessScore: 0.83,
    publishedAt: "2026-07-05T09:20:00.000Z",
    mediaKind: "text",
    mediaAlt: "Text-only teaching prompt: quick free kick taken during referee ceremony",
    educatorBody:
      "If you have started managing the wall, the restart waits for your signal. A goal from an early kick cannot stand.",
    refereeBody:
      "Disallow the goal, order the retake, and make the signal obvious before play resumes.",
    alternativeBody:
      "If I had never started ceremony and play was clearly left quick, I would allow the goal to stand.",
    ruleCitation: "Law 13 concept: free kick procedure",
    publisherSeed: "restart-quick-free-kick",
  }),
];
