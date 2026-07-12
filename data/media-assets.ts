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
  { src: "/media/stock/stock-01.jpg", width: 1200, height: 701, alt: "Close-up of a soccer ball and cleats on the pitch", tags: ["ball", "match"] },
  { src: "/media/stock/stock-02.jpg", width: 1200, height: 800, alt: "Night match under floodlights with players contesting the ball", tags: ["match", "open-play", "advantage"] },
  { src: "/media/stock/stock-03.jpg", width: 1200, height: 800, alt: "Nike match balls resting on turf near a goal", tags: ["ball", "match", "set-piece"] },
  { src: "/media/stock/stock-04.jpg", width: 1200, height: 1805, alt: "Portrait frame of a player with the ball", tags: ["attack", "open-play", "ball"] },
  { src: "/media/stock/stock-06.jpg", width: 1200, height: 1600, alt: "Tall frame of a player controlling the ball", tags: ["attack", "open-play", "ball"] },
  { src: "/media/stock/stock-07.jpg", width: 1200, height: 800, alt: "Match ball resting on the grass near the touchline", tags: ["ball", "match", "set-piece"] },
  { src: "/media/stock/stock-09.jpg", width: 1200, height: 1552, alt: "Portrait still of a player preparing a pass", tags: ["attack", "open-play", "advantage"] },
  { src: "/media/stock/stock-10.jpg", width: 1200, height: 800, alt: "Match action under stadium lights", tags: ["match", "open-play", "advantage"] },
  { src: "/media/stock/stock-11.jpg", width: 1200, height: 1200, alt: "Low angle of a player striking the ball near a defender", tags: ["challenge", "duel", "tackle", "simulation"] },
  { src: "/media/stock/stock-12.jpg", width: 1200, height: 800, alt: "Wide shot of a soccer pitch during play", tags: ["match", "open-play", "offside"] },
  { src: "/media/stock/stock-13.jpg", width: 1200, height: 800, alt: "Attackers pressing high up the field", tags: ["attack", "offside", "advantage"] },
  { src: "/media/stock/stock-14.jpg", width: 1200, height: 800, alt: "Ball at a player's feet near the box", tags: ["ball", "goal", "dogso"] },
  { src: "/media/stock/stock-15.jpg", width: 1100, height: 1400, alt: "Tall crop of a player in possession", tags: ["attack", "open-play", "ball"] },
  { src: "/media/stock/stock-16.jpg", width: 1400, height: 933, alt: "Players contesting midfield possession in open play", tags: ["duel", "open-play", "match"] },
  { src: "/media/stock/stock-17.jpg", width: 1200, height: 671, alt: "Wide landscape of match movement", tags: ["match", "open-play", "offside"] },
  // Honest tags only — this still is stadium atmosphere, not a handball teaching frame.
  { src: "/media/stock/stock-18.jpg", width: 1200, height: 802, alt: "Aerial view of a packed stadium during live play", tags: ["match", "goal"] },
  { src: "/media/stock/stock-19.jpg", width: 1400, height: 933, alt: "Aerial view of a packed stadium during a professional match", tags: ["match", "goal", "advantage"] },
  { src: "/media/stock/stock-20.jpg", width: 1200, height: 616, alt: "Low wide crop of an open pitch", tags: ["match", "offside", "open-play"] },
  { src: "/media/stock/stock-21.jpg", width: 1400, height: 900, alt: "Cleat planted on a soccer ball during control", tags: ["ball", "match"] },
  { src: "/media/stock/stock-22.jpg", width: 1200, height: 800, alt: "Athlete in motion during a match", tags: ["open-play", "attack", "match"] },
  { src: "/media/stock/stock-23.jpg", width: 1400, height: 1867, alt: "Player striking through a soccer ball on turf", tags: ["challenge", "goal", "ball"] },
  { src: "/media/stock/stock-24.jpg", width: 1400, height: 933, alt: "Empty pitch lines ready for match play", tags: ["match", "offside", "open-play"] },
  { src: "/media/stock/stock-25.jpg", width: 1400, height: 2105, alt: "Player mid-kick during a competitive challenge", tags: ["challenge", "tackle", "duel", "simulation"] },
  { src: "/media/stock/stock-26.jpg", width: 1000, height: 1400, alt: "Portrait match still near the touchline", tags: ["open-play", "attack", "match"] },
  { src: "/media/stock/stock-27.jpg", width: 900, height: 1200, alt: "Vertical crop of players competing for the ball", tags: ["duel", "challenge", "tackle"] },
  { src: "/media/stock/stock-28.jpg", width: 1000, height: 1000, alt: "Square crop of a player on the ball", tags: ["ball", "attack", "open-play"] },
  { src: "/media/stock/stock-29.jpg", width: 1200, height: 800, alt: "Stadium bowl during live play", tags: ["match", "advantage", "goal"] },
  { src: "/media/stock/stock-30.jpg", width: 800, height: 1200, alt: "Tall still of a cleat on a soccer ball", tags: ["ball", "match"] },
  { src: "/media/stock/stock-31.jpg", width: 1400, height: 900, alt: "Wide landscape of a contested duel", tags: ["duel", "tackle", "challenge"] },
  { src: "/media/stock/stock-32.jpg", width: 1100, height: 1100, alt: "Square match still for feed variety", tags: ["match", "open-play", "duel"] },
  { src: "/media/stock/stock-33.jpg", width: 1280, height: 720, alt: "16:9 crop of match atmosphere", tags: ["match", "advantage", "open-play"] },
  { src: "/media/stock/stock-34.jpg", width: 900, height: 1400, alt: "Tall crop of a player looking upfield", tags: ["attack", "offside", "open-play"] },
  { src: "/media/stock/stock-35.jpg", width: 1280, height: 720, alt: "Wide still of a player with the ball", tags: ["attack", "ball", "open-play"] },
  { src: "/media/stock/stock-36.jpg", width: 900, height: 1200, alt: "Vertical sports action still", tags: ["challenge", "duel", "open-play"] },
  { src: "/media/stock/stock-37.jpg", width: 1200, height: 900, alt: "Landscape still from an open match", tags: ["match", "open-play", "advantage"] },
  { src: "/media/stock/stock-38.jpg", width: 1000, height: 1000, alt: "Square crop of players near midfield", tags: ["duel", "open-play", "match"] },
  { src: "/media/stock/stock-39.jpg", width: 1400, height: 933, alt: "Crowd and pitch during a live soccer match", tags: ["match", "goal", "advantage"] },
  { src: "/media/stock/stock-40.jpg", width: 900, height: 1400, alt: "Portrait still of a kick in motion", tags: ["challenge", "ball", "open-play"] },
  { src: "/media/cases/lunge-wide.png", width: 590, height: 782, alt: "Still of a low sliding challenge near midfield", tags: ["challenge", "tackle", "duel"] },
  { src: "/media/cases/handball-portrait.png", width: 502, height: 624, alt: "Sliding challenge where a defender's arm is near a contested ball", tags: ["handball", "arm", "challenge", "tackle"] },
  { src: "/media/cases/handball-raised-arm.png", width: 752, height: 546, alt: "Goal-line still used for a handball-to-penalty teaching sequence", tags: ["handball", "arm", "goal", "set-piece"] },
  { src: "/media/cases/offside-square.png", width: 944, height: 622, alt: "Still of an attacking run against a defensive line", tags: ["offside", "attack", "open-play"] },
  { src: "/media/cases/offside-no-impact.png", width: 1036, height: 576, alt: "Wide still of an attacker in an offside position", tags: ["offside", "attack", "goal"] },
  { src: "/media/cases/dogso-landscape.png", width: 878, height: 614, alt: "Landscape still of a last-defender challenge", tags: ["dogso", "breakaway", "challenge"] },
  { src: "/media/cases/goalkeeper-tall.png", width: 742, height: 754, alt: "Tall still of a goalkeeper handling near the area", tags: ["keeper", "goal", "handball"] },
] as const;

