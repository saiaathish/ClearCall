/** Real photo / video assets only — no SVG placeholders. */

export type MediaTag =
  | "challenge"
  | "tackle"
  | "duel"
  | "handball"
  | "arm"
  | "offside"
  | "attack"
  | "dogso"
  | "breakaway"
  | "goal"
  | "keeper"
  | "advantage"
  | "open-play"
  | "simulation"
  | "set-piece"
  | "match"
  | "ball";

export type MediaAsset = {
  src: string;
  width: number;
  height: number;
  alt: string;
  tags: readonly MediaTag[];
};

export type VideoAsset = {
  videoSrc: string;
  posterSrc: string;
  width: number;
  height: number;
  alt: string;
  tags: readonly MediaTag[];
};

export const PHOTO_ASSETS: readonly MediaAsset[] = [
  { src: "/media/stock/stock-01.jpg", width: 1200, height: 701, alt: "Close-up of a soccer ball and cleats on the pitch", tags: ["ball", "challenge", "match"] },
  { src: "/media/stock/stock-02.jpg", width: 1200, height: 800, alt: "Night match under floodlights with players contesting the ball", tags: ["match", "open-play", "advantage"] },
  { src: "/media/stock/stock-03.jpg", width: 1200, height: 800, alt: "Close action near midfield during open play", tags: ["open-play", "duel", "match"] },
  { src: "/media/stock/stock-04.jpg", width: 1200, height: 1805, alt: "Portrait frame of a player with the ball", tags: ["attack", "open-play", "ball"] },
  { src: "/media/stock/stock-06.jpg", width: 1200, height: 1600, alt: "Tall frame of a player controlling the ball", tags: ["attack", "open-play", "ball"] },
  { src: "/media/stock/stock-07.jpg", width: 1200, height: 800, alt: "Match ball resting on the grass near the touchline", tags: ["ball", "match", "set-piece"] },
  { src: "/media/stock/stock-09.jpg", width: 1200, height: 1552, alt: "Portrait still of a player preparing a pass", tags: ["attack", "open-play", "advantage"] },
  { src: "/media/stock/stock-10.jpg", width: 1200, height: 800, alt: "Match action under stadium lights", tags: ["match", "open-play", "advantage"] },
  { src: "/media/stock/stock-11.jpg", width: 1200, height: 1200, alt: "Low angle of a player striking the ball near a defender", tags: ["challenge", "duel", "tackle"] },
  { src: "/media/stock/stock-12.jpg", width: 1200, height: 800, alt: "Wide shot of a soccer pitch during play", tags: ["match", "open-play", "offside"] },
  { src: "/media/stock/stock-13.jpg", width: 1200, height: 800, alt: "Attackers pressing high up the field", tags: ["attack", "offside", "advantage"] },
  { src: "/media/stock/stock-14.jpg", width: 1200, height: 800, alt: "Ball at a player's feet near the box", tags: ["ball", "goal", "dogso"] },
  { src: "/media/stock/stock-15.jpg", width: 1100, height: 1400, alt: "Tall crop of a player in possession", tags: ["attack", "open-play", "ball"] },
  { src: "/media/stock/stock-16.jpg", width: 1400, height: 933, alt: "Players contesting midfield possession in open play", tags: ["duel", "open-play", "match"] },
  { src: "/media/stock/stock-17.jpg", width: 1200, height: 671, alt: "Wide landscape of match movement", tags: ["match", "open-play", "offside"] },
  { src: "/media/stock/stock-18.jpg", width: 1200, height: 802, alt: "Players shaping up for a set piece", tags: ["set-piece", "handball", "arm"] },
  { src: "/media/stock/stock-19.jpg", width: 1400, height: 933, alt: "Aerial view of a packed stadium during a professional match", tags: ["match", "goal", "advantage"] },
  { src: "/media/stock/stock-20.jpg", width: 1200, height: 616, alt: "Low wide crop of an open pitch", tags: ["match", "offside", "open-play"] },
  { src: "/media/stock/stock-21.jpg", width: 1400, height: 900, alt: "Cleat planted on a soccer ball during control", tags: ["ball", "challenge", "simulation"] },
  { src: "/media/stock/stock-22.jpg", width: 1200, height: 800, alt: "Athlete in motion during a match", tags: ["open-play", "attack", "match"] },
  { src: "/media/stock/stock-23.jpg", width: 1400, height: 1867, alt: "Player striking through a soccer ball on turf", tags: ["challenge", "goal", "simulation", "ball"] },
  { src: "/media/stock/stock-24.jpg", width: 1400, height: 933, alt: "Empty pitch lines ready for match play", tags: ["match", "offside", "open-play"] },
  { src: "/media/stock/stock-25.jpg", width: 1400, height: 2105, alt: "Player mid-kick during a competitive challenge", tags: ["challenge", "tackle", "duel", "simulation"] },
  { src: "/media/stock/stock-26.jpg", width: 1000, height: 1400, alt: "Portrait match still near the touchline", tags: ["open-play", "attack", "match"] },
  { src: "/media/stock/stock-27.jpg", width: 900, height: 1200, alt: "Vertical crop of players competing for the ball", tags: ["duel", "challenge", "tackle"] },
  { src: "/media/stock/stock-28.jpg", width: 1000, height: 1000, alt: "Square crop of a player on the ball", tags: ["ball", "attack", "open-play"] },
  { src: "/media/stock/stock-29.jpg", width: 1200, height: 800, alt: "Stadium bowl during live play", tags: ["match", "advantage", "goal"] },
  { src: "/media/stock/stock-30.jpg", width: 800, height: 1200, alt: "Tall still of a cleat on a soccer ball", tags: ["ball", "challenge", "simulation"] },
  { src: "/media/stock/stock-31.jpg", width: 1400, height: 900, alt: "Wide landscape of a contested duel", tags: ["duel", "tackle", "challenge"] },
  { src: "/media/stock/stock-32.jpg", width: 1100, height: 1100, alt: "Square match still for feed variety", tags: ["match", "open-play", "duel"] },
  { src: "/media/stock/stock-33.jpg", width: 1280, height: 720, alt: "16:9 crop of match atmosphere", tags: ["match", "advantage", "open-play"] },
  { src: "/media/stock/stock-34.jpg", width: 900, height: 1400, alt: "Tall crop of a player looking upfield", tags: ["attack", "offside", "open-play"] },
  { src: "/media/stock/stock-35.jpg", width: 1280, height: 720, alt: "Wide still of a player with the ball", tags: ["attack", "ball", "open-play"] },
  { src: "/media/stock/stock-36.jpg", width: 900, height: 1200, alt: "Vertical sports action still", tags: ["challenge", "duel", "open-play"] },
  { src: "/media/stock/stock-37.jpg", width: 1200, height: 900, alt: "Landscape still from an open match", tags: ["match", "open-play", "advantage"] },
  { src: "/media/stock/stock-38.jpg", width: 1000, height: 1000, alt: "Square crop of players near midfield", tags: ["duel", "open-play", "match"] },
  { src: "/media/stock/stock-39.jpg", width: 1400, height: 933, alt: "Crowd and pitch during a live soccer match", tags: ["match", "goal", "advantage"] },
  { src: "/media/stock/stock-40.jpg", width: 900, height: 1400, alt: "Portrait still of a kick in motion", tags: ["challenge", "simulation", "ball"] },
  { src: "/media/cases/lunge-wide.png", width: 590, height: 782, alt: "Still of a low sliding challenge near midfield", tags: ["challenge", "tackle", "duel"] },
  { src: "/media/cases/handball-portrait.png", width: 502, height: 624, alt: "Portrait still of an arm near a contested ball", tags: ["handball", "arm", "challenge"] },
  { src: "/media/cases/handball-raised-arm.png", width: 752, height: 546, alt: "Still of a raised arm during a deflection", tags: ["handball", "arm", "set-piece"] },
  { src: "/media/cases/offside-square.png", width: 944, height: 622, alt: "Still of an attacking run against a defensive line", tags: ["offside", "attack", "open-play"] },
  { src: "/media/cases/offside-no-impact.png", width: 1036, height: 576, alt: "Wide still of an attacker in an offside position", tags: ["offside", "attack", "goal"] },
  { src: "/media/cases/dogso-landscape.png", width: 878, height: 614, alt: "Landscape still of a last-defender challenge", tags: ["dogso", "breakaway", "challenge"] },
  { src: "/media/cases/goalkeeper-tall.png", width: 742, height: 754, alt: "Tall still of a goalkeeper handling near the area", tags: ["keeper", "goal", "handball"] },
] as const;

