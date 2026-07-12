# Authorized demo media

Openly licensed Mixkit soccer clips live here (`clip-01.mp4` … `clip-08.mp4`) with matching posters extracted from the same footage (`poster-01.jpg` … `poster-08.jpg`).

Case catalog entries wire them through `videoSrc` / `posterSrc` via `data/assign-media.ts`, preferring clips whose action tags match the case category (challenge, breakaway, keeper, offside, etc.).

Replace these with team-recorded or permission-cleared footage when you move beyond the prototype. Posts without a real clip are text-only or image posts — the feed no longer uses SVG placeholders or unrelated stock video.
