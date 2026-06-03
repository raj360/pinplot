# PlotPin — Sprint Tasks

## Strategic shift (June 2026)

**Product direction:** Open internationally for **discovery and diaspora tenants** while **Uganda remains primary supply market**. English-only UI. **Currency presentation** (not translation) so US/UK/EU users see familiar amounts—Stripe Checkout will mirror this later.

**Ads:** YouTube, Facebook, Instagram, TikTok → land on explore with geo-centered map + UTM tracking (Phase 6 infra; design hooks in Sprint 4).

**Featured listings:** Paid add-on later; **launch promo = first 20 verified listings globally** featured via admin grant / coupon / credit.

---

## Sprint 4 — Supply, wallet & international foundations (current)

**Slice 1 ✅ · Slice 2 ✅ · Slice 3 ✅**

| ID | Task | Status |
|----|------|--------|
| S4-01–S4-02, S4-E1–E5, S4-A1–A3 | Pricing, explore perf, admin edit | Done |
| S4-03–S4-12, S4-UX | Wallet, photos, reject, 429, auth resilience, tokens | Done |
| S4-14–S4-18 | International foundations + featured launch | Done |

**Prerequisites:**

```bash
yarn db:migrate   # required on each env (through 019)
```

Keep `ALLOW_DEV_UNLOCK=1` in dev/staging until Sprint 5.

---

### Sprint 4 — Slice 3 (international foundations) — **✅ complete**

| ID | Task | Status | Notes |
|----|------|--------|-------|
| S4-13 | **Explore geo bootstrap** | Polish left | Diaspora map default ✅; Near me ✅; **optional:** viewport URL persist; don’t auto-GPS on first load |
| S4-14 | **Country catalog** | Done | `017`; UG + 10 diaspora corridors |
| S4-15 | **Currency display layer** | Done | `018`; explore cards + building detail; API `currency` on summaries |
| S4-16 | **Viewer context** | Done | Profile → **Settings override** → localStorage → timezone → language → UG |
| S4-17 | **Explore empty state** | Done | Diaspora copy, browse Uganda, landlord CTA |
| S4-18 | **Featured launch program** | Done | `019`; `/admin/featured` batch grant; 20 × 90 days; audit log |

**Slice 3 polish shipped (post-acceptance):** Settings display country, featured admin skeleton/loading, header z-index vs explore filters.

**Acceptance (S4-13 + S4-15):** Diaspora in London, GPS denied → map UK area → UG listing shows `USh … (~£…)`; set **Settings → Display country → GB** or use `Europe/London` timezone. Ugandan user + GPS → Near me in Kampala.

---

### Sprint 4 — Slice 4 (homepage v2) — **in progress**

| ID    | Task               | Status      | Notes                                                                                                 |
| ----- | ------------------ | ----------- | ----------------------------------------------------------------------------------------------------- |
| S4-22 | **Homepage v2**    | In progress | D3 hero, featured grid (`GET /buildings/featured`), diaspora copy + FX hints                          |
| S4-24 | **D3 map hero**    | In progress | Explore-style teardrop pins + unlock story; location-aware country chip                               |
| S4-25 | **IP geolocation** | Done        | `/api/geo` edge headers → resolver precedence: override → profile → **IP** → timezone → language → UG |

**References:** `docs/PRD-HOMEPAGE-FEATURED-WALLET.md`, `docs/PLAN-HOMEPAGE-D3-HERO.md`

---

### Sprint 4 — Slice 5 (landlord + pricing) — **deferred until Stripe**

| ID | Task | Status | Notes |
|----|------|--------|-------|
| S4-19 | **Landlord country on create** | Deferred | UG-only supply today; needed when non-UG landlords list |
| S4-20 | **Pricing rules multi-country seed** | Deferred | Fee rows for US/GB checkout quotes — pair with S5-01 |

**Why defer:** Uganda-first supply; unlock/listing fees still use default UGX `PRICING` until Stripe checkout ships.

---

## Sprint 5 — Payments (**Stripe-first**)

**Gate:** S4-15 display layer ✅ · S4-20 pricing seed **before live multi-currency checkout**

| ID | Task | Status |
|----|------|--------|
| S5-01 | Stripe Checkout (diaspora unlock + listing fees) | Pending |
| S5-02–S5-08 | Webhooks, enforce fees, MoMo, USSD, paid featured | Pending |

---

## Product readiness checklist

| Milestone | Status |
|-----------|--------|
| Tenant discover → unlock → contact (dev) | ✅ |
| Landlord submit → admin approve/reject | ✅ |
| Wallet / coupons / welcome bonus | ✅ |
| Explore viewport search + filters + Near me | ✅ |
| Country catalog + diaspora map default | ✅ |
| FX display `(~£…)` on explore + detail | ✅ |
| Viewer country override (Settings) | ✅ |
| Explore empty state (diaspora + CTA) | ✅ |
| Featured launch (20 free, admin grant) | ✅ |
| Homepage v2 (featured + hero) | 🔄 S4-22 |
| Multi-country pricing rules | ⏸ S4-20 (before Stripe) |
| Stripe checkout | ❌ S5-01 |

---

## Recommended build order

```
Now:      S4-22 / S4-24         homepage featured grid + D3 hero
Then:     S5-01                  Stripe Checkout (diaspora presentment mirrors FX layer)
Before:   S4-19 → S4-20          landlord country + pricing seed (pair with Stripe)
Parallel: S4-13 polish           viewport persist; bootstrap GPS only on Near me click
Later:    S6                     UTM ad landing + Open Graph
```

---

*Last updated: 2026-06-03 — Slice 4 homepage v2 in progress; S4-19/20 deferred until Stripe*