/** Mixkit Free License soccer clips — posters extracted from the same footage. */
export const VIDEO_ASSETS: readonly VideoAsset[] = [
  {
    videoSrc: "/media/demo/clip-01.mp4",
    posterSrc: "/media/demo/poster-01.jpg",
    width: 1280,
    height: 720,
    alt: "One-on-one dribble and challenge on the pitch",
    tags: ["challenge", "duel", "tackle", "breakaway"],
  },
  {
    videoSrc: "/media/demo/clip-02.mp4",
    posterSrc: "/media/demo/poster-02.jpg",
    width: 1280,
    height: 720,
    alt: "Semi-pro match play at pitch level",
    tags: ["match", "open-play", "advantage", "duel"],
  },
  {
    videoSrc: "/media/demo/clip-03.mp4",
    posterSrc: "/media/demo/poster-03.jpg",
    width: 1280,
    height: 720,
    alt: "Breakaway one-on-one ending with a goalkeeper save",
    tags: ["breakaway", "dogso", "keeper", "goal"],
  },
  {
    videoSrc: "/media/demo/clip-04.mp4",
    posterSrc: "/media/demo/poster-04.jpg",
    width: 1280,
    height: 720,
    alt: "Team move finishing with a goal",
    tags: ["goal", "attack", "advantage", "open-play"],
  },
  {
    videoSrc: "/media/demo/clip-05.mp4",
    posterSrc: "/media/demo/poster-05.jpg",
    width: 1280,
    height: 720,
    alt: "Penalty kick viewed from behind the goal net",
    tags: ["set-piece", "goal", "keeper", "handball"],
  },
  {
    videoSrc: "/media/demo/clip-06.mp4",
    posterSrc: "/media/demo/poster-06.jpg",
    width: 1280,
    height: 720,
    alt: "Close shot of a player striking a penalty",
    tags: ["set-piece", "challenge", "simulation", "goal"],
  },
  {
    videoSrc: "/media/demo/clip-07.mp4",
    posterSrc: "/media/demo/poster-07.jpg",
    width: 1280,
    height: 720,
    alt: "Aerial view of a soccer match on grass",
    tags: ["offside", "match", "open-play", "attack"],
  },
  {
    videoSrc: "/media/demo/clip-08.mp4",
    posterSrc: "/media/demo/poster-08.jpg",
    width: 1280,
    height: 720,
    alt: "Striker shoots and the goalkeeper stops the shot",
    tags: ["keeper", "goal", "dogso", "breakaway"],
  },
] as const;

