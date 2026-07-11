# ClearCall design brief

## Operating mode and evidence

- Operating mode: Substantive greenfield, multi-route product build.
- Build mode: New build in an empty target repository.
- Supplied facts: ClearCall is a soccer-first decision-training prototype built around WATCH → DECIDE → EXPLAIN → REVEAL → COMPARE → IMPROVE. The required routes, data fields, interactions, formulas, trust language, and visual tokens come from the attached briefs.
- Creative assumptions: The strongest product metaphor is a professional match review room rather than a social-video clone or generic analytics dashboard.

## Product and user

- Product type: Public case network and practice tool for sports officiating decisions.
- Primary user and job: Beginner or amateur referee building practical judgment between courses and matches.
- Trust/risk level: Moderate; invented demonstration rulings must never be presented as official guidance.
- Device and environment: Touch-first mobile practice, with a focused desktop review workspace.
- Known constraints: No backend, auth, paid APIs, third-party footage, automated rulings, or production credential claims.
- Assumptions to verify: Seeded soccer cases are product demonstration material requiring qualified review before production use.

## Design thesis

ClearCall should feel like entering a focused match review room: near-black field, crisp officiating metadata, signal-lime decision states, and a single luminous line that carries the learner from call to evidence to improvement.

## Direction

- Composition: Narrow fixed desktop rail, centered case stage, compact right-side learning context; stacked, edge-conscious mobile feed with persistent bottom navigation.
- Spacing/density: Deliberate medium density. Large gaps mark flow transitions; evidence stays tightly grouped with the decision it supports.
- Spatial intent: The feed keeps the poll and its evidence in one continuous card so the reveal reads as a consequence of the submitted call. Compact gaps bind metadata to the incident; larger gaps separate decision, evidence, and next-step boundaries. The publisher uses numbered sections and restrained vertical pauses to make a long form recoverable rather than sparse. No route uses fixed-height blank bands or vacancy as a substitute for content.
- Typography: Compact, strong headings; restrained body copy; tabular numerals for confidence and distributions.
- Color and surfaces: Near-black background, charcoal review surfaces, off-white text, signal lime for selected/correct, amber for interpretive states, muted red for incorrect.
- Imagery/iconography: Original geometric field-line poster treatment and Lucide icons; no stock imagery or implied broadcast footage.
- Motion: Short reveal, toast, and state-continuity transitions only.
- Reduced motion: Remove transforms and smooth scrolling while preserving immediate state changes and announcements.
- Familiarity vs. originality: Familiar navigation and form semantics; distinctive officiating language, angled field lines, and comparison treatment.
- Patterns intentionally avoided: Purple gradients, glassmorphism, giant marketing hero, decorative bento grids, fake charts, pill proliferation, and public-majority-as-truth framing.

## System

- Existing system: None; create a small token system and reusable semantic components.
- Tokens and component strategy: CSS variables for roles, native controls before ARIA, data-driven status and distribution components.
- Responsive strategy: Recompose three-column desktop into a single task-first mobile column; never merely scale down.
- Accessibility target: WCAG 2.2 AA-minded semantics, keyboard completion, visible focus, labelled controls, live result/toast messages, reduced motion, reflow, and non-color status cues.
- Keyboard and focus contract: The skip link is first, native controls follow visible document order, and there are no focus-trapping overlays. Poll reveal leaves focus on the submitted button while the result is announced. Publisher failure moves focus to the linked validation summary; success moves focus to the submitted state. Removed controls are followed by a surviving control in the same group.
- Motion contract: CSS transitions are derived from current application state and never own business logic. Under `prefers-reduced-motion: reduce`, smooth scrolling is removed and animation/transition duration approaches zero while every state cue remains visible.
- Performance budget: No remote media, charting runtime, or animation runtime; one icon dependency; mostly server-rendered structure with client islands for local state. Release budget is ≤250 KB raw for any emitted JavaScript chunk and ≤65 KB raw for the largest CSS chunk. The verified build measured 224 KB and 60 KB respectively; all route chunks total 1.2 MB on disk before compression and route-level loading.

## States and acceptance criteria

- Loading: App skeleton before local state hydration.
- Empty: Saved search/filter and discussion recovery states.
- Error: Poll and publish validation summaries with focusable, linked guidance.
- Success: Announced result reveal, save/share/publish/reset toasts, and created-case preview.
- Permission: Publishing explicitly framed as a verified-creator prototype; permission confirmation required.
- Offline: All core demo data and logic are local; clipboard failure has an honest recovery message.
- Recovery: Malformed local data falls back safely; reset action restores seeded demo state.
- Completion: All routes resolve; primary actions work; profile changes after answers; saves persist; comparison is deterministic; publisher validates and submits locally; typecheck, lint, tests, build, mobile/desktop render, keyboard path, and overflow checks are recorded.

## Rendered refinement

- Desktop/mobile captures: Inspected the hydrated feed at 1440×900 and the feed, compare, profile, publisher, saved, about, and case-detail routes at a 375 CSS-pixel mobile viewport. Mobile checks reported no horizontal overflow on every inspected route.
- Three highest-impact weaknesses:
  1. Submitting an answer could immediately re-rank the feed and move the revealed evidence off screen.
  2. Empty publisher answer labels were all presented as the recommended choice because empty strings compared equal.
  3. Publisher validation exposed blocking errors while the footer still said the draft was ready to store; case headers also exposed raw ISO timestamps.
- Fixes implemented: Pinned the submitted case through its reveal, required a non-empty recommendation before applying the preview badge, made the publisher status reflect blocking errors, formatted dates for human reading, and changed the locked poll message to match its submitted state.
- Revised captures and remaining limitations: Re-inspected the result state, mobile feed, teaching comparison, learner profile, and publisher after the interaction fixes. Diagrammatic incident frames remain intentional placeholders until permissioned footage and qualified soccer-officiating review are available. Browser-local publishing cannot exercise a production upload, moderation, or expert-review backend because none is claimed or implemented.
