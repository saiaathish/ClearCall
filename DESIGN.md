# ClearCall design brief

## Operating mode and evidence

- Operating mode: Existing multi-route redesign with screenshot-informed reconstruction of the feed and case-detail composition.
- Build mode: Preserve the working Next.js application, domain logic, local persistence, routes, and palette; replace the single-case carousel with a continuous social feed.
- Supplied facts: The intended reference is the familiar Threads/X reading model, not a visual clone. Desktop uses a persistent left rail and broad split posts: media on the left; publisher, description, and comments on the right. Posts may be text-only, image, or video. The page-level filter represents foul types. A post opens its full case route. The feed should load continuously without feeling cramped.
- Reference evidence: Seven desktop Threads/X screenshots at approximately 2940×1660 and one 2030×1322 hand-drawn layout mockup. The mockup is the primary geometry reference; the platform screenshots inform hierarchy, navigation familiarity, and detail-thread behavior.
- Creative assumptions: “Infinite” means cursor-style progressive loading with an automatic sentinel and a manual fallback. The local demo has a finite, honest ten-case catalog, so the interface reaches a named end instead of fabricating repeated posts.

## Product and user

- Product type: Public case network and practice tool for sports-officiating decisions.
- Primary user and job: Beginner or amateur referees browse incidents, inspect reasoning, make a call, and compare the factors that changed the decision.
- Trust/risk level: Moderate. Seeded cases, distributions, and comments are demonstration material and must not be presented as official rulings or live community data.
- Device and environment: Frequent desktop and mobile feed browsing, pointer/touch/keyboard input, browser-local persistence, and no production backend.
- Known constraints: No auth, paid APIs, third-party footage, automated rulings, or production credential claims. Existing colors are retained.
- Assumptions to verify: Permissioned uploads and backend cursor pagination remain future integration boundaries; local mixed-media previews store metadata, not uploaded files.

## Design thesis

ClearCall should read like a focused officials’ network: a familiar social-feed rhythm, broad evidence-first posts, and compact reasoning threads expressed through the existing paper, ink, field-green, and signal-yellow review-room language.

## Direction

- Composition: A 232px persistent desktop rail; compact feed toolbar; a centered 1160–1180px feed; split cards around 54/46 for media and discussion; a compact thread header and a split decision card on case detail.
- Spacing/density and negative-space role: Medium density. Gaps separate navigation, post boundaries, and decision stages; comments remain visually attached to the description. No fixed-height blank bands and no oversized hero.
- Typography: Preserve the current editorial serif for case prompts and condensed sans/monospace support system, while reducing display scale on repeated feed items.
- Color and surfaces: Preserve the paper/ink/green/yellow palette. Use borders, rules, and restrained paper-tone shifts for grouping rather than new gradients, glass, or heavy elevation.
- Imagery/iconography: Local diagrammatic case assets with explicit alt text and intrinsic dimensions. Evidence media uses `object-fit: contain`; portrait media receives a bounded stage rather than being cropped.
- Motion: Short feedback and state-continuity transitions only. Progressive feed loading does not steal focus or animate content from offscreen.
- Motion grammar and reduced-motion outcome: State changes may use a brief opacity/translate cue; reduced motion makes them immediate while preserving count announcements and focus.
- Familiarity vs. originality: Familiar social navigation, post metadata, and thread order; distinctive officiating factors, status language, evidence diagrams, and teaching workflow.
- Patterns intentionally avoided: Dark Threads/X cloning, a giant marketing hero, card-within-card overload, blank minimalism, fake endless data, autoplay, media cropping, and an entire interactive card wrapped in one link.

## System

- Existing system to preserve or extend: Next.js 16 App Router, React 19, strict TypeScript, DemoContext/localStorage, seeded case logic, case routes, save/share actions, local comments, and the current role-based palette.
- Tokens and component strategy: Extend the existing semantic tokens. Add a compact feed-post component and a discriminated `text | image | video` media model; retain the full decision form on detail routes.
- Responsive strategy: Split at the width where media plus a readable discussion column stop fitting (about 880px of card space), then stack in source order. Collapse the desktop rail to mobile top/bottom navigation below 720px. Test between named breakpoints and at 200% zoom.
- Accessibility target: WCAG 2.2 AA-minded semantics, visible focus, keyboard-complete filters/navigation/forms, intrinsic media space, captions/provenance boundaries, non-color status cues, polite feed updates, and no nested interactive link traps.
- Performance budget: No new runtime dependency. Lazy-load below-fold media, reserve dimensions, keep the existing ≤250KB raw emitted-JavaScript and ≤65KB raw CSS chunk targets, and avoid autoplay or unbounded duplicate DOM growth.

## States and acceptance criteria

- Loading: Existing hydration skeleton plus a compact feed skeleton that matches final geometry.
- Empty: Filtered feed explains that no seeded cases match and offers a clear reset.
- Error/recovery: Manual load-more fallback remains available if automatic observation is unavailable; malformed browser state continues to recover through existing storage guards.
- Success: Filter updates counts without focus loss; automatic/manual batches append unique cases and announce the new count; save/share/answer/comment/publish feedback remains explicit.
- Permission/offline: Media and authored claims retain demo/permission boundaries. Core feed, filters, comments, and routes remain local-first.
- Completion: Feed lists multiple cases, supports text/image/video variants and several aspect ratios, filters by foul type, progressively loads all local cases, and opens a stable `/case/:id` route. Case detail keeps the full decision and discussion workflow. Typecheck, lint, tests, production build, static audit, desktop/mobile screenshots, keyboard/focus, console, and overflow checks must pass or be disclosed.

## Rendered refinement

- Desktop/mobile captures: Pending implementation capture at 1440×900, 1024×768, and 390×844 plus detail-route states.
- Three highest-impact weaknesses before implementation: The feed shows only one oversized training card; media is modeled and rendered as video-only at forced ratios; the horizontal header and separate learning rail do not match the requested post/thread reading model.
- Fixes implemented: Pending.
- Revised captures and remaining limitations: Pending. The finite local catalog will end honestly; real upload persistence, moderation, streaming, and backend pagination are outside the claimed prototype scope.
