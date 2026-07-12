/** Real photo / video assets only — no SVG placeholders. */

export type MediaAsset = {
  src: string;
  width: number;
  height: number;
  alt: string;
};

export const PHOTO_ASSETS: readonly MediaAsset[] = [
  { src: "/media/stock/stock-01.jpg", width: 1200, height: 701, alt: "Players contesting the ball on a green pitch" },
  { src: "/media/stock/stock-02.jpg", width: 1200, height: 800, alt: "Stadium crowd during a soccer match" },
  { src: "/media/stock/stock-03.jpg", width: 1200, height: 800, alt: "Close action near midfield" },
  { src: "/media/stock/stock-04.jpg", width: 1200, height: 1805, alt: "Portrait frame of a player with the ball" },
  { src: "/media/stock/stock-06.jpg", width: 1200, height: 1600, alt: "Tall frame of a player controlling the ball" },
  { src: "/media/stock/stock-07.jpg", width: 1200, height: 800, alt: "Open play stretching toward the touchline" },
  { src: "/media/stock/stock-09.jpg", width: 1200, height: 1552, alt: "Portrait still of a player preparing a pass" },
  { src: "/media/stock/stock-10.jpg", width: 1200, height: 800, alt: "Match action under stadium lights" },
  { src: "/media/stock/stock-11.jpg", width: 1200, height: 1200, alt: "Square crop of a contested header" },
  { src: "/media/stock/stock-12.jpg", width: 1200, height: 800, alt: "Wide shot of a soccer pitch during play" },
  { src: "/media/stock/stock-13.jpg", width: 1200, height: 800, alt: "Attackers pressing high up the field" },
  { src: "/media/stock/stock-14.jpg", width: 1200, height: 800, alt: "Ball at a player's feet near the box" },
  { src: "/media/stock/stock-15.jpg", width: 1100, height: 1400, alt: "Tall crop of a player in possession" },
  { src: "/media/stock/stock-16.jpg", width: 1200, height: 783, alt: "Indoor court action used as ambient match still" },
  { src: "/media/stock/stock-17.jpg", width: 1200, height: 671, alt: "Wide landscape of match movement" },
  { src: "/media/stock/stock-18.jpg", width: 1200, height: 802, alt: "Players shaping up for a set piece" },
  { src: "/media/stock/stock-19.jpg", width: 1200, height: 800, alt: "Training-ground challenge still" },
  { src: "/media/stock/stock-20.jpg", width: 1200, height: 616, alt: "Low wide crop of an open pitch" },
  { src: "/media/stock/stock-21.jpg", width: 1400, height: 900, alt: "Landscape still of a soccer ball in play" },
  { src: "/media/stock/stock-22.jpg", width: 1200, height: 800, alt: "Athlete in motion during a match" },
  { src: "/media/stock/stock-23.jpg", width: 1200, height: 1500, alt: "Portrait athletic still for a teaching post" },
  { src: "/media/stock/stock-24.jpg", width: 1200, height: 691, alt: "Wide sports action frame" },
  { src: "/media/stock/stock-25.jpg", width: 1200, height: 800, alt: "Grass pitch texture with match context" },
  { src: "/media/stock/stock-26.jpg", width: 1000, height: 1400, alt: "Portrait match still near the touchline" },
  { src: "/media/stock/stock-27.jpg", width: 900, height: 1200, alt: "Vertical crop of players competing" },
  { src: "/media/stock/stock-28.jpg", width: 1000, height: 1000, alt: "Square crop of a player on the ball" },
  { src: "/media/stock/stock-29.jpg", width: 1200, height: 800, alt: "Stadium bowl during live play" },
  { src: "/media/stock/stock-30.jpg", width: 800, height: 1200, alt: "Tall still of a soccer ball" },
  { src: "/media/stock/stock-31.jpg", width: 1400, height: 900, alt: "Wide landscape of a contested duel" },
  { src: "/media/stock/stock-32.jpg", width: 1100, height: 1100, alt: "Square match still for feed variety" },
  { src: "/media/stock/stock-33.jpg", width: 1280, height: 720, alt: "16:9 crop of match atmosphere" },
  { src: "/media/stock/stock-34.jpg", width: 900, height: 1400, alt: "Tall crop of a player looking upfield" },
  { src: "/media/stock/stock-35.jpg", width: 1280, height: 720, alt: "Wide still of a player with the ball" },
  { src: "/media/stock/stock-36.jpg", width: 900, height: 1200, alt: "Vertical sports action still" },
  { src: "/media/stock/stock-37.jpg", width: 1200, height: 900, alt: "Landscape still from an open match" },
  { src: "/media/stock/stock-38.jpg", width: 1000, height: 1000, alt: "Square crop of players near midfield" },
  { src: "/media/stock/stock-39.jpg", width: 1280, height: 720, alt: "Wide crop of a shot toward goal" },
  { src: "/media/stock/stock-40.jpg", width: 900, height: 1400, alt: "Portrait still of a kick in motion" },
  { src: "/media/cases/lunge-wide.png", width: 590, height: 782, alt: "Still of a low sliding challenge near midfield" },
  { src: "/media/cases/handball-portrait.png", width: 502, height: 624, alt: "Portrait still of an arm near a contested ball" },
  { src: "/media/cases/handball-raised-arm.png", width: 752, height: 546, alt: "Still of a raised arm during a deflection" },
  { src: "/media/cases/offside-square.png", width: 944, height: 622, alt: "Still of an attacking run against a defensive line" },
  { src: "/media/cases/offside-no-impact.png", width: 1036, height: 576, alt: "Wide still of an attacker in an offside position" },
  { src: "/media/cases/dogso-landscape.png", width: 878, height: 614, alt: "Landscape still of a last-defender challenge" },
  { src: "/media/cases/goalkeeper-tall.png", width: 742, height: 754, alt: "Tall still of a goalkeeper handling near the area" },
] as const;

export const VIDEO_ASSETS = [
  {
    videoSrc: "/media/demo/clip-01.mp4",
    posterSrc: "/media/stock/stock-01.jpg",
    width: 1280,
    height: 720,
    alt: "Short openly licensed demonstration clip of match movement",
  },
  {
    videoSrc: "/media/demo/clip-02.mp4",
    posterSrc: "/media/stock/stock-21.jpg",
    width: 1280,
    height: 720,
    alt: "Short openly licensed demonstration clip used for feed playback",
  },
] as const;

export function photoAt(index: number): MediaAsset {
  return PHOTO_ASSETS[((index % PHOTO_ASSETS.length) + PHOTO_ASSETS.length) % PHOTO_ASSETS.length]!;
}
