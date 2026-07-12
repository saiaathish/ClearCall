/**
 * Ambient media pool for the feed. Cases without their own asset (or repeat
 * appearances in the infinite mix) draw a random item from here so the stream
 * stays visually varied without shipping a large asset catalog.
 */
export interface MediaLibraryItem {
  id: string;
  src: string;
  width: number;
  height: number;
  alt: string;
  tags: readonly string[];
}

export const mediaLibrary: readonly MediaLibraryItem[] = [
  {
    id: "lib-lunge-wide",
    src: "/media/cases/lunge-wide.svg",
    width: 1600,
    height: 900,
    alt: "Diagram of a late challenge with low contact across the boot",
    tags: ["challenge", "serious-foul"],
  },
  {
    id: "lib-handball-portrait",
    src: "/media/cases/handball-portrait.svg",
    width: 900,
    height: 1400,
    alt: "Portrait diagram of an arm position near a contested ball",
    tags: ["handball"],
  },
  {
    id: "lib-offside-square",
    src: "/media/cases/offside-square.svg",
    width: 1200,
    height: 1200,
    alt: "Square diagram of an attacking run and defensive line",
    tags: ["offside"],
  },
  {
    id: "lib-dogso-landscape",
    src: "/media/cases/dogso-landscape.svg",
    width: 1600,
    height: 900,
    alt: "Landscape diagram of a last-defender challenge toward goal",
    tags: ["dogso"],
  },
  {
    id: "lib-goalkeeper-tall",
    src: "/media/cases/goalkeeper-tall.svg",
    width: 900,
    height: 1400,
    alt: "Tall diagram of a goalkeeper handling outside the penalty area",
    tags: ["goalkeeper"],
  },
  {
    id: "lib-field-lanes",
    src: "/media/library/field-lanes.svg",
    width: 1600,
    height: 900,
    alt: "Ambient pitch lanes used as a feed background diagram",
    tags: ["ambient", "pitch"],
  },
  {
    id: "lib-box-angle",
    src: "/media/library/box-angle.svg",
    width: 1400,
    height: 1050,
    alt: "Ambient penalty-area angle used as a feed background diagram",
    tags: ["ambient", "box"],
  },
  {
    id: "lib-midfield-press",
    src: "/media/library/midfield-press.svg",
    width: 1200,
    height: 1200,
    alt: "Ambient midfield press shape used as a feed background diagram",
    tags: ["ambient", "press"],
  },
];

export function mediaLibrarySrcs(): readonly string[] {
  return mediaLibrary.map((item) => item.src);
}