/**
 * Mixkit Free License MATCH-PLAY soccer only.
 * Downloaded from https://mixkit.co/free-stock-video/soccer/
 *
 * Filenames live under /media/demo/pitch/pitch-* so browsers/CDNs cannot keep
 * serving the old beach drone files that used to sit at /media/demo/clip-*.mp4.
 * Posters are extracted from the same mp4.
 */
export const VIDEO_ASSETS: readonly VideoAsset[] = [
  {
    videoSrc: "/media/demo/pitch/pitch-01.mp4",
    posterSrc: "/media/demo/pitch/pitch-01.jpg",
    width: 1280,
    height: 720,
    alt: "One-on-one dribble and challenge during a match",
    tags: ["challenge", "duel", "tackle", "breakaway", "simulation"],
  },
  {
    videoSrc: "/media/demo/pitch/pitch-02.mp4",
    posterSrc: "/media/demo/pitch/pitch-02.jpg",
    width: 1280,
    height: 720,
    alt: "Semi-pro match play filmed at pitch level",
    tags: ["match", "open-play", "advantage", "duel"],
  },
  {
    videoSrc: "/media/demo/pitch/pitch-03.mp4",
    posterSrc: "/media/demo/pitch/pitch-03.jpg",
    width: 1280,
    height: 720,
    alt: "Breakaway one-on-one ending with a goalkeeper save",
    tags: ["breakaway", "dogso", "keeper", "goal"],
  },
  {
    videoSrc: "/media/demo/pitch/pitch-04.mp4",
    posterSrc: "/media/demo/pitch/pitch-04.jpg",
    width: 1280,
    height: 720,
    alt: "Team move finishing with a goal in open play",
    tags: ["goal", "attack", "advantage", "open-play"],
  },
  {
    videoSrc: "/media/demo/pitch/pitch-05.mp4",
    posterSrc: "/media/demo/pitch/pitch-05.jpg",
    width: 1280,
    height: 720,
    alt: "Penalty kick viewed from behind the goal net",
    tags: ["set-piece", "goal", "keeper"],
  },
  {
    videoSrc: "/media/demo/pitch/pitch-06.mp4",
    posterSrc: "/media/demo/pitch/pitch-06.jpg",
    width: 1280,
    height: 720,
    alt: "Close shot of a player striking a penalty",
    tags: ["set-piece", "challenge", "goal"],
  },
  {
    videoSrc: "/media/demo/pitch/pitch-07.mp4",
    posterSrc: "/media/demo/pitch/pitch-07.jpg",
    width: 1280,
    height: 720,
    alt: "Aerial view of a live soccer match on grass",
    tags: ["offside", "match", "open-play", "attack"],
  },
  {
    videoSrc: "/media/demo/pitch/pitch-08.mp4",
    posterSrc: "/media/demo/pitch/pitch-08.jpg",
    width: 1280,
    height: 720,
    alt: "Two teams contesting the ball in open match play",
    tags: ["match", "duel", "open-play", "challenge", "simulation"],
  },
  {
    videoSrc: "/media/demo/pitch/pitch-09.mp4",
    posterSrc: "/media/demo/pitch/pitch-09.jpg",
    width: 1280,
    height: 720,
    alt: "Semi-professional night match on synthetic turf",
    tags: ["match", "open-play", "advantage", "attack"],
  },
  {
    videoSrc: "/media/demo/pitch/pitch-10.mp4",
    posterSrc: "/media/demo/pitch/pitch-10.jpg",
    width: 1280,
    height: 720,
    alt: "Player setting the ball and striking a penalty",
    tags: ["set-piece", "goal", "challenge"],
  },
  {
    videoSrc: "/media/demo/pitch/pitch-11.mp4",
    posterSrc: "/media/demo/pitch/pitch-11.jpg",
    width: 1280,
    height: 720,
    alt: "Goalkeeper set in the goal during live play",
    tags: ["keeper", "goal", "dogso"],
  },
  {
    videoSrc: "/media/demo/pitch/pitch-12.mp4",
    posterSrc: "/media/demo/pitch/pitch-12.jpg",
    width: 1280,
    height: 720,
    alt: "Attacker controlling the ball and shooting on goal",
    tags: ["attack", "goal", "breakaway", "open-play"],
  },
  {
    videoSrc: "/media/demo/pitch/pitch-13.mp4",
    posterSrc: "/media/demo/pitch/pitch-13.jpg",
    width: 1280,
    height: 720,
    alt: "Throw-in restart during a semi-pro match",
    tags: ["set-piece", "match", "open-play", "advantage"],
  },
  {
    videoSrc: "/media/demo/pitch/pitch-14.mp4",
    posterSrc: "/media/demo/pitch/pitch-14.jpg",
    width: 1280,
    height: 720,
    alt: "Player places the ball and drives a shot at goal",
    tags: ["set-piece", "goal", "attack", "challenge"],
  },
  {
    videoSrc: "/media/demo/pitch/pitch-15.mp4",
    posterSrc: "/media/demo/pitch/pitch-15.jpg",
    width: 1280,
    height: 720,
    alt: "Youth training shot with a goalkeeper set in goal",
    tags: ["keeper", "goal", "challenge", "open-play"],
  },
  {
    videoSrc: "/media/demo/pitch/pitch-16.mp4",
    posterSrc: "/media/demo/pitch/pitch-16.jpg",
    width: 1280,
    height: 720,
    alt: "Players walking onto a grass pitch with a match ball",
    tags: ["match", "open-play", "set-piece"],
  },
  {
    videoSrc: "/media/demo/pitch/pitch-17.mp4",
    posterSrc: "/media/demo/pitch/pitch-17.jpg",
    width: 1280,
    height: 720,
    alt: "Penalty kick saved by a goalkeeper at close range",
    tags: ["set-piece", "keeper", "goal", "dogso"],
  },
  {
    videoSrc: "/media/demo/pitch/pitch-18.mp4",
    posterSrc: "/media/demo/pitch/pitch-18.jpg",
    width: 1280,
    height: 720,
    alt: "Evening park pitch with a goal in the background",
    tags: ["goal", "match", "open-play", "attack"],
  },
  {
    videoSrc: "/media/demo/pitch/pitch-19.mp4",
    posterSrc: "/media/demo/pitch/pitch-19.jpg",
    width: 1280,
    height: 720,
    alt: "Three players contesting a ball on a hard court",
    tags: ["duel", "challenge", "open-play", "tackle"],
  },
  {
    videoSrc: "/media/demo/pitch/pitch-20.mp4",
    posterSrc: "/media/demo/pitch/pitch-20.jpg",
    width: 1280,
    height: 720,
    alt: "Top-down view of the center spot on a grass pitch",
    tags: ["set-piece", "match", "offside"],
  },
  {
    videoSrc: "/media/demo/pitch/pitch-21.mp4",
    posterSrc: "/media/demo/pitch/pitch-21.jpg",
    width: 1280,
    height: 720,
    alt: "Archival match play with a packed crowd behind the touchline",
    tags: ["match", "open-play", "duel", "challenge"],
  },
  {
    videoSrc: "/media/demo/pitch/pitch-22.mp4",
    posterSrc: "/media/demo/pitch/pitch-22.jpg",
    width: 1280,
    height: 720,
    alt: "Vintage match action with a referee near the touchline",
    tags: ["match", "challenge", "duel", "open-play"],
  },
  {
    videoSrc: "/media/demo/pitch/pitch-23.mp4",
    posterSrc: "/media/demo/pitch/pitch-23.jpg",
    width: 1280,
    height: 720,
    alt: "Historic grass-pitch contest with striped kits and a full stand",
    tags: ["match", "attack", "open-play", "advantage"],
  },
  {
    videoSrc: "/media/demo/pitch/pitch-24.mp4",
    posterSrc: "/media/demo/pitch/pitch-24.jpg",
    width: 1280,
    height: 720,
    alt: "Archival midfield scramble during a packed stadium match",
    tags: ["duel", "challenge", "match", "tackle"],
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
    // Do not include set-piece — penalty clips would weakly match and drift from copy.
    return ["handball", "arm"];
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
    return ["keeper", "goal"];
  }
  if (key.includes("dissent") || key.includes("misconduct")) {
    return ["match", "open-play"];
  }
  if (key.includes("holding") || key.includes("penalty area")) {
    return ["set-piece", "goal", "challenge"];
  }
  if (key.includes("restart")) {
    return ["set-piece", "match"];
  }
  return ["match", "open-play"];
}

/**
 * Specialty categories must hit at least one of these primary tags.
 * Stops weak overlaps (e.g. handball ↔ set-piece) from attaching unrelated media.
 */
export function primaryTagsForCategory(category: string): readonly MediaTag[] | null {
  const key = category.toLowerCase();
  if (key.includes("handball")) return ["handball", "arm"];
  if (key.includes("offside")) return ["offside"];
  if (key.includes("dogso") || key.includes("denial") || key.includes("goal-scoring")) {
    return ["dogso", "breakaway"];
  }
  if (key.includes("goalkeeper") || key.includes("keeper")) return ["keeper"];
  if (key.includes("simulation")) return ["simulation"];
  if (key.includes("serious foul") || key.includes("foul play")) {
    return ["tackle", "challenge", "duel"];
  }
  return null;
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

/** True when the asset is tag-safe to attach to this category. */
export function matchesCategory(
  assetTags: readonly string[],
  category: string,
  minScore: number,
): boolean {
  const wanted = tagsForCategory(category);
  if (scoreTagOverlap(assetTags, wanted) < minScore) return false;
  const primary = primaryTagsForCategory(category);
  if (!primary) return true;
  return primary.some((tag) => assetTags.includes(tag));
}
