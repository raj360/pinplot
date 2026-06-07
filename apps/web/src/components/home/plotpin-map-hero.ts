import * as d3 from "d3";
import {
  exactPinPosition,
  HERO_BEAT_DURATIONS_MS,
  HERO_BEAT_ORDER,
  HERO_BLOCKS,
  HERO_CYCLE_PAUSE_MS,
  HERO_PINS,
  HERO_ROADS,
  HERO_UNLOCK_OFFSET,
  HERO_VIEWBOX,
  shufflePinIds,
  type HeroPin,
  type HeroSpotlightBeat,
} from "./plotpin-map-hero-data";

export type PlotPinHeroColors = {
  surface: string;
  block: string;
  road: string;
  pinAvailable: string;
  pinAvailableText: string;
  pinActive: string;
  pinUnlocked: string;
  ring: string;
  ringUnlocked: string;
};

export type PlotPinHeroOptions = {
  width: number;
  height: number;
  reducedMotion: boolean;
  colors: PlotPinHeroColors;
  pinCount?: number;
  mapBackground?: boolean;
  showLegend?: boolean;
};

function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function appendMarker(
  group: d3.Selection<SVGGElement, HeroPin, null, undefined>,
  colors: PlotPinHeroColors,
) {
  group
    .append("circle")
    .attr("class", "hero-approx")
    .attr("cx", 0)
    .attr("cy", 2)
    .attr("r", 30)
    .attr("fill", colors.ring)
    .attr("opacity", 0);

  const marker = group.append("g").attr("class", "hero-marker");

  marker
    .append("path")
    .attr("class", "hero-tail")
    .attr("d", "M -6,-8 L 6,-8 L 0,0 Z");

  marker
    .append("rect")
    .attr("class", "hero-head")
    .attr("x", -15)
    .attr("y", -38)
    .attr("width", 30)
    .attr("height", 30)
    .attr("rx", 6);

  marker
    .append("text")
    .attr("class", "hero-label")
    .attr("x", 0)
    .attr("y", -19)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "central")
    .attr("font-size", 13)
    .attr("font-weight", 700)
    .text((d) => d.label);
}

function appendLegend(
  root: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  colors: PlotPinHeroColors,
  width: number,
  height: number,
) {
  const items = [
    { label: "Browse free", fill: colors.pinAvailable },
    { label: "Selected", fill: colors.pinActive },
    { label: "Unlocked", fill: colors.pinUnlocked },
  ] as const;

  const padX = 10;
  const padTop = 8;
  const padBottom = 6;
  const rowGap = 14;
  const boxW = 118;
  const boxH = padTop + items.length * rowGap + padBottom;
  const x = width - boxW - 12;
  const y = height - boxH - 10;

  const legend = root.append("g").attr("class", "hero-legend");
  legend
    .append("rect")
    .attr("x", x)
    .attr("y", y)
    .attr("width", boxW)
    .attr("height", boxH)
    .attr("rx", 6)
    .attr("fill", "#ffffff")
    .attr("opacity", 0.94)
    .attr("filter", "url(#hero-pin-shadow)");

  items.forEach((item, i) => {
    const rowCenterY = y + padTop + i * rowGap + rowGap / 2;
    const icon = legend
      .append("g")
      .attr("transform", `translate(${x + padX},${rowCenterY})`);
    // Mini pin drawn around y=0 so it aligns with label cap-height.
    icon
      .append("rect")
      .attr("x", -5.5)
      .attr("y", -5)
      .attr("width", 11)
      .attr("height", 7)
      .attr("rx", 2)
      .attr("fill", item.fill);
    icon
      .append("path")
      .attr("d", "M -3,2 L 3,2 L 0,5 Z")
      .attr("fill", item.fill);
    legend
      .append("text")
      .attr("x", x + padX + 14)
      .attr("y", rowCenterY + 0.5)
      .attr("dominant-baseline", "central")
      .attr("font-size", 10)
      .attr("fill", "#475569")
      .text(item.label);
  });
}

function buildContactCard(
  root: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  colors: PlotPinHeroColors,
) {
  const card = root.append("g").attr("class", "hero-contact").attr("opacity", 0);
  const inner = card.append("g").attr("class", "hero-contact-inner");
  inner
    .append("rect")
    .attr("width", 150)
    .attr("height", 52)
    .attr("rx", 8)
    .attr("fill", "#ffffff")
    .attr("filter", "url(#hero-pin-shadow)");
  inner
    .append("circle")
    .attr("cx", 26)
    .attr("cy", 26)
    .attr("r", 13)
    .attr("fill", colors.pinUnlocked);
  inner
    .append("text")
    .attr("x", 26)
    .attr("y", 27)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "central")
    .attr("font-size", 13)
    .attr("fill", "#ffffff")
    .text("\u2713");
  inner
    .append("text")
    .attr("x", 48)
    .attr("y", 19)
    .attr("font-size", 11)
    .attr("font-weight", 700)
    .attr("fill", "#0f172a")
    .text("Contact unlocked");
  inner
    .append("text")
    .attr("x", 48)
    .attr("y", 35)
    .attr("font-size", 10)
    .attr("fill", "#64748b")
    .text("+256 7•• ••• •••");
  return { card, inner };
}

