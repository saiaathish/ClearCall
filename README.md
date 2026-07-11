# ClearCall

ClearCall is a public referee knowledge-network concept where people can make
structured calls, compare similar plays, and learn from transparent rule-based
discussion.

## Repository status

This checkout currently provides the data and demo-planning foundation, not a
working application:

- a typed, versioned referee-case schema;
- ten validated soccer handball fixtures for issue #13;
- transparent synthetic demo distributions;
- related-case comparison data;
- media authorization states and original-production shot lists;
- a conditional three-minute UnitedHacks V7 storyline for issue #17;
- runtime validation, type checking, formatting, and focused tests.

No feed, media player, voting API, upload flow, profile, deployment, real vote
data, or verified expert review exists in this repository yet. See
[`docs/DEMO_STORYLINE.md`](docs/DEMO_STORYLINE.md) before making product claims.

## Development

Requires Node.js 22.18 or newer.

```bash
npm install
npm run format:check
npm run lint
npm test
npm run build
```

Documentation:

- [`docs/SEEDED_CASES.md`](docs/SEEDED_CASES.md) — schema, case coverage, media
  policy, and contributor workflow.
- [`docs/DEMO_STORYLINE.md`](docs/DEMO_STORYLINE.md) — exact demo, fallback,
  failure recovery, and live-readiness blockers.