export function photoAt(index: number): MediaAsset {
  return PHOTO_ASSETS[((index % PHOTO_ASSETS.length) + PHOTO_ASSETS.length) % PHOTO_ASSETS.length]!;
}

/** Preferred media tags for each officiating category. */
export function tagsForCategory(category: string): readonly MediaTag[] {
  const key = category.toLowerCase();
  if (key.includes("serious foul") || key.includes("foul play")) {
    return ["challenge", "tackle", "duel"];
  }
  if (key.includes("handball")) {
    return ["handball", "arm", "set-piece"];
  }
  if (key.includes("offside")) {
    return ["offside", "attack", "open-play"];
  }
  if (key.includes("dogso") || key.includes("denial") || key.includes("goal-scoring")) {
    return ["dogso", "breakaway", "goal"];
  }
  if (key.includes("advantage")) {
    return ["advantage", "open-play", "attack"];
  }
  if (key.includes("simulation")) {
    return ["simulation", "challenge", "duel"];
  }
  if (key.includes("goalkeeper") || key.includes("keeper")) {
    return ["keeper", "goal", "handball"];
  }
  return ["match", "open-play"];
}

export function scoreTagOverlap(
  assetTags: readonly string[],
  wanted: readonly string[],
): number {
  if (wanted.length === 0) return 0;
  let score = 0;
  for (const tag of wanted) {
    if (assetTags.includes(tag)) score += 1;
  }
  return score;
}
