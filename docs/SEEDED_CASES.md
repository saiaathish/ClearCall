# Seeded Referee Cases

This document covers the versioned referee-case fixtures created for GitHub
issue [#13](https://github.com/saiaathish/ClearCall/issues/13).

## Scope and source-of-truth decision

Issue #13 asks for 10–15 cases and gives these values for each case: soccer,
handball, penalty, hard, and Law 12. The data therefore contains the smallest
compliant set of ten cases, all using those fixed values. `learningLevel` varies
from beginner to advanced so the collection can still support a useful learning
progression without changing the issue-level `difficulty: "hard"` requirement.

The incident concepts are original, synthetic ClearCall scenarios. They do not
describe real matches. No broadcast footage, referee identity, professional
credential, community response, or media permission is claimed.

## Repository artifacts

- `src/domain/referee-case.ts` — schema version, TypeScript contract, canonical
  decision codes, and nested data types.
- `src/data/referee-cases.ts` — ten typed fixtures and the official demo-case
  constants.
- `src/validation/referee-case-validator.ts` — dependency-free runtime
  validation.
- `scripts/validate-referee-cases.ts` — command-line validation plus demo-doc
  reference checking.
- `tests/referee-cases.test.ts` — focused integrity and negative tests.
- `docs/DEMO_STORYLINE.md` — issue #17 storyline linked to real seed IDs.

## Schema conventions

| Field                     | Convention                                                                        |
| ------------------------- | --------------------------------------------------------------------------------- |
| `schemaVersion`           | Numeric version; currently `1`                                                    |
| `id`                      | Stable `soccer-handball-NNN` identifier                                           |
| `scenarioFingerprint`     | Unique semantic fingerprint used to catch duplicate scenarios                     |
| `difficulty`              | Fixed to `hard` by issue #13                                                      |
| `learningLevel`           | `beginner`, `intermediate`, or `advanced`                                         |
| `scenarioType`            | `objective`, `interpretive`, or `discussion`                                      |
| `availableDecisions`      | Same four structured choices across every case                                    |
| `recommendedDecisionCode` | Editorial fixture recommendation, never community consensus                       |
| `ruleFactors`             | Observations with explicit relevance                                              |
| `reasoningPath`           | Ordered, machine-readable references to rule-factor IDs                           |
| `expertReasoning`         | ClearCall editorial fixture with expert review explicitly pending                 |
| `ruleSource`              | Checked official source, edition, URL, access date, and paraphrase policy         |
| `media`                   | Asset status, authorization status, null-safe references, and recording shot list |
| `seededDistributions`     | Synthetic 100-response fixtures with visible non-live disclaimers                 |
| `relatedCaseIds`          | Existing, reciprocal IDs for side-by-side comparison                              |
| `confidenceCalibration`   | Prompt and bands for comparing confidence with the fixture recommendation         |

## Case coverage

| ID                    | Learning focus                                 | Type         | Level        | Recommended fixture outcome      | Related cases | Media status       |
| --------------------- | ---------------------------------------------- | ------------ | ------------ | -------------------------------- | ------------- | ------------------ |
| `soccer-handball-001` | Deliberate handball denying a goal             | Objective    | Advanced     | Penalty + red                    | `002`         | Recording required |
| `soccer-handball-002` | Non-deliberate handball denying a goal         | Interpretive | Advanced     | Penalty + yellow                 | `001`         | Recording required |
| `soccer-handball-003` | Restart versus sanction                        | Objective    | Beginner     | Penalty, no card                 | `008`         | Recording required |
| `soccer-handball-004` | Unjustified raised-arm position                | Interpretive | Beginner     | Penalty, no card                 | `009`         | Recording required |
| `soccer-handball-005` | Close deflection and pre-existing arm position | Interpretive | Intermediate | Penalty, no card                 | `006`         | Recording required |
| `soccer-handball-006` | Deliberate second movement after a deflection  | Objective    | Intermediate | Penalty + yellow                 | `005`         | Recording required |
| `soccer-handball-007` | Deliberate catch while ball remains live       | Objective    | Beginner     | Penalty, no card                 | `008`         | Recording required |
| `soccer-handball-008` | Stopping a promising attack                    | Interpretive | Intermediate | Penalty + yellow                 | `003`, `007`  | Recording required |
| `soccer-handball-009` | Shoulder/arm boundary and body enlargement     | Objective    | Beginner     | Penalty, no card                 | `004`, `010`  | Recording required |
| `soccer-handball-010` | Incomplete video evidence                      | Discussion   | Advanced     | Penalty, no card; low confidence | `009`         | Recording required |

The demo pair is `soccer-handball-001` and `soccer-handball-002`. One factor
changes between them: deliberate movement toward the ball versus a
non-deliberate but unjustified arm position. That difference changes the
fixture's disciplinary recommendation while preserving the penalty restart.

## Rule and review status

The rule metadata was checked on 2026-07-10 against The IFAB's _Laws of the Game
2026/27_, Law 12, using the official
[Fouls and Misconduct](https://www.theifab.com/laws/latest/fouls-and-misconduct/)
page. ClearCall explanations are short paraphrases, not copied official text.

`verificationStatus: "rule-source-checked-domain-review-pending"` is
intentional. A qualified referee has not reviewed or endorsed these original
scenarios. The UI must show the `expertReasoning.disclosure` and must not rename
fixture reasoning to “verified expert opinion” until a real review, reviewer
provenance, and approval date exist.

The simulated community and verified-referee cohorts are deterministic UI
fixtures. They are not surveys, production analytics, or evidence that a
recommended decision is correct.

## Media policy and team shot list

No media asset exists yet. Every case is `recording-required`, has null
`localPath` and `sourceUrl`, and includes its own original-production shot list.

Team requirements:

1. Stage or animate each scenario using team-created material.
2. Avoid professional broadcast clips unless permission is documented.
3. Preserve the case ID in the filename and asset manifest.
4. Add accessible alt text and verify the decisive movement is visible.
5. Change `assetStatus` only after the path or licensed URL exists.
6. Change `authorizationStatus` only after ownership or license evidence exists.
7. Run validation after every asset-status change.

## Adding a case

1. Copy one object in `src/data/referee-cases.ts`.
2. Increment the stable ID without reusing or renumbering existing IDs.
3. Create a unique `scenarioFingerprint`, title, prompt, and scenario.
4. Keep all four canonical decision choices.
5. Add at least two rule factors and reference each reasoning factor by ID.
6. Include a credible alternative interpretation and the evidence that would
   change the call.
7. Add a reciprocal related-case link to both case objects.
8. Keep fixture distributions at 100 responses per cohort and preserve every
   simulated-data disclosure.
9. Leave media as `recording-required` with null references until an authorized
   asset exists.
10. Update the table above, then run the full check suite.

The current issue allows at most 15 seed cases. Adding a sixteenth requires an
issue change or a separate production dataset outside this seed fixture.

## Validation

```bash
npm install
npm run format:check
npm run lint
npm test
npm run build
```

`npm run validate` checks cardinality, schema version, fixed issue values,
required content, unique IDs/fingerprints/titles, decision integrity,
factor/reasoning references, reciprocal related-case IDs, distribution totals
and disclosures, rule source, media safety, demo percentages, and storyline case
references.
