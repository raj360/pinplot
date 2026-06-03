# PlotPin — Sprint Tasks

## Strategic shift (June 2026)

**Product direction:** Open internationally for **discovery and diaspora tenants** while **Uganda remains primary supply market**. English-only UI. **Currency presentation** (not translation) so US/UK/EU users see familiar amounts—Stripe Checkout will mirror this later.

**Ads:** YouTube, Facebook, Instagram, TikTok → land on `/` or explore with UTM tracking (Phase 6 infra).

**Featured listings:** Paid add-on later; **launch promo = first 20 verified listings globally** featured via admin grant / coupon / credit.

---

## Sprint 4 — Supply, wallet & international foundations — **✅ complete**

**Slice 1 ✅ · Slice 2 ✅ · Slice 3 ✅ · Slice 4 ✅**

| ID | Task | Status |
|----|------|--------|
| S4-01–S4-02, S4-E1–E5, S4-A1–A3 | Pricing, explore perf, admin edit | Done |
| S4-03–S4-12, S4-UX | Wallet, photos, reject, 429, auth resilience, tokens | Done |
| S4-14–S4-18 | International foundations + featured launch | Done |
| S4-22, S4-24, S4-25 | Homepage v2 + D3 hero + IP geolocation | Done |

**Prerequisites (all envs):**

```bash
yarn db:migrate   # through 019
```

Keep `ALLOW_DEV_UNLOCK=1` in dev/staging until Sprint 5 webhooks enforce payment.

---

### Sprint 4 — Slice 3 (international foundations) — **✅ complete**

| ID | Task | Status | Notes |
|----|------|--------|-------|
| S4-13 | **Explore geo bootstrap** | Polish left | Diaspora map default ✅; Near me ✅; **optional:** viewport URL persist; don’t auto-GPS on first load |
| S4-14 | **Country catalog** | Done | `017`; UG + 10 diaspora corridors |
| S4-15 | **Currency display layer** | Done | `018`; explore cards + building detail; API `currency` on summaries |
| S4-16 | **Viewer context** | Done | Settings override → localStorage → profile → **IP** → timezone → language → UG |
| S4-17 | **Explore empty state** | Done | Diaspora copy, browse Uganda, landlord CTA |
| S4-18 | **Featured launch program** | Done | `019`; `/admin/featured` batch grant; 20 × 90 days; audit log |
| S4-25 | **IP geolocation** | Done | `/api/geo` edge headers; session-cached client helper |

---

### Sprint 4 — Slice 4 (homepage v2) — **✅ complete**

| ID | Task | Status | Notes |
|----|------|--------|-------|
| S4-22 | **Homepage v2** | Done | Featured grid (`GET /buildings/featured`), diaspora copy + FX hints, value props, landlord CTA |
| S4-24 | **D3 map hero** | Done | Kampala SVG map; explore-style pins; rotating spotlight; greens persist per cycle; legend |

**References:** `docs/PRD-HOMEPAGE-FEATURED-WALLET.md`, `docs/PLAN-HOMEPAGE-D3-HERO.md`

**Optional follow-up:** Fine-tune `HERO_PINS` coordinates against final `kampala.svg` artwork.

---

### Sprint 4 — deferred until Stripe (pair with S5-01)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| S4-19 | **Landlord country on create** | Deferred | UG-only supply today; needed when non-UG landlords list |
| S4-20 | **Pricing rules multi-country seed** | Deferred | US/GB/corridor fee rows for `/pricing/quote` + checkout |

---

## Sprint 5 — Payments (**Stripe-first**) — **current**

**Gate:** S4-15 display layer ✅ · **S4-20 recommended** before live multi-currency checkout · remove dev unlock bypass when webhooks live

| ID | Task | Status | Notes |
|----|------|--------|-------|
| S5-01 | **Stripe Checkout** | Pending | Diaspora unlock + listing fees; presentment currency follows viewer context |
| S5-02 | **Stripe webhooks** | Pending | `checkout.session.completed`; idempotent unlock / listing credit |
| S5-03 | **Enforce fees** | Pending | Remove `ALLOW_DEV_UNLOCK` in prod; gate unlock + unit AVAILABLE on payment |
| S5-04–S5-06 | **Flutterwave / MoMo / USSD** | Pending | Uganda-local rails |
| S5-07 | **Wallet + Stripe reconciliation** | Pending | Ledger entries match webhook events |
| S5-08 | **Paid featured** | Pending | Stripe checkout for 7/14/30-day featured boost |

**Suggested Sprint 5 day-1 order:**

```
1. S4-20 pricing_rules seed (US/GB + corridors) — unblocks correct quotes
2. S5-01 Stripe Checkout (tenant unlock + landlord listing fee)
3. S5-02 webhooks + S5-03 enforce (turn off dev unlock in staging)
4. S5-08 paid featured (optional after core unlock loop)
5. S5-04+ MoMo when Stripe diaspora path is stable
```

---

## Product readiness checklist

| Milestone | Status |
|-----------|--------|
| Tenant discover → unlock → contact (dev) | ✅ |
| Landlord submit → admin approve/reject | ✅ |
| Wallet / coupons / welcome bonus | ✅ |
| Explore viewport search + filters + Near me | ✅ |
| Country catalog + diaspora map default | ✅ |
| FX display `(~£…)` on explore + detail + homepage | ✅ |
| Viewer country override (Settings) + IP geolocation | ✅ |
| Explore empty state (diaspora + CTA) | ✅ |
| Featured launch (20 free, admin grant) | ✅ |
| Homepage v2 (featured + hero) | ✅ |
| Multi-country pricing rules | ⏸ S4-20 (Sprint 5 prep) |
| Stripe checkout | ❌ S5-01 |

---

## Recommended build order

```
Now:      S5-01 → S5-02 → S5-03     Stripe Checkout + webhooks + enforce fees
With:     S4-20                      pricing_rules seed (same sprint as checkout)
Parallel: S4-13 polish               viewport persist; GPS only on Near me click
Later:    S6                         UTM ad landing + Open Graph + PWA
```

---

*Last updated: 2026-06-03 — Sprint 4 complete; Sprint 5 (Stripe) is next*