const CONTACT_CARD_W = 150;
const CONTACT_CARD_H = 52;

function positionContactCard(
  inner: d3.Selection<SVGGElement, unknown, null, undefined>,
  pinX: number,
  pinY: number,
  viewWidth: number,
  viewHeight: number,
) {
  const margin = 10;
  const gap = 14;

  // Place card to the right of the pin by default; flip left when near the edge.
  let cardX = pinX + gap;
  if (cardX + CONTACT_CARD_W > viewWidth - margin) {
    cardX = pinX - CONTACT_CARD_W - gap;
  }
  cardX = Math.max(margin, Math.min(cardX, viewWidth - CONTACT_CARD_W - margin));

  let cardY = pinY - 88;
  cardY = Math.max(margin, Math.min(cardY, viewHeight - CONTACT_CARD_H - margin));

  inner.attr("transform", `translate(${cardX},${cardY})`);
}

export function renderPlotPinMapHero(
  svg: SVGSVGElement,
  options: PlotPinHeroOptions,
): { destroy: () => void } {
  const pins = HERO_PINS.slice(0, options.pinCount ?? HERO_PINS.length);
  const { colors, reducedMotion } = options;
  const { width, height } = HERO_VIEWBOX;

  const root = d3.select(svg);
  root.selectAll("*").remove();
  root
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid slice");

  const defs = root.append("defs");
  const glow = defs.append("filter").attr("id", "hero-pin-shadow").attr("height", "160%");
  glow
    .append("feDropShadow")
    .attr("dx", 0)
    .attr("dy", 2)
    .attr("stdDeviation", 2)
    .attr("flood-color", "#0f172a")
    .attr("flood-opacity", 0.28);

  root
    .append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", options.mapBackground ? "transparent" : colors.surface);

  if (!options.mapBackground) {
    root
      .append("g")
      .selectAll("rect")
      .data(HERO_BLOCKS)
      .join("rect")
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y)
      .attr("width", (d) => d.w)
      .attr("height", (d) => d.h)
      .attr("rx", 10)
      .attr("fill", colors.block)
      .attr("opacity", 0.7);

    const line = d3
      .line<[number, number]>()
      .x((d) => d[0])
      .y((d) => d[1]);
    root
      .append("g")
      .selectAll("path")
      .data(HERO_ROADS)
      .join("path")
      .attr("d", (d) => line(d))
      .attr("fill", "none")
      .attr("stroke", colors.road)
      .attr("stroke-width", 6)
      .attr("stroke-linecap", "round")
      .attr("opacity", 0.6);
  } else {
    const vignette = defs
      .append("radialGradient")
      .attr("id", "hero-vignette")
      .attr("cx", "50%")
      .attr("cy", "50%")
      .attr("r", "70%");
    vignette.append("stop").attr("offset", "55%").attr("stop-color", "#000").attr("stop-opacity", 0);
    vignette.append("stop").attr("offset", "100%").attr("stop-color", "#000").attr("stop-opacity", 0.12);
    root
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "url(#hero-vignette)");
  }

  const pinGroups = root
    .append("g")
    .attr("class", "hero-pins")
    .selectAll<SVGGElement, HeroPin>("g.hero-pin")
    .data(pins, (d) => d.id)
    .join("g")
    .attr("class", "hero-pin");

  pinGroups.each(function () {
    appendMarker(d3.select<SVGGElement, HeroPin>(this), colors);
  });
  pinGroups.select<SVGElement>(".hero-marker").attr("filter", "url(#hero-pin-shadow)");

  const { card, inner } = buildContactCard(root, colors);

  if (options.showLegend !== false) {
    appendLegend(root, colors, width, height);
  }

  // --- Rotating spotlight state ---
  const unlockedIds = new Set<string>();
  let pinOrder = shufflePinIds(pins.map((p) => p.id));
  let orderIndex = 0;
  let activeId: string | null = pinOrder[0] ?? null;
  let beat: HeroSpotlightBeat | "cycle-pause" = reducedMotion ? "hold" : "select";
  let beatStartedAt = performance.now();
  let destroyed = false;
  let timer: d3.Timer | null = null;

  function resetCycle(now: number) {
    unlockedIds.clear();
    pinOrder = shufflePinIds(pins.map((p) => p.id));
    orderIndex = 0;
    activeId = pinOrder[0] ?? null;
    beat = "select";
    beatStartedAt = now;
  }

  function applyPinVisual(
    group: d3.Selection<SVGGElement, HeroPin, null, undefined>,
    pin: HeroPin,
    isUnlocked: boolean,
    isActive: boolean,
    progress: number,
  ) {
    const head = group.select(".hero-head");
    const tail = group.select(".hero-tail");
    const label = group.select(".hero-label");
    const approx = group.select(".hero-approx");
    const marker = group.select<SVGGElement>(".hero-marker");

    let fill = colors.pinAvailable;
    let textColor = colors.pinAvailableText;
    let scale = 1;
    let approxOpacity = 0;
    let approxColor = colors.ring;

    if (isUnlocked) {
      fill = colors.pinUnlocked;
      textColor = "#ffffff";
      scale = 1.15;
    } else if (isActive) {
      if (beat === "select") {
        const eased = easeInOut(progress);
        fill = d3.interpolateRgb(colors.pinAvailable, colors.pinActive)(eased);
        textColor = "#ffffff";
        scale = 1 + 0.25 * eased;
        approxOpacity = 0.16 * eased;
      } else if (beat === "unlock") {
        const eased = easeInOut(progress);
        fill = d3.interpolateRgb(colors.pinActive, colors.pinUnlocked)(eased);
        textColor = "#ffffff";
        scale = 1.25;
        approxOpacity = 0.16 * (1 - eased);
        approxColor = d3.interpolateRgb(colors.ring, colors.ringUnlocked)(eased);
      } else if (beat === "hold") {
        fill = colors.pinUnlocked;
        textColor = "#ffffff";
        scale = 1.15;
      }
    }

    head.attr("fill", fill);
    tail.attr("fill", fill);
    label.attr("fill", textColor);
    marker.attr("transform", `scale(${scale})`);
    approx.attr("opacity", approxOpacity).attr("fill", approxColor);
  }

  function pinPosition(
    pin: HeroPin,
    isUnlocked: boolean,
    isActive: boolean,
    progress: number,
    now: number,
  ): { x: number; y: number } {
    const exact = exactPinPosition(pin);

    if (isUnlocked) {
      return exact;
    }

    if (isActive && (beat === "unlock" || beat === "hold")) {
      const eased = beat === "unlock" ? easeInOut(progress) : 1;
      return {
        x: pin.x + HERO_UNLOCK_OFFSET.dx * eased,
        y: pin.y + HERO_UNLOCK_OFFSET.dy * eased,
      };
    }

    if (isActive && beat === "select") {
      return { x: pin.x, y: pin.y };
    }

    if (!reducedMotion) {
      const t = now / 1000;
      return {
        x: pin.x + Math.sin(t * 1.6 + pin.phase) * pin.jitter,
        y: pin.y + Math.cos(t * 1.4 + pin.phase) * pin.jitter,
      };
    }

    return { x: pin.x, y: pin.y };
  }

  function advanceBeat(now: number) {
    if (beat === "cycle-pause") {
      resetCycle(now);
      return;
    }

    const beatIdx = HERO_BEAT_ORDER.indexOf(beat);
    if (beatIdx < HERO_BEAT_ORDER.length - 1) {
      beat = HERO_BEAT_ORDER[beatIdx + 1];
      beatStartedAt = now;
      return;
    }

    // hold finished — pin stays green, hand off to next spotlight
    if (activeId) {
      unlockedIds.add(activeId);
    }

    orderIndex += 1;
    if (orderIndex >= pinOrder.length) {
      beat = "cycle-pause";
      activeId = null;
      beatStartedAt = now;
      return;
    }

    activeId = pinOrder[orderIndex] ?? null;
    beat = "select";
    beatStartedAt = now;
  }

  function renderFrame(now: number) {
    const duration =
      beat === "cycle-pause"
        ? HERO_CYCLE_PAUSE_MS
        : HERO_BEAT_DURATIONS_MS[beat];
    const elapsed = now - beatStartedAt;
    const progress = reducedMotion ? 1 : Math.min(1, elapsed / duration);

    let activeX = 0;
    let activeY = 0;
    let showCard = false;

    pinGroups.each(function (pin) {
      const isUnlocked = unlockedIds.has(pin.id);
      const isActive = pin.id === activeId;
      const group = d3.select<SVGGElement, HeroPin>(this);
      const pos = pinPosition(pin, isUnlocked, isActive, progress, now);

      group.attr("transform", `translate(${pos.x},${pos.y})`);
      applyPinVisual(group, pin, isUnlocked, isActive, progress);

      if (isActive && beat === "hold") {
        activeX = pos.x;
        activeY = pos.y;
        showCard = true;
      }
    });

    if (showCard) {
      positionContactCard(inner, activeX, activeY, width, height);
      card.attr("opacity", Math.min(1, elapsed / 500));
    } else {
      card.attr("opacity", 0);
    }

    if (!reducedMotion && elapsed >= duration) {
      advanceBeat(now);
    }
  }

  if (reducedMotion) {
    // Static: first three pins shown as unlocked
    pins.slice(0, 3).forEach((p) => unlockedIds.add(p.id));
    activeId = pins[3]?.id ?? null;
    beat = "hold";
    renderFrame(performance.now());
  } else {
    timer = d3.timer(() => {
      if (destroyed) return;
      if (typeof document !== "undefined" && document.hidden) return;
      renderFrame(performance.now());
    });
  }

  return {
    destroy() {
      destroyed = true;
      if (timer) timer.stop();
      root.selectAll("*").remove();
    },
  };
}
