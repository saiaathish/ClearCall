# Authorized demo media

Openly licensed Mixkit **match-play** soccer clips live under `match/`
(`clip-01.mp4` … `clip-14.mp4`) with matching posters from the same footage.

These are live-game / semi-pro pitch clips only — no freestyle, agility-ladder
drills, parking-garage juggling, empty-stadium B-roll, or beach stock. The
`match/` folder path also busts stale CDN/browser caches of earlier wrong files
that lived at `/media/demo/clip-*.mp4`.

Case catalog entries wire them through `videoSrc` / `posterSrc` via
`data/assign-media.ts`, preferring clips whose action tags match the case
category.

Replace these with team-recorded or permission-cleared incident footage when
you move beyond the prototype.
