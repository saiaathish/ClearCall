# ClearCall

ClearCall is a frontend-only decision-training prototype for aspiring and active sports officials. Learners watch an incident, make a structured call, state their confidence, select the factors behind the decision, and then compare their reasoning with authored, rule-referenced teaching material.

The central loop is:

**WATCH → DECIDE → EXPLAIN → REVEAL → COMPARE → IMPROVE**

The default route opens directly into the interactive case feed. There is no marketing homepage, backend, authentication system, external AI service, or third-party sports footage.

## Stack

- Next.js 16 App Router
- React 19
- Strict TypeScript
- Tailwind CSS 4 plus a CSS-variable design system
- Lucide icons
- React Context and versioned `localStorage` persistence
- Vitest for deterministic domain-logic tests

The product deliberately avoids a charting dependency and animation runtime. Profile visualizations use semantic HTML/CSS and a small accessible SVG; purposeful transitions use CSS and respect `prefers-reduced-motion`.

## Run locally

Requirements: Node.js 20.9 or newer and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available scripts

```bash
npm run dev        # Start the development server
npm run typecheck  # Run strict TypeScript checks
npm run lint       # Run ESLint and Next.js rules
npm test           # Run deterministic Vitest tests
npm run build      # Create the production build
npm run start      # Serve the production build
```

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Personalized public case feed and decision/reveal loop |
| `/case/[id]` | Full case context, local answer, structured discussion, and similar cases |
| `/compare` | Deterministic side-by-side teaching comparison |
| `/profile` | Jordan Lee’s locally derived learner profile and reset control |
| `/publish` | Verified-creator frontend prototype with local pending-review submission |
| `/saved` | Persistent saved-case search, filters, and grid/list views |
| `/about` | Product explanation, authority model, copyright position, and learning disclaimer |

## Demonstration data and rules

`data/cases.ts` contains ten carefully authored soccer demonstrations, including teaching pairs for serious foul play, handball, and offside interference. Each case includes typed decisions, factors, rule paths, three separate distributions, media provenance, similar-case relationships, and seeded discussion.

All scenario recommendations, percentages, participants, and comments are synthetic demonstration material. Every seeded case remains **Open discussion** and **Demo review required** until a qualified soccer-officiating expert reviews it. Nothing in the repository claims governing-body approval or official guidance.

The comparison and recommendation functions live in `lib/algorithms.ts`:

- Similarity: factor overlap (35%), rule-path overlap (20%), competition context (15%), difficulty proximity (15%), disagreement similarity (15%).
- Teaching contrast: adds a transparent selection bonus when recommendations differ; the displayed similarity remains the unmodified base score.
- Feed priority: category weakness (35%), high-confidence error need (25%), difficulty fit (20%), diversity (10%), freshness (10%).
- Calibration: the supplied Brier-loss formula, displayed as alignment with the authored demo recommendation rather than official correctness.

## Local persistence

A versioned `localStorage` envelope stores answers, confidence, selected factors, saves, comments, streak, onboarding completion, and locally submitted case drafts. Reads use defensive validation and recover to the seeded Jordan Lee baseline when data is absent or malformed.

The publishing flow never stores a `File`, file contents, or an object URL. It persists only serializable file metadata and form fields; a selected clip must be chosen again after refresh. “Reset demo data” restores the seeded baseline.

## Replacing demo video assets

The committed project intentionally includes no professional broadcast or third-party footage. Place team-recorded, permission-cleared, or openly licensed clips in `public/media/demo/`, then update the matching `videoSrc` and `posterSrc` fields in `data/cases.ts`.

When media is absent, the interface displays **Authorized demo clip placeholder** and a textual incident description. See `public/media/demo/README.md` for the asset boundary.

## Mock versus real functionality

Working locally:

- Decision, confidence, and factor submission
- Post-submit evidence reveal
- Deterministic feed personalization and case comparison
- Derived learner metrics and calibration
- Saved cases and search/filter controls
- Temporary local discussion comments and factor reactions
- Publishing validation, preview, and pending-review draft creation
- Share-link clipboard handling and notifications

Explicitly mocked or not implemented:

- Public publishing and a shared comment backend
- Authentication, credentials, expert verification, moderation, or takedowns
- Collected community/learner/verified-referee distributions
- Official rulings, governing-body approval, or production recommendations
- Video upload storage, external embeds, copyright verification, or automatic foul detection

## Suggested backend seams

The immutable case catalog and pure algorithms are separate from browser state. A future backend can replace the following boundaries without rewriting views:

- Case catalog: replace `data/cases.ts` reads with a typed repository or Supabase queries.
- Identity and roles: replace the seeded local user with authenticated profiles and reviewed credentials.
- Responses and saves: move Context mutations to server actions or API calls with optimistic recovery.
- Publishing: send metadata and authorized uploads to object storage, moderation, and reviewer queues.
- Distributions and profile: calculate aggregates from validated submissions server-side, keeping public and qualified-reviewer cohorts separate.

Before production use, add qualified content review, rights workflows, moderation, privacy controls, server-side validation, end-to-end tests, and the governing ruleset/version update process.
