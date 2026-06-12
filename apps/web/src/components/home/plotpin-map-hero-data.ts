/** Static mock scene for the decorative homepage hero (matches explore pin language). */

export type HeroPin = {
  id: string;
  /** Ground anchor (pin tip) in viewBox units. */
  x: number;
  y: number;
  /** Label shown in the pin head — mirrors explore "available units" count. */
  label: string;
  /** Idle drift amplitude (px) — communicates "approximate location". */
  jitter: number;
  phase: number;
};

export const HERO_VIEWBOX = { width: 640, height: 420 } as const;

export const HERO_PINS: HeroPin[] = [
  { id: "pin-1", x: 148, y: 150, label: "3", jitter: 5, phase: 0 },
  { id: "pin-2", x: 250, y: 110, label: "1", jitter: 4, phase: 1.2 },
  { id: "pin-3", x: 360, y: 220, label: "5", jitter: 6, phase: 2.4 },
  { id: "pin-4", x: 395, y: 148, label: "2", jitter: 4, phase: 0.8 },
  { id: "pin-5", x: 385, y: 58, label: "4", jitter: 5, phase: 1.9 },
  { id: "pin-6", x: 210, y: 290, label: "1", jitter: 4, phase: 2.1 },
  { id: "pin-7", x: 372, y: 310, label: "2", jitter: 5, phase: 0.5 },
];

/** Distance the selected pin "snaps" from approximate → exact on unlock. */
export const HERO_UNLOCK_OFFSET = { dx: 10, dy: -8 } as const;

/** Per-pin spotlight beats (no global idle, instant handoff). */
export type HeroSpotlightBeat = "select" | "unlock" | "hold";

export const HERO_BEAT_DURATIONS_MS: Record<HeroSpotlightBeat, number> = {
  select: 1200,
  unlock: 1400,
  hold: 1600,
};

/** Brief pause when all pins are green before the cycle resets. */
export const HERO_CYCLE_PAUSE_MS = 2200;

export const HERO_BEAT_ORDER: HeroSpotlightBeat[] = ["select", "unlock", "hold"];

/** Soft neighborhood blocks (abstract fallback only). */
export const HERO_BLOCKS: Array<{
  x: number;
  y: number;
  w: number;
  h: number;
}> = [
  { x: 70, y: 70, w: 150, h: 90 },
  { x: 240, y: 60, w: 120, h: 110 },
  { x: 380, y: 80, w: 180, h: 100 },
  { x: 90, y: 190, w: 140, h: 120 },
  { x: 250, y: 200, w: 150, h: 100 },
  { x: 420, y: 200, w: 150, h: 130 },
];

export const HERO_ROADS: Array<Array<[number, number]>> = [
  [[40, 175], [600, 185]],
  [[230, 40], [235, 380]],
  [[40, 320], [600, 330]],
  [[400, 40], [410, 380]],
];

export function shufflePinIds(ids: string[]): string[] {
  const order = [...ids];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export function exactPinPosition(pin: HeroPin): { x: number; y: number } {
  return {
    x: pin.x + HERO_UNLOCK_OFFSET.dx,
    y: pin.y + HERO_UNLOCK_OFFSET.dy,
  };
}
