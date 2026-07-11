import {
  CASE_SCHEMA_VERSION,
  DECISION_CODES,
  type DecisionCode,
  type DecisionOption,
  type ExpertReasoningFixture,
  type MediaReference,
  type RefereeCase,
  type SeededDistributions,
} from "../domain/referee-case.ts";

export const DEMO_CASE_ID = "soccer-handball-001" as const;
export const DEMO_COMPARISON_CASE_ID = "soccer-handball-002" as const;

export const DECISION_OPTIONS: readonly DecisionOption[] = [
  { code: "no-offence", label: "No handball offence" },
  { code: "penalty-no-card", label: "Penalty, no card" },
  { code: "penalty-yellow-card", label: "Penalty, yellow card" },
  { code: "penalty-red-card", label: "Penalty, red card" },
];

const RULE_SOURCE = {
  publisher: "The IFAB",
  document: "Laws of the Game",
  edition: "2026/27",
  law: "Law 12 — Fouls and Misconduct",
  sections: [
    "Handling the ball",
    "Cautions for unsporting behaviour",
    "Sending-off offences",
  ],
  sourceUrl: "https://www.theifab.com/laws/latest/fouls-and-misconduct/",
  accessedOn: "2026-07-10",
  verificationStatus: "official-source-checked",
  wordingPolicy: "clearcall-paraphrase-not-official-quotation",
} as const;

const COMMON_CASE_FIELDS = {
  schemaVersion: CASE_SCHEMA_VERSION,
  sport: "soccer",
  competitionContext:
    "Adult association football under IFAB Laws of the Game 2026/27",
  incidentCategory: "handball",
  difficulty: "hard",
  availableDecisions: DECISION_OPTIONS,
  ruleSource: RULE_SOURCE,
  publisherType: "clearcall-original-synthetic-scenario",
  verificationStatus: "rule-source-checked-domain-review-pending",
  confidenceCalibration: {
    enabled: true,
    prompt: "How confident are you in this call?",
    suggestedBands: [25, 50, 75, 100],
    feedbackFocus:
      "Compare stated confidence with the fixture recommendation; never treat community popularity as correctness.",
  },
} as const;

function distribution(
  community: Readonly<Record<DecisionCode, number>>,
  verifiedReferees: Readonly<Record<DecisionCode, number>>,
): SeededDistributions {
  return {
    provenance: "synthetic-demo-fixture",
    label: "Simulated demo data",
    disclaimer:
      "Simulated demo data — not live community results, not an expert survey, and not an official ruling.",
    community: {
      cohortLabel: "Simulated community cohort",
      sampleSize: 100,
      counts: community,
    },
    verifiedReferees: {
      cohortLabel: "Simulated verified-referee cohort",
      sampleSize: 100,
      counts: verifiedReferees,
    },
  };
}

function media(altText: string, shotList: readonly string[]): MediaReference {
  return {
    assetStatus: "recording-required",
    mediaType: "original-staged-video",
    authorizationStatus: "not-created",
    localPath: null,
    sourceUrl: null,
    altText,
    shotList,
  };
}

function editorialReasoning(
  summary: string,
  alternativeView: string,
): ExpertReasoningFixture {
  return {
    status: "editorial-fixture-expert-review-pending",
    reviewer: null,
    summary,
    alternativeView,
    disclosure:
      "ClearCall-authored fixture reasoning, paraphrased from the cited rule source. No expert identity or endorsement is claimed; qualified referee review is pending.",
  };
}

function counts(
  noOffence: number,
  penaltyNoCard: number,
  penaltyYellowCard: number,
  penaltyRedCard: number,
): Readonly<Record<DecisionCode, number>> {
  return {
    [DECISION_CODES[0]]: noOffence,
    [DECISION_CODES[1]]: penaltyNoCard,
    [DECISION_CODES[2]]: penaltyYellowCard,
    [DECISION_CODES[3]]: penaltyRedCard,
  };
}

