# PlotPin — Homepage D3 Hero Plan

**Status:** Plan only · **Implement after:** homepage layout shell (S4-22)  
**References:** [brackets-play D3 renderers](/Users/mac/Projects/kapeesa/current/brackets-play/lib/d3/), [web3.careers homepage motion](https://web3.career) (matrix + header band below nav)

---

## 1. Intent

A **subtle animated SVG hero** below the nav that communicates PlotPin’s core metaphor:

> **Browse approximate pins on a map → pay to unlock exact location + landlord contact.**

Similar *role* to web3.careers header motion (atmospheric, non-interactive, behind copy) — but **PlotPin-native**: map grid, clustered pins, one pin “unlocking” (jitter → exact).

**Not:** a full Google Map (cost, weight). **Yes:** D3-driven SVG, styled with PlotPin tokens.

---

## 2. Visual concept

```
┌─────────────────────────────────────────────────────────┐
│  [Nav]                                                  │
├─────────────────────────────────────────────────────────┤
│  Find rentals on the map          ┌──────────────────┐  │
│  Pay to unlock contact            │  ~ ~ ○ ○         │  │
│  [Open map] [List property]       │    ◎ ← unlock    │  │
│                                   │  ~ ~ ○           │  │
│                                   └─ D3 SVG hero ────┘  │
├─────────────────────────────────────────────────────────┤
│  Featured listings…                                     │
└─────────────────────────────────────────────────────────┘
```

### Animation beats (6–8s loop)

1. **Idle map grid** — faint neighborhood grid lines (Kampala-ish irregular grid, not geographic accuracy)
2. **Approximate pins** — 5–8 orange circles with **jitter** (~200m visual wobble, matches `APPROXIMATE_LOCATION_RADIUS_M` story)
3. **Hover/select one pin** — scale up, blue ring (matches explore active pin colors from `EXPLORE_MAP_PIN_COLORS`)
4. **Unlock pulse** — pin snaps to exact point; green ring; short “contact revealed” glyph (phone/chat icon, minimal)
5. **Reset** — fade jitter pins back; loop

### Aesthetic

- Flat colors from PlotPin CSS vars (`--map-pin-available`, `--map-pin-active`, `--map-pin-unlocked`)
- 2px border radius culture — sharp UI, soft pin circles OK
- No gradients, no 3D globe (contrast with web3.careers globe slider — PlotPin is **local map**, not global crypto)

---

## 3. Technical approach

### 3.1 Stack

| Piece | Choice |
|-------|--------|
| Library | `d3` (v7+) — already familiar from brackets-play |
| Container | React client component `PlotPinMapHero.tsx` |
| Output | Single `<svg viewBox="0 0 640 400">` |
| Animation | `d3.transition()` + `requestAnimationFrame` loop OR d3 timer |
| Data | **Static mock** coordinates in component (no API) |

### 3.2 Patterns borrowed from brackets-play

From `lib/d3/singleEliminationRenderer.ts`:

- `d3.select(svgElement)` lifecycle
- Group hierarchy: `svg > g.root > g.grid / g.pins / g.labels`
- `d3.zoom` — **do not use** on hero (non-interactive); brackets zoom is for exploration, hero is decorative
- Enter/update/exit joins for pin count changes (optional v2)
- `resize` observer to scale viewBox on mobile

From web3.careers:

- Fixed position / aspect hero band **below nav**, behind text (`z-index` layering)
- `prefers-reduced-motion: reduce` → static final frame
- Defer script until after hero text paints (LCP)

### 3.3 File structure (implementation)

```text
apps/web/src/components/home/
  PlotPinMapHero.tsx       # React wrapper, mounts SVG
  plotpin-map-hero.ts      # Pure D3 renderer (like singleEliminationRenderer.ts)
  plotpin-map-hero-data.ts # Mock pin positions + animation keyframes
```

### 3.4 Performance budget

- SVG nodes < 150
- One `requestAnimationFrame` loop when visible; **pause** when `document.hidden` or off-screen (`IntersectionObserver`)
- Target: < 5ms/frame on mid Android
- Bundle: dynamic `import('d3')` in hero component only — not on explore page

### 3.5 Accessibility

- `aria-hidden="true"` on decorative SVG
- Hero copy remains real `<h1>` / `<p>` for screen readers
- Reduced motion: show static SVG frame 3 (unlocked pin highlighted)

---

## 4. Layout integration

### Desktop

- Two-column hero: copy left (max-w-xl), SVG right (min 320px)
- SVG height ~ 280–360px

### Mobile

- Copy stacked above SVG
- SVG full width, height 220px
- Reduce pin count to 5 for clarity

### Homepage page.tsx order

1. `AppHeader`
2. `HeroSection` (copy + `PlotPinMapHero`)
3. `FeaturedListingsSection`
4. Value props
5. Footer

---

## 5. D3 renderer spec (pseudo-API)

```ts
export type PlotPinHeroOptions = {
  width: number;
  height: number;
  reducedMotion: boolean;
  colors: {
    grid: string;
    pinAvailable: string;
    pinActive: string;
    pinUnlocked: string;
    ring: string;
  };
};

export function renderPlotPinMapHero(
  svg: SVGSVGElement,
  options: PlotPinHeroOptions,
): { destroy: () => void };
```

**destroy()** cancels timers/transitions on unmount (critical for Next.js client navigation).

---

## 6. Animation state machine

```text
IDLE (2s) → JITTER (1.5s) → SELECT (0.5s) → UNLOCK (1.5s) → HOLD (1s) → IDLE
```

| State | Pin behavior |
|-------|--------------|
| IDLE | Static approximate positions |
| JITTER | `d3.timer` adds sin/cos offset per pin |
| SELECT | One pin scales 1→1.2, blue stroke |
| UNLOCK | Jitter stops; pin moves 8px to “exact”; green fill |
| HOLD | Contact icons fade in |
| IDLE | Transition back |

---

## 7. Sprint task (proposed)

| ID | Task | Estimate |
|----|------|----------|
| S4-24a | `plotpin-map-hero.ts` static render + grid | 0.5d |
| S4-24b | Animation loop + reduced motion | 0.5d |
| S4-24c | `PlotPinMapHero.tsx` + homepage layout | 0.5d |
| S4-24d | Mobile polish + perf (pause off-screen) | 0.25d |

**Total:** ~1.75 days · Can parallel S4-22 featured grid

---

## 8. Out of scope (v1)

- Real listing data in hero
- Clickable hero pins (CTA is “Open map” button)
- WebGL / Map ID / Google Maps
- Lottie/video fallback (consider only if D3 perf fails on low-end devices)

---

## 9. Success criteria

- [ ] Hero communicates map + unlock without reading body copy
- [ ] Lighthouse: no significant LCP regression vs static homepage
- [ ] Reduced-motion path works
- [ ] No Google Maps billing from `/`
- [ ] Visual consistency with explore pin colors
