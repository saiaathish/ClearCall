# ClearCall UnitedHacks V7 Demo Storyline

This is the official repository artifact for GitHub issue
[#17](https://github.com/saiaathish/ClearCall/issues/17).

> **Current status: conditional script; live demo not ready.** This repository
> contains the typed seed data and this rehearsable plan, but no application,
> feed, video player, voting API, discussion screen, comparison screen, upload
> flow, profile, deployment, or authorized media. Screen names below are
> implementation contracts, not claims of shipped functionality. Do not use the
> live script until every readiness gate is checked.

## One-sentence pitch

ClearCall turns a disputed soccer moment into a structured call that people can
explain, compare, and learn from without confusing popularity with the rules.

## Audience and concrete problem

Primary audience: developing referees, referee educators, amateur competition
organizers, and serious fans who want to practice decision-making.

Problem: short clips trigger fast opinions, but ordinary social feeds mix the
incident, result, rule factors, confidence, and counterarguments into one noisy
comment stream. ClearCall's intended workflow keeps those elements structured
and places a similar case beside the original so one changed fact becomes a
teachable comparison.

## Demo fixture contract

- Main case: `soccer-handball-001`, “The Goal-Line Reach.”
- Comparison case: `soccer-handball-002`, “The Unnatural Block.”
- Main editorial recommendation: penalty kick + red card.
- Comparison editorial recommendation: penalty kick + yellow card.
- Main synthetic reveal: 55 of 100 simulated community responses and 82 of 100
  simulated verified-referee responses choose penalty + red card.
- Rule source: The IFAB, _Laws of the Game 2026/27_, Law 12.
- Media state: recording required; no clip currently exists.
- Review state: rule source checked; qualified referee review pending.

The 55% and 82% values come from deterministic seed fixtures required by issue
#17. Present them only with the on-screen label “Simulated demo data.” Never
call them live results, research, a real expert survey, or proof of correctness.

## Live-demo readiness gate

All boxes are currently unchecked because the application does not exist in this
checkout.

- [ ] Public feed renders `soccer-handball-001` from the shared data export.
- [ ] Team-owned or licensed media for `soccer-handball-001` plays locally and
      in deployment.
- [ ] Judge can choose all four structured decisions and enter confidence.
- [ ] Vote submission succeeds once and prevents an accidental duplicate.
- [ ] Reveal is computed from the selected seed fixture and visibly labeled
      simulated.
- [ ] Editorial reasoning and “expert review pending” disclosure are visible.
- [ ] Comparison loads `soccer-handball-002` through `relatedCaseIds`.
- [ ] Upload form validates a reversible, non-sensitive demo submission.
- [ ] Profile visibly updates from that demo action and survives the planned
      navigation.
- [ ] Local fallback and deployed build use the same tested commit.
- [ ] Three presenters complete two timed rehearsals under 3:00.

If any box remains unchecked, use the concept fallback or omit the unavailable
step. Do not simulate a successful API response without disclosure.

## Exact three-minute timeline

Use this script only after the readiness gate passes. Presenter A owns the judge
interaction, Presenter B owns reasoning and comparison, and Presenter C owns
contribution, profile, and close.

| Time      | Presenter | Spoken words                                                                                                                                                                                                               | Screen shown                                                                                                | User interaction                                                                              | Expected system response                                                                                 | Transition                                                            | Judging criterion                        | Current readiness             |
| --------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------- | ----------------------------- |
| 0:00–0:12 | A         | “A controversial call is easy to argue and hard to learn from. ClearCall turns one disputed moment into a structured decision people can inspect, compare, and improve.”                                                   | Product title, then public feed                                                                             | Presenter opens public feed                                                                   | Feed loads from shared case data                                                                         | “Let’s put you in the referee’s position.”                            | Presentation, Practicality               | Blocked: no app/feed          |
| 0:12–0:30 | A         | “This is `soccer-handball-001`, an original staged scenario. The goalkeeper is beaten; watch the defender on the goal line.”                                                                                               | Feed card expands into case view                                                                            | Presenter selects `soccer-handball-001` and plays clip once                                   | Authorized clip plays; prompt and results remain hidden                                                  | “One watch. One call.”                                                | Design, Presentation                     | Blocked: no screen/media      |
| 0:30–0:50 | A         | “You are the referee. Is it no offence, penalty with no card, penalty with yellow, or penalty with red?”                                                                                                                   | Paused decision frame and four structured choices                                                           | Judge chooses one option                                                                      | Choice is selected; aggregates remain hidden                                                             | “Now tell us how certain you are.”                                    | Creativity, Design                       | Blocked: no voting UI         |
| 0:50–1:08 | A         | “Set your confidence, then submit.”                                                                                                                                                                                        | Confidence choices: 25, 50, 75, 100                                                                         | Judge chooses confidence and submits once                                                     | Vote is accepted once; user choice and confidence persist for this session                               | “You made the call; Presenter B will show the context.”               | Technical Complexity, Presentation       | Blocked: no API/state         |
| 1:08–1:27 | B         | “For this fixture, penalty plus red is selected by 55% of the simulated community cohort and 82% of the simulated referee cohort. These are demo fixtures, not live people and not proof of correctness.”                  | Reveal panel for `soccer-handball-001` with permanent simulated-data banner                                 | Presenter reveals distributions                                                               | Four-choice counts render from seed data and total 100 per cohort                                        | “The percentages are context. The reasoning is the product.”          | Practicality, Technical Complexity       | Data ready; UI blocked        |
| 1:27–1:47 | B         | “The rule-based editorial path is: deliberate arm movement, offence inside the penalty area, then denial of a goal. That produces the fixture recommendation: penalty and red. Qualified referee review is still pending.” | Structured factors, reasoning path, rule source, community discussion, and expert-review-pending disclosure | Presenter expands reasoning and one alternative interpretation                                | Factors reference the cited Law 12 source; no fake expert identity appears                               | “Now change one fact.”                                                | Technical Complexity, Practicality       | Data ready; UI/review blocked |
| 1:47–2:10 | B         | “Here is related case `soccer-handball-002`. The arm does not reach toward the ball; it is already in an unjustified position. The penalty remains, but the fixture sanction changes to yellow.”                           | Side-by-side comparison of `001` and `002`                                                                  | Presenter opens related case from `relatedCaseIds` and highlights the changed factor          | Comparison shows deliberate versus non-deliberate movement and red versus yellow fixture recommendations | “That contrast turns a debate into a reusable lesson.”                | Creativity, Design, Technical Complexity | Data ready; UI blocked        |
| 2:10–2:29 | C         | “ClearCall is intended to let a user contribute another incident using the same structure: context, decision options, media rights, and rule factors.”                                                                     | Create-incident form                                                                                        | Presenter opens prefilled reversible demo draft; does not upload private or third-party media | Form validates required fields and media authorization before a demo save                                | “A contribution should create knowledge, not an anonymous clip dump.” | Practicality, Design                     | Blocked: no upload flow       |
| 2:29–2:47 | C         | “That contribution and today’s confidence should appear in a learning profile, where users can see patterns without pretending one vote makes them an expert.”                                                             | Learning profile                                                                                            | Presenter opens profile                                                                       | Demo activity appears once with no fabricated accuracy history                                           | “One incident becomes part of a learning loop.”                       | Practicality, Creativity                 | Blocked: no profile/state     |
| 2:47–3:00 | C         | “TikTok gives the moment. Reddit gives the argument. ClearCall’s goal is the structured layer between them: make the call, expose the factors, compare the precedent, and learn honestly.”                                 | Return to comparison summary and product name                                                               | No interaction                                                                                | Stable closing frame                                                                                     | Stop speaking at 3:00                                                 | All five                                 | Blocked: no app               |

## Complete happy path

This is the exact navigation contract for implementation and rehearsal:

1. Open public feed.
2. Select and watch `soccer-handball-001`.
3. Make one structured call from the four canonical choices.
4. Enter confidence at 25, 50, 75, or 100.
5. Submit once; keep results hidden until success.
6. Reveal simulated community and simulated referee fixture distributions.
7. Read the structured rule factors, editorial reasoning, alternative view, and
   “expert review pending” disclosure.
8. View the community discussion area without calling synthetic comments real.
9. Open related case `soccer-handball-002` in comparison view.
10. Open a reversible new-incident draft and validate media authorization.
11. Save the demo draft only if the implementation supports safe cleanup.
12. Open the learning profile and show only activity actually recorded.

## Judging-criteria map

| Criterion            | Demo proof                                                                                                 | Honest boundary                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Creativity           | One-factor case comparison converts a social argument into a reusable lesson                               | Similarity algorithm is not implemented; demo pair is explicitly related seed data |
| Presentation         | Judge makes the central call, then sees one clear changed factor                                           | Run live only after media and interaction are tested                               |
| Technical Complexity | Typed schema, validated relationships, structured reasoning, distributions, and intended state transitions | Current repository proves data integrity, not APIs or screens                      |
| Practicality         | Training loop for developing referees and educators                                                        | ClearCall does not issue official rulings or credentials                           |
| Design               | Four consistent choices, hidden-before-vote results, disclosure banners, and side-by-side factors          | No visual implementation currently exists                                          |

## 75-second compressed fallback

Use after one failed recovery attempt or when presentation time is reduced.

| Time      | Presenter | Script and action                                                                                                         | Required evidence                                  |
| --------- | --------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| 0:00–0:10 | A         | “ClearCall makes disputed referee decisions structured and inspectable.” Open the recorded main-case frame.               | Team-owned recording or clearly labeled storyboard |
| 0:10–0:25 | A         | Ask the judge verbally: “Penalty with red, yellow, no card, or no offence?” Record no data.                               | Visible `soccer-handball-001` prompt               |
| 0:25–0:38 | B         | Show the static fixture reveal. Say: “Simulated demo cohorts: 55% community, 82% referee fixture — not live survey data.” | Screenshot generated from the same seed fixture    |
| 0:38–0:52 | B         | Show deliberate movement → penalty area → goal denied. State expert review is pending.                                    | Structured reasoning screenshot with disclosure    |
| 0:52–1:06 | B         | Compare `soccer-handball-002`: “Same penalty, different movement, yellow instead of red.”                                 | Side-by-side fixture screenshot                    |
| 1:06–1:15 | C         | “ClearCall’s difference is structured decisions plus explainable comparison, not another comment feed.” End.              | Product name and limitation footer                 |

If screenshots or recordings do not exist, use a concept walkthrough of this
document and say plainly that the product interface is not implemented.

## Failure handling

| Failure                | Immediate action                                                                              | Honest spoken line                                                                                   | Recovery asset                                 |
| ---------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Video not loading      | Wait no more than three seconds; switch to local recording of the same case                   | “The player failed, so we’re using our team-owned recording of the same seeded case.”                | Local MP4 plus first/decision/final frames     |
| Network failure        | Switch to tested local build; keep judge vote verbal if submission is unavailable             | “The network is down; this is the same tested commit running locally.”                               | Local build and fixture screenshots            |
| Vote API failure       | Do not fake success; ask judge for verbal choice and show labeled pre-recorded fixture reveal | “Your choice was not saved. We’ll keep it verbal and show the simulated fixture response.”           | Static reveal from `soccer-handball-001`       |
| Demo data unavailable  | Stop quoting 55/82; open checked-in fixture or screenshot                                     | “The running environment did not load the fixture, so these values are not live application output.” | Repository data and validated screenshot       |
| Deployment unavailable | Switch once to local build, then fallback recording                                           | “The hosted deployment is unavailable; we’re continuing from the rehearsed local build.”             | Local build, screen recording, commit SHA note |

Never substitute unrelated footage, imply a failed mutation succeeded, or hide
that a fallback is prerecorded.

## Backup recording checklist

- [ ] Record the exact tested commit SHA at start and end.
- [ ] Use only team-owned or licensed media.
- [ ] Capture the complete three-minute happy path in one take.
- [ ] Capture clean clips for feed, vote, reveal, reasoning, comparison, upload,
      and profile states.
- [ ] Capture static PNGs for first frame, decision point, reveal, reasoning,
      and comparison.
- [ ] Keep “Simulated demo data” and “Expert review pending” visible.
- [ ] Show case IDs `soccer-handball-001` and `soccer-handball-002`.
- [ ] Verify displayed counts match checked-in data.
- [ ] Store the recording locally on two presenter laptops.
- [ ] Test playback with Wi-Fi disabled and audio muted.

## Three-person presenter handoff

- Presenter A — problem, feed, clip, judge decision, confidence, submit.
- Presenter B — reveal disclosure, reasoning, alternative view, comparison.
- Presenter C — contribution contract, profile contract, differentiation, close.

Exact handoffs:

1. A → B at 1:08: “You made the call; Presenter B will show the context.”
2. B → C at 2:10: “That comparison creates a reusable lesson; Presenter C will
   show how a contribution would enter the network.”
3. C closes without returning control.

If one presenter is absent, A covers 0:00–1:27 and C covers 1:27–3:00. Keep the
same words and timing; remove personal introductions.

## Likely judge questions

**Are these real community and referee results?**

No. Both 100-response cohorts are deterministic simulated demo fixtures. The UI
must label them. Production results require real votes, provenance, and privacy
controls.

**Did an expert verify the recommended decisions?**

No qualified referee is claimed. ClearCall checked the official 2026/27 Law 12
source and wrote original editorial reasoning; domain review remains pending.

**Does the community decide the correct ruling?**

No. Community distribution is context. The rule factors, evidence, and review
status remain separate from popularity.

**Is ClearCall an official referee authority?**

No. It is a learning and discussion network, not a governing body, certification
provider, or replacement for competition officials.

**Where did the clips come from?**

No clip exists yet. The data includes a team-production shot list. The live demo
must use original or licensed media with recorded authorization.

**What is technically implemented today?**

The current repository implements the typed, versioned fixture model, ten
validated cases, relationships, synthetic distribution safeguards, tests, and
storyline. Application UI, APIs, persistence, media, and deployment are not in
this checkout.

**Is the comparison AI-powered?**

Not in this scope. The demo pair is connected through validated related-case
IDs. A future similarity engine could rank candidates, but that must not be
claimed as implemented.

**How would you prevent harmful or copyrighted uploads?**

Require rights attestation, moderation, reporting, privacy controls, and removal
processes before public uploads. The demo must use a reversible, non-sensitive,
team-owned asset only.

## Differentiation

| Alternative                | What it does well                    | ClearCall's intended difference                                                                                                 |
| -------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| TikTok                     | Fast, visual discovery               | Structured calls, confidence, rule factors, and related-case learning rather than engagement-only reactions                     |
| Reddit                     | Open discussion and counterarguments | Decision-specific fields and comparable factors instead of unstructured threads                                                 |
| Generic video quiz         | Tests one answer                     | Preserves alternative interpretations, confidence, source status, and comparison cases                                          |
| Existing referee curricula | Authoritative, sequenced instruction | Intended peer practice around short incident media between formal learning sessions; never a replacement for official curricula |

## Honest limitations and post-hackathon path

Current limitations:

- No application interface or stateful happy path exists.
- No authorized media has been created.
- No qualified expert review or real cohort data exists.
- No upload moderation, rights workflow, privacy model, or removal process
  exists.
- No similarity engine, AI adjudication, analytics, or production database
  exists.
- The fixture recommendations are educational editorial content, not official
  rulings.

Post-hackathon expansion, in order:

1. Implement read-only feed, case view, decision, confidence, reveal, and
   comparison from the shared schema.
2. Record and authorize the two demo-case assets.
3. Obtain traceable review from qualified referees and preserve revision
   history.
4. Add authenticated voting with aggregate provenance and abuse controls.
5. Add upload rights attestation, moderation, reporting, and deletion.
6. Add profile learning signals only after a transparent scoring model exists.
7. Evaluate similarity ranking against a human-labeled benchmark before making
   AI or retrieval-quality claims.

## Final rehearsal and acceptance checklist

Content and truth:

- [ ] Every spoken feature exists in the tested build.
- [ ] Main and comparison IDs match checked-in data.
- [ ] 55% and 82% render from the fixture, not duplicated UI literals.
- [ ] Every simulated value carries a permanent disclosure.
- [ ] Expert review is either traceable or visibly pending.
- [ ] Rule wording remains paraphrased and the source link works.
- [ ] No professional broadcast footage or unverified identity appears.

Interaction and timing:

- [ ] Judge can complete the vote and confidence interaction in 18 seconds.
- [ ] Results remain hidden before successful submission.
- [ ] Duplicate submission is prevented.
- [ ] Comparison opens from `relatedCaseIds`.
- [ ] Upload uses reversible team-owned data.
- [ ] Profile shows only events the demo actually creates.
- [ ] Full script ends by 2:55 twice consecutively.
- [ ] Fallback ends by 1:15 twice consecutively.

Reliability:

- [ ] Local build passes format, lint, typecheck, tests, validation, and build.
- [ ] Hosted and local builds use the same commit.
- [ ] Network-offline recovery has been rehearsed.
- [ ] Two laptops hold the local build, recording, and screenshots.
- [ ] Presenters know the exact failure line for their segment.

## Acceptance status

The storyline artifact, exact timeline, seeded IDs, judging map, fallback,
failure plan, recording checklist, handoffs, differentiation, Q&A, limitations,
and rehearsal checklist are complete.

Issue #17 is **not fully complete as a live-demo outcome** in this checkout. Its
required product actions remain blocked by the absent application, media,
persistence, and deployment. This file must not be used to imply those systems
exist.