export const refereeCases = [
  {
    ...COMMON_CASE_FIELDS,
    id: DEMO_CASE_ID,
    scenarioFingerprint: "defender-deliberate-hand-goal-line-dogso",
    title: "The Goal-Line Reach",
    incidentSubcategory: "deliberate handball denying a goal",
    scenarioType: "objective",
    learningLevel: "advanced",
    shortPrompt:
      "A defender deliberately reaches toward a goal-bound shot inside the penalty area. Penalty — and which card?",
    scenario:
      "With the goalkeeper beaten, an outfield defender on the goal line moves an arm toward a shot that is entering the goal and knocks it away. The ball remains in play and no goal is scored.",
    recommendedDecisionCode: "penalty-red-card",
    recommendedOutcome: {
      restart: "penalty-kick",
      disciplinaryAction: "red-card",
      confidence: "high",
      basisStatus: "editorial-demo-recommendation",
    },
    ruleFactors: [
      {
        id: "deliberate-movement",
        label: "Deliberate movement",
        observation: "The defender moves the arm toward the ball.",
        relevance: "supports-offence",
      },
      {
        id: "goal-bound",
        label: "Goal denied",
        observation:
          "The shot is entering an unguarded goal until the contact.",
        relevance: "disciplinary",
      },
      {
        id: "defender-location",
        label: "Inside penalty area",
        observation:
          "The outfield defender commits the offence inside their own penalty area.",
        relevance: "supports-offence",
      },
    ],
    reasoningPath: [
      {
        order: 1,
        factorIds: ["deliberate-movement"],
        conclusion:
          "Deliberate hand-to-ball movement establishes a handball offence.",
      },
      {
        order: 2,
        factorIds: ["defender-location"],
        conclusion:
          "A direct-free-kick offence here restarts with a penalty kick.",
      },
      {
        order: 3,
        factorIds: ["goal-bound"],
        conclusion:
          "Deliberate handball denied a goal, so the disciplinary recommendation is a red card.",
      },
    ],
    plainLanguageExplanation:
      "The defender intentionally used an arm to stop a ball that was going into the goal. The fixture recommendation is a penalty and red card; the restart and the sanction are separate parts of the call.",
    learningObjective:
      "Separate the penalty restart from the disciplinary sanction for deliberate handball that denies a goal.",
    alternativeInterpretations: [
      {
        decisionCode: "penalty-yellow-card",
        rationale:
          "A viewer may believe the arm contact was non-deliberate and resulted only from an unjustified blocking position.",
        evidenceThatWouldChangeCall:
          "A clear side angle showing no movement toward the ball would shift the disciplinary analysis toward non-deliberate handball.",
      },
    ],
    expertReasoning: editorialReasoning(
      "The decisive sequence is deliberate arm movement, an offence inside the penalty area, and denial of a goal.",
      "If the movement were not deliberate, the offence could still be penalized for making the body unnaturally bigger, but the card analysis would change.",
    ),
    tags: ["demo", "dogso", "deliberate-handball", "goal-line", "law-12"],
    relatedCaseIds: [DEMO_COMPARISON_CASE_ID],
    media: media(
      "Staged goal-line view of a defender reaching toward a goal-bound shot.",
      [
        "Wide shot showing the goalkeeper beaten and the ball travelling toward goal.",
        "Goal-line angle showing the defender's arm move toward the ball.",
        "Freeze frame at contact with ball-path and arm-movement overlays.",
      ],
    ),
    seededDistributions: distribution(
      counts(10, 15, 20, 55),
      counts(2, 5, 11, 82),
    ),
    discussionPrompt:
      "Which visual fact distinguishes deliberate denial of a goal from a non-deliberate handball offence?",
  },
  {
    ...COMMON_CASE_FIELDS,
    id: DEMO_COMPARISON_CASE_ID,
    scenarioFingerprint: "defender-unnatural-arm-goal-line-nondeliberate-dogso",
    title: "The Unnatural Block",
    incidentSubcategory: "non-deliberate handball denying a goal",
    scenarioType: "interpretive",
    learningLevel: "advanced",
    shortPrompt:
      "A defender's outstretched arm blocks a goal-bound shot without moving toward it. Penalty — and which card?",
    scenario:
      "An outfield defender turns to block a close shot inside the penalty area. The arm is extended away from the body in a position not justified by that movement. The shot hits the arm and would otherwise enter the goal.",
    recommendedDecisionCode: "penalty-yellow-card",
    recommendedOutcome: {
      restart: "penalty-kick",
      disciplinaryAction: "yellow-card",
      confidence: "high",
      basisStatus: "editorial-demo-recommendation",
    },
    ruleFactors: [
      {
        id: "no-hand-to-ball",
        label: "No deliberate reach",
        observation: "The arm does not move toward the ball.",
        relevance: "supports-no-offence",
      },
      {
        id: "unnatural-position",
        label: "Body made unnaturally bigger",
        observation:
          "The arm is extended beyond what the blocking movement justifies.",
        relevance: "supports-offence",
      },
      {
        id: "goal-denied-nondeliberate",
        label: "Goal denied by non-deliberate offence",
        observation: "The contact stops a shot that is entering the goal.",
        relevance: "disciplinary",
      },
    ],
    reasoningPath: [
      {
        order: 1,
        factorIds: ["no-hand-to-ball", "unnatural-position"],
        conclusion:
          "The offence rests on unjustified body enlargement, not deliberate hand-to-ball movement.",
      },
      {
        order: 2,
        factorIds: ["goal-denied-nondeliberate"],
        conclusion:
          "For this non-deliberate handball DOGSO with a penalty, the fixture recommendation is a yellow card.",
      },
    ],
    plainLanguageExplanation:
      "This looks similar to the deliberate goal-line reach, but the arm does not move toward the ball. The penalty remains; under the cited edition, the non-deliberate nature changes the recommended card from red to yellow.",
    learningObjective:
      "Compare deliberate and non-deliberate handball DOGSO outcomes using one changed factor.",
    alternativeInterpretations: [
      {
        decisionCode: "no-offence",
        rationale:
          "The arm position may be a natural consequence of turning to block the shot.",
        evidenceThatWouldChangeCall:
          "A wider angle showing the arm tight to, or naturally supporting, the body would support no offence.",
      },
    ],
    expertReasoning: editorialReasoning(
      "The extended arm is treated as unjustified body enlargement, while the absence of a deliberate reach controls the disciplinary distinction.",
      "If the position were justified by the movement, there would be no handball offence despite the goal-bound shot.",
    ),
    tags: [
      "comparison",
      "dogso",
      "non-deliberate-handball",
      "goal-line",
      "law-12",
    ],
    relatedCaseIds: [DEMO_CASE_ID],
    media: media(
      "Staged side view of a defender turning with an arm extended into a goal-bound shot.",
      [
        "Match the camera and player positions used for soccer-handball-001.",
        "Keep the arm stationary and visibly away from the torso before the shot.",
        "Freeze frame comparing deliberate movement versus pre-existing arm position.",
      ],
    ),
    seededDistributions: distribution(
      counts(18, 12, 52, 18),
      counts(5, 5, 82, 8),
    ),
    discussionPrompt:
      "Why does the same penalty restart produce a different card from soccer-handball-001?",
  },
  {
    ...COMMON_CASE_FIELDS,
    id: "soccer-handball-003",
    scenarioFingerprint: "defender-deliberate-reach-routine-cross-no-spa",
    title: "The Routine Cross",
    incidentSubcategory: "deliberate handball without tactical impact",
    scenarioType: "objective",
    learningLevel: "beginner",
    shortPrompt:
      "A defender reaches toward a routine cross inside the penalty area with attackers marked. What is the call?",
    scenario:
      "A slow cross enters a crowded penalty area. A defender deliberately moves a hand toward the ball and redirects it. Nearby attackers are tightly marked, and the cross is not creating an immediate promising attack.",
    recommendedDecisionCode: "penalty-no-card",
    recommendedOutcome: {
      restart: "penalty-kick",
      disciplinaryAction: "none",
      confidence: "high",
      basisStatus: "editorial-demo-recommendation",
    },
    ruleFactors: [
      {
        id: "clear-reach",
        label: "Clear hand-to-ball movement",
        observation: "The defender deliberately reaches toward the cross.",
        relevance: "supports-offence",
      },
      {
        id: "inside-area",
        label: "Inside penalty area",
        observation: "The contact occurs inside the defender's penalty area.",
        relevance: "supports-offence",
      },
      {
        id: "limited-tactical-impact",
        label: "No promising attack stopped",
        observation: "The cross is slow and all nearby attackers are marked.",
        relevance: "disciplinary",
      },
    ],
    reasoningPath: [
      {
        order: 1,
        factorIds: ["clear-reach", "inside-area"],
        conclusion:
          "Deliberate handball inside the area produces a penalty kick.",
      },
      {
        order: 2,
        factorIds: ["limited-tactical-impact"],
        conclusion:
          "No separate tactical or goal-denial reason for a card is present in the fixture.",
      },
    ],
    plainLanguageExplanation:
      "Intentional hand-to-ball movement is enough for the penalty. A card is not automatic for every handball offence, so this fixture recommends no card.",
    learningObjective:
      "Learn that the restart and disciplinary sanction must be evaluated separately.",
    alternativeInterpretations: [
      {
        decisionCode: "penalty-yellow-card",
        rationale:
          "A viewer may read the cross as the start of a promising attack.",
        evidenceThatWouldChangeCall:
          "An unmarked attacker moving onto the cross would strengthen the promising-attack interpretation.",
      },
    ],
    expertReasoning: editorialReasoning(
      "The deliberate reach establishes the offence; the fixture facts intentionally remove a tactical basis for a caution.",
      "Different attacker positioning could make the same handball a promising-attack offence and add a caution.",
    ),
    tags: ["beginner", "deliberate-handball", "penalty", "no-card", "law-12"],
    relatedCaseIds: ["soccer-handball-008"],
    media: media(
      "Staged wide view of a defender reaching toward a slow cross with marked attackers.",
      [
        "Wide shot showing every attacker marked before the cross.",
        "Close angle showing deliberate hand movement toward the ball.",
        "Hold final frame long enough to discuss why no tactical card is recommended.",
      ],
    ),
    seededDistributions: distribution(
      counts(28, 60, 10, 2),
      counts(8, 86, 5, 1),
    ),
    discussionPrompt:
      "What additional tactical fact would turn this no-card recommendation into a yellow card?",
  },
  {
    ...COMMON_CASE_FIELDS,
    id: "soccer-handball-004",
    scenarioFingerprint: "defender-jump-arm-high-unnatural-block",
    title: "The High Arm Jump",
    incidentSubcategory: "body made unnaturally bigger",
    scenarioType: "interpretive",
    learningLevel: "beginner",
    shortPrompt:
      "A defender jumps with one arm high and blocks a shot inside the penalty area. Is the arm position justified?",
    scenario:
      "A defender jumps vertically to block a shot. One arm is raised well above shoulder height before the ball arrives and is not needed for balance. The shot strikes that arm inside the penalty area.",
    recommendedDecisionCode: "penalty-no-card",
    recommendedOutcome: {
      restart: "penalty-kick",
      disciplinaryAction: "none",
      confidence: "high",
      basisStatus: "editorial-demo-recommendation",
    },
    ruleFactors: [
      {
        id: "arm-high",
        label: "Raised arm",
        observation: "The arm is well above the shoulder before contact.",
        relevance: "supports-offence",
      },
      {
        id: "not-justified",
        label: "Position not justified",
        observation: "The vertical jump does not require that arm position.",
        relevance: "supports-offence",
      },
      {
        id: "no-tactical-denial",
        label: "No card trigger",
        observation:
          "The shot is not goal-bound and no promising attack is stopped.",
        relevance: "disciplinary",
      },
    ],
    reasoningPath: [
      {
        order: 1,
        factorIds: ["arm-high", "not-justified"],
        conclusion:
          "The unjustified arm position makes the body unnaturally bigger.",
      },
      {
        order: 2,
        factorIds: ["no-tactical-denial"],
        conclusion:
          "The fixture supports a penalty without a disciplinary card.",
      },
    ],
    plainLanguageExplanation:
      "Not every arm contact is an offence. Here, the raised arm adds avoidable blocking area unrelated to the jump, so the fixture recommends a penalty without a card.",
    learningObjective:
      "Apply the body-position test instead of relying on the phrase ‘ball to hand.’",
    alternativeInterpretations: [
      {
        decisionCode: "no-offence",
        rationale:
          "The raised arm may be a natural part of the player's jumping motion.",
        evidenceThatWouldChangeCall:
          "A full-body angle showing the arm used naturally for balance would support no offence.",
      },
    ],
    expertReasoning: editorialReasoning(
      "The fixture recommendation turns on whether the arm position is a justifiable consequence of the player's movement.",
      "A natural balance position could produce a no-offence decision even with visible arm contact.",
    ),
    tags: ["beginner", "unnatural-position", "jump", "penalty", "law-12"],
    relatedCaseIds: ["soccer-handball-009"],
    media: media(
      "Staged side view of a defender jumping with one arm raised before the shot.",
      [
        "Full-body side angle establishing the jump mechanics.",
        "Pre-contact freeze frame showing the arm already raised.",
        "Overlay comparing torso width with the extra blocking area from the arm.",
      ],
    ),
    seededDistributions: distribution(
      counts(24, 63, 11, 2),
      counts(10, 84, 5, 1),
    ),
    discussionPrompt:
      "Which body-movement detail determines whether this raised arm is justified?",
  },
  {
    ...COMMON_CASE_FIELDS,
    id: "soccer-handball-005",
    scenarioFingerprint: "close-deflection-preexisting-extended-arm",
    title: "The Close Deflection",
    incidentSubcategory: "deflection onto an extended arm",
    scenarioType: "interpretive",
    learningLevel: "intermediate",
    shortPrompt:
      "A close-range deflection hits an arm that was already extended away from the body. Does reaction time decide the call?",
    scenario:
      "A cross deflects from a nearby defender less than a metre away and immediately hits a second defender's arm. The second defender had extended the arm away from the torso before the deflection, and the position is not justified by the stance.",
    recommendedDecisionCode: "penalty-no-card",
    recommendedOutcome: {
      restart: "penalty-kick",
      disciplinaryAction: "none",
      confidence: "medium",
      basisStatus: "editorial-demo-recommendation",
    },
    ruleFactors: [
      {
        id: "short-distance",
        label: "Very short reaction distance",
        observation: "The deflection leaves almost no time to react.",
        relevance: "supports-no-offence",
      },
      {
        id: "preexisting-extension",
        label: "Arm already extended",
        observation: "The arm was away from the body before the deflection.",
        relevance: "supports-offence",
      },
      {
        id: "stance-unjustified",
        label: "Extension not justified",
        observation: "The defender's stance does not require the extended arm.",
        relevance: "supports-offence",
      },
    ],
    reasoningPath: [
      {
        order: 1,
        factorIds: ["short-distance"],
        conclusion:
          "Reaction time weighs against deliberate hand-to-ball movement.",
      },
      {
        order: 2,
        factorIds: ["preexisting-extension", "stance-unjustified"],
        conclusion:
          "The pre-existing unjustified position still supports a handball offence.",
      },
    ],
    plainLanguageExplanation:
      "The defender has little time to react, but reaction time is not the only question. Because the arm already creates unjustified extra blocking area, this fixture recommends a penalty without a card.",
    learningObjective:
      "Weigh distance and deflection together with the arm position instead of using either fact alone.",
    alternativeInterpretations: [
      {
        decisionCode: "no-offence",
        rationale:
          "The deflection is too close and the arm position may be natural for the stance.",
        evidenceThatWouldChangeCall:
          "A wider pre-contact view showing the arm naturally supporting balance would support no offence.",
      },
    ],
    expertReasoning: editorialReasoning(
      "The close deflection explains why the contact is not deliberate; the separate body-position test still supports the offence.",
      "If the arm were naturally positioned, the same deflection could produce no offence.",
    ),
    tags: [
      "deflection",
      "reaction-time",
      "unnatural-position",
      "interpretive",
      "law-12",
    ],
    relatedCaseIds: ["soccer-handball-006"],
    media: media(
      "Staged close-range deflection from one defender onto another defender's extended arm.",
      [
        "Wide frame showing the second defender's arm position before the first contact.",
        "Tight shot capturing both contacts in one continuous take.",
        "Slow replay with elapsed time between deflection and arm contact.",
      ],
    ),
    seededDistributions: distribution(
      counts(44, 45, 9, 2),
      counts(27, 67, 5, 1),
    ),
    discussionPrompt:
      "Why can a close deflection matter without automatically making the contact legal?",
  },
  {
    ...COMMON_CASE_FIELDS,
    id: "soccer-handball-006",
    scenarioFingerprint: "deflection-followed-by-deliberate-second-reach-spa",
    title: "The Second Movement",
    incidentSubcategory: "deliberate movement after a deflection",
    scenarioType: "objective",
    learningLevel: "intermediate",
    shortPrompt:
      "After a close deflection, a defender makes a second arm movement to cut out a dangerous pass. What changes?",
    scenario:
      "A pass glances off one defender. A second defender initially keeps both arms close, then makes a distinct second movement with an arm toward the deflected ball, stopping a pass to an unmarked attacker inside the penalty area.",
    recommendedDecisionCode: "penalty-yellow-card",
    recommendedOutcome: {
      restart: "penalty-kick",
      disciplinaryAction: "yellow-card",
      confidence: "high",
      basisStatus: "editorial-demo-recommendation",
    },
    ruleFactors: [
      {
        id: "initial-natural-position",
        label: "Initial natural arm position",
        observation: "The arms begin close to the torso.",
        relevance: "supports-no-offence",
      },
      {
        id: "second-reach",
        label: "Distinct second movement",
        observation:
          "After the deflection, the defender moves an arm toward the ball.",
        relevance: "supports-offence",
      },
      {
        id: "promising-pass-stopped",
        label: "Promising attack stopped",
        observation:
          "The contact cuts out a pass to an unmarked attacker in a dangerous position.",
        relevance: "disciplinary",
      },
    ],
    reasoningPath: [
      {
        order: 1,
        factorIds: ["initial-natural-position", "second-reach"],
        conclusion:
          "The second movement, not the deflection itself, establishes deliberate handball.",
      },
      {
        order: 2,
        factorIds: ["promising-pass-stopped"],
        conclusion:
          "Stopping the promising attack supports a yellow-card recommendation.",
      },
    ],
    plainLanguageExplanation:
      "The first deflection does not end the analysis. A visible second movement toward the ball makes the handball deliberate, and the dangerous pass that it stops adds the yellow-card recommendation.",
    learningObjective:
      "Identify a second deliberate action after an initially accidental or neutral event.",
    alternativeInterpretations: [
      {
        decisionCode: "penalty-no-card",
        rationale: "The pass may not be promising enough to justify a caution.",
        evidenceThatWouldChangeCall:
          "A wider view showing covering defenders between the receiver and goal would remove the tactical-card basis.",
      },
    ],
    expertReasoning: editorialReasoning(
      "The fixture isolates a second, deliberate arm movement and separately evaluates the attack it stops.",
      "If there were no distinct second movement, the close deflection and natural initial position could support no offence.",
    ),
    tags: [
      "deflection",
      "deliberate-handball",
      "promising-attack",
      "yellow-card",
      "law-12",
    ],
    relatedCaseIds: ["soccer-handball-005"],
    media: media(
      "Staged two-contact sequence ending with a defender's distinct arm movement toward the ball.",
      [
        "Keep both arms close to the torso before the deflection.",
        "Capture a visible pause or directional change before the second arm movement.",
        "Wide final angle showing the unmarked attacker whose pass is stopped.",
      ],
    ),
    seededDistributions: distribution(
      counts(20, 24, 53, 3),
      counts(8, 12, 78, 2),
    ),
    discussionPrompt:
      "Which frame proves that this is more than an unavoidable deflection?",
  },
  {
    ...COMMON_CASE_FIELDS,
    id: "soccer-handball-007",
    scenarioFingerprint: "defender-catches-live-ball-assumed-whistle",
    title: "The Whistle That Never Came",
    incidentSubcategory: "deliberate handling after a mistaken assumption",
    scenarioType: "objective",
    learningLevel: "beginner",
    shortPrompt:
      "A defender catches the ball inside the penalty area after wrongly assuming play was stopped. What is the call?",
    scenario:
      "An attacker falls after a fair challenge near the penalty area. The referee gives no signal. A defender assumes a foul was called and catches the still-moving ball with both hands inside the penalty area. No promising attack is developing.",
    recommendedDecisionCode: "penalty-no-card",
    recommendedOutcome: {
      restart: "penalty-kick",
      disciplinaryAction: "none",
      confidence: "high",
      basisStatus: "editorial-demo-recommendation",
    },
    ruleFactors: [
      {
        id: "ball-live",
        label: "Ball remains in play",
        observation: "The referee has not whistled or otherwise stopped play.",
        relevance: "supports-offence",
      },
      {
        id: "intentional-catch",
        label: "Deliberate handling",
        observation:
          "The defender intentionally catches the ball with both hands.",
        relevance: "supports-offence",
      },
      {
        id: "mistake-no-exemption",
        label: "Mistaken assumption",
        observation:
          "The defender believes play stopped, but that belief does not stop play.",
        relevance: "supports-offence",
      },
    ],
    reasoningPath: [
      {
        order: 1,
        factorIds: ["ball-live"],
        conclusion:
          "Play is still active because the referee gave no stopping signal.",
      },
      {
        order: 2,
        factorIds: ["intentional-catch", "mistake-no-exemption"],
        conclusion:
          "The deliberate catch is a handball offence despite the player's mistaken belief.",
      },
    ],
    plainLanguageExplanation:
      "Players cannot stop play by assumption. Because the ball is live and the defender deliberately catches it inside the area, the fixture recommendation is a penalty without a card.",
    learningObjective:
      "Recognize that only the referee's actual signal or another valid stoppage makes the ball dead.",
    alternativeInterpretations: [
      {
        decisionCode: "penalty-yellow-card",
        rationale:
          "The deliberate catch may appear to stop a promising attack.",
        evidenceThatWouldChangeCall:
          "An attacker about to gain the ball in a dangerous position would add a tactical-card question.",
      },
    ],
    expertReasoning: editorialReasoning(
      "The ball's live status and the intentional catch establish the offence; the player's misunderstanding is not a defence.",
      "A different attacking shape could add a caution for tactical impact.",
    ),
    tags: [
      "beginner",
      "ball-in-play",
      "deliberate-handball",
      "penalty",
      "law-12",
    ],
    relatedCaseIds: ["soccer-handball-008"],
    media: media(
      "Staged scene of a defender catching a live ball while looking toward the referee.",
      [
        "Show the fair challenge and referee giving no whistle or signal.",
        "Keep the ball visibly moving before the defender catches it.",
        "Wide shot establishing that no promising attack is developing.",
      ],
    ),
    seededDistributions: distribution(
      counts(18, 74, 7, 1),
      counts(4, 92, 3, 1),
    ),
    discussionPrompt:
      "What observable signal would have made the defender's catch legal?",
  },
  {
    ...COMMON_CASE_FIELDS,
    id: "soccer-handball-008",
    scenarioFingerprint: "defender-deliberate-cutout-unmarked-attacker-spa",
    title: "The Cut-Out Cross",
    incidentSubcategory: "deliberate handball stopping a promising attack",
    scenarioType: "interpretive",
    learningLevel: "intermediate",
    shortPrompt:
      "A defender deliberately cuts out a cross to an unmarked attacker inside the penalty area. Penalty — and which card?",
    scenario:
      "A low cross is travelling toward an unmarked attacker near the penalty spot. A defender deliberately drops an arm into the ball's path inside the penalty area. A covering defender remains between the attacker and goal, so the facts do not establish DOGSO.",
    recommendedDecisionCode: "penalty-yellow-card",
    recommendedOutcome: {
      restart: "penalty-kick",
      disciplinaryAction: "yellow-card",
      confidence: "high",
      basisStatus: "editorial-demo-recommendation",
    },
    ruleFactors: [
      {
        id: "arm-dropped",
        label: "Deliberate cut-out",
        observation: "The defender intentionally drops an arm into the cross.",
        relevance: "supports-offence",
      },
      {
        id: "unmarked-receiver",
        label: "Promising receiver",
        observation:
          "The cross is reaching an unmarked attacker near the penalty spot.",
        relevance: "disciplinary",
      },
      {
        id: "covering-defender",
        label: "DOGSO not established",
        observation: "Another defender remains goalside and able to challenge.",
        relevance: "disciplinary",
      },
    ],
    reasoningPath: [
      {
        order: 1,
        factorIds: ["arm-dropped"],
        conclusion:
          "The deliberate cut-out establishes handball and a penalty kick.",
      },
      {
        order: 2,
        factorIds: ["unmarked-receiver", "covering-defender"],
        conclusion:
          "The fixture treats the attack as promising but not an obvious goal-scoring opportunity.",
      },
    ],
    plainLanguageExplanation:
      "The deliberate handball stops a dangerous cross, so the fixture recommends a penalty and yellow card. The covering defender keeps the facts below the red-card threshold.",
    learningObjective:
      "Distinguish stopping a promising attack from denying an obvious goal-scoring opportunity.",
    alternativeInterpretations: [
      {
        decisionCode: "penalty-no-card",
        rationale:
          "The receiver may not have a realistic chance to control the cross.",
        evidenceThatWouldChangeCall:
          "A poor cross trajectory or additional nearby defenders would weaken the promising-attack finding.",
      },
    ],
    expertReasoning: editorialReasoning(
      "The fixture separates the deliberate offence, the promising nature of the pass, and the covering defender that prevents a DOGSO conclusion.",
      "If the attacker were unlikely to receive the cross, the penalty could remain while the caution is removed.",
    ),
    tags: [
      "promising-attack",
      "deliberate-handball",
      "cross",
      "yellow-card",
      "law-12",
    ],
    relatedCaseIds: ["soccer-handball-003", "soccer-handball-007"],
    media: media(
      "Staged low cross cut out by a defender's arm before reaching an unmarked attacker.",
      [
        "Wide angle showing the receiver, covering defender, and goal.",
        "Close view of the defender deliberately dropping the arm.",
        "Freeze frame marking why the play is promising but not an obvious goal-scoring opportunity.",
      ],
    ),
    seededDistributions: distribution(
      counts(16, 20, 61, 3),
      counts(5, 10, 83, 2),
    ),
    discussionPrompt:
      "Which fact prevents this promising attack from becoming DOGSO?",
  },
  {
    ...COMMON_CASE_FIELDS,
    id: "soccer-handball-009",
    scenarioFingerprint: "contact-below-armpit-wide-arm-block",
    title: "Shoulder or Arm?",
    incidentSubcategory: "hand-arm boundary and body enlargement",
    scenarioType: "objective",
    learningLevel: "beginner",
    shortPrompt:
      "A shot hits below the defender's armpit while the arm is extended. Is this shoulder contact or handball?",
    scenario:
      "Inside the penalty area, a defender extends an upper arm sideways to block a shot. A clear front angle shows contact below the bottom of the armpit. The shot is travelling wide of goal and no promising attack is stopped.",
    recommendedDecisionCode: "penalty-no-card",
    recommendedOutcome: {
      restart: "penalty-kick",
      disciplinaryAction: "none",
      confidence: "high",
      basisStatus: "editorial-demo-recommendation",
    },
    ruleFactors: [
      {
        id: "below-armpit",
        label: "Contact below armpit boundary",
        observation:
          "The clear angle places contact on the arm, not the shoulder.",
        relevance: "supports-offence",
      },
      {
        id: "side-extension",
        label: "Body made bigger",
        observation:
          "The upper arm is extended sideways without a movement-based justification.",
        relevance: "supports-offence",
      },
      {
        id: "shot-wide",
        label: "No tactical sanction",
        observation:
          "The shot is wide and no promising continuation is removed.",
        relevance: "disciplinary",
      },
    ],
    reasoningPath: [
      {
        order: 1,
        factorIds: ["below-armpit"],
        conclusion:
          "The contact point is within the hand/arm boundary used for handball analysis.",
      },
      {
        order: 2,
        factorIds: ["side-extension"],
        conclusion: "The unjustified extension supports a handball offence.",
      },
      {
        order: 3,
        factorIds: ["shot-wide"],
        conclusion:
          "The fixture adds no card because no tactical or goal-denial condition is present.",
      },
    ],
    plainLanguageExplanation:
      "The shoulder itself is legal, but this contact is visibly below the armpit boundary and the arm creates extra blocking area. The fixture recommends a penalty without a card.",
    learningObjective:
      "Locate the hand/arm boundary before analyzing intent or body position.",
    alternativeInterpretations: [
      {
        decisionCode: "no-offence",
        rationale:
          "A less clear angle could make the contact appear to be on the shoulder.",
        evidenceThatWouldChangeCall:
          "A verified frame showing contact above the bottom of the armpit would support no handball offence.",
      },
    ],
    expertReasoning: editorialReasoning(
      "The fixture first resolves the contact boundary, then applies the unjustified-body-enlargement test.",
      "If the contact were on the shoulder, the arm-position analysis would not create a handball offence.",
    ),
    tags: [
      "beginner",
      "arm-boundary",
      "unnatural-position",
      "no-card",
      "law-12",
    ],
    relatedCaseIds: ["soccer-handball-004", "soccer-handball-010"],
    media: media(
      "Staged front view marking contact below the bottom of a defender's armpit.",
      [
        "Front angle with clothing markers that make the armpit boundary visible.",
        "Freeze frame at contact without obscuring the body line.",
        "Simple overlay identifying shoulder versus arm without copying official artwork.",
      ],
    ),
    seededDistributions: distribution(
      counts(30, 58, 10, 2),
      counts(12, 81, 6, 1),
    ),
    discussionPrompt:
      "Why should the contact boundary be resolved before debating whether the arm position is natural?",
  },
  {
    ...COMMON_CASE_FIELDS,
    id: "soccer-handball-010",
    scenarioFingerprint: "obstructed-angle-arm-position-discussion",
    title: "The Missing Angle",
    incidentSubcategory: "uncertain evidence and body position",
    scenarioType: "discussion",
    learningLevel: "advanced",
    shortPrompt:
      "One angle suggests an extended arm; another is blocked. Is there enough evidence for a penalty?",
    scenario:
      "A shot inside the penalty area appears to strike a defender's arm away from the torso. The front camera is partly blocked, while a rear angle shows the ball change direction but not whether the arm position was justified by a turning motion.",
    recommendedDecisionCode: "penalty-no-card",
    recommendedOutcome: {
      restart: "penalty-kick",
      disciplinaryAction: "none",
      confidence: "low",
      basisStatus: "editorial-demo-recommendation",
    },
    ruleFactors: [
      {
        id: "visible-deflection",
        label: "Contact indicated",
        observation:
          "The ball changes direction at the defender's arm position.",
        relevance: "supports-offence",
      },
      {
        id: "apparent-extension",
        label: "Apparent body enlargement",
        observation:
          "The available front view suggests the arm is away from the torso.",
        relevance: "supports-offence",
      },
      {
        id: "blocked-evidence",
        label: "Missing decisive angle",
        observation:
          "No view clearly shows whether the arm position is justified by the turn.",
        relevance: "supports-no-offence",
      },
    ],
    reasoningPath: [
      {
        order: 1,
        factorIds: ["visible-deflection", "apparent-extension"],
        conclusion:
          "The visible facts support a provisional handball recommendation.",
      },
      {
        order: 2,
        factorIds: ["blocked-evidence"],
        conclusion:
          "Missing evidence lowers confidence and keeps the no-offence interpretation credible.",
      },
    ],
    plainLanguageExplanation:
      "The available images lean toward an unjustified arm position, so the fixture recommendation is penalty, no card. Confidence is intentionally low because the angle needed to test that interpretation is missing.",
    learningObjective:
      "State evidentiary uncertainty explicitly instead of turning a weak camera angle into false certainty.",
    alternativeInterpretations: [
      {
        decisionCode: "no-offence",
        rationale:
          "The arm may be close to the torso or naturally positioned during the turn.",
        evidenceThatWouldChangeCall:
          "An unobstructed side angle showing the full turn and arm position would resolve the interpretation.",
      },
    ],
    expertReasoning: editorialReasoning(
      "The fixture makes a low-confidence editorial recommendation while preserving the unresolved body-movement question.",
      "A no-offence decision remains reasonable because the available media does not prove that the arm position was unjustified.",
    ),
    tags: ["discussion", "evidence-quality", "low-confidence", "var", "law-12"],
    relatedCaseIds: ["soccer-handball-009"],
    media: media(
      "Two staged camera angles: one partially blocked and one showing only the ball deflection.",
      [
        "Front view deliberately obscured by another player's body.",
        "Rear view showing the ball change direction without revealing arm shape.",
        "Optional third angle reserved as a facilitator reveal during discussion.",
      ],
    ),
    seededDistributions: distribution(
      counts(47, 45, 7, 1),
      counts(39, 55, 5, 1),
    ),
    discussionPrompt:
      "What can be concluded from the available evidence, and what must remain uncertain?",
  },
] as const satisfies readonly RefereeCase[];
