# PlotPin — Sprint Tasks

## Strategic shift (June 2026)

**Product direction:** Open internationally for **discovery and diaspora tenants** while **Uganda remains primary supply market**. English-only UI. **Currency presentation** (not translation) so US/UK/EU users see familiar amounts—Stripe Checkout will mirror this later.

**Ads:** YouTube, Facebook, Instagram, TikTok → land on explore with geo-centered map + UTM tracking (Phase 6 infra; design hooks in Sprint 4).

**Featured listings:** Paid add-on later; **launch promo = first 20 verified listings globally** featured via admin grant / coupon / credit.

---

## Sprint 4 — Supply, wallet & international foundations (current)

**Slice 1 ✅ merged · Slice 2 ✅ complete**

| ID | Task | Status |
|----|------|--------|
| S4-01–S4-02, S4-E1–E5, S4-A1–A3 | Pricing, explore perf, admin edit | Done |
| S4-03–S4-12, S4-UX | Wallet, photos, reject, 429, auth resilience, tokens | Done |

**Prerequisites:**

```bash
yarn db:migrate   # required on each env after merge (through 018)
```

Keep `ALLOW_DEV_UNLOCK=1` in dev/staging until Sprint 5.

---

### Sprint 4 — Slice 3 (international foundations) — **in progress**

| ID | Task | Status | Notes |
|----|------|--------|-------|
| S4-13 | **Explore geo bootstrap** | In progress | Phase A+B done; diaspora defaults via S4-14/16 ✅ wired in bootstrap |
| S4-14 | **Country catalog** | Done | Migration `017`; `GET /countries`; seed UG + 10 diaspora corridors (GB, US, KE, TZ, RW, NG, ZA, AE, CA, DE) |
| S4-15 | **Currency display layer** | Done | Migration `018`; `GET /fx/rates`; `formatMoney` + FX footnote on explore cards |
| S4-16 | **Viewer context** | Done | Profile → localStorage → browser locale/tz → UG; `ViewerContextProvider` |
| S4-17 | **Explore empty state** | Pending | “No listings here yet” + landlord CTA |
| S4-18 | **Featured launch program** | Pending | Admin grant; first 20 verified featured |

**Acceptance (S4-13 + S4-15):** Diaspora user in London opens `/explore` → map centers London when GPS denied → UG listing shows rent + `~£` footnote; Ugandan user with GPS → Near me in Kampala.

---

### Sprint 4 — Slice 4 (admin + landlord polish)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| S4-19 | Landlord country on create | Pending | Default from profile; explicit country selector |
| S4-20 | Pricing rules multi-country seed | Pending | US/GB fee rows for diaspora checkout quotes |

---

## Sprint 5 — Payments (**Stripe-first**)

**Gate:** S4-15 display layer ✅ merged — Stripe work can start after S4-17/18 or in parallel.

| ID | Task | Status |
|----|------|--------|
| S5-01 | Stripe Checkout | Pending |
| S5-02–S5-08 | Webhooks, enforce fees, MoMo, USSD, featured checkout | Pending |

---

## Product readiness checklist

| Milestone | Status |
|-----------|--------|
| Tenant discover → unlock → contact (dev) | ✅ |
| Landlord submit → admin approve/reject | ✅ |
| Wallet / coupons / welcome bonus | ✅ |
| Explore viewport search + filters + Near me | ✅ |
| Slice 2 stability (429, auth DB retry) | ✅ |
| Country catalog + diaspora map default | ✅ S4-14, S4-16 |
| Dual-currency / viewer money display | ✅ S4-15 |
| Featured launch (20 free) | ❌ S4-18 |
| Stripe checkout | ❌ S5-01 |

---

## Recommended build order

```
Now:     S4-17 → S4-18              (empty state, featured launch)
Then:    S4-19 → S4-20               (landlord country + pricing seed)
         ── Sprint 5 Stripe ──
Parallel: S4-13 persist viewport     (optional polish)
         S6-01 UTM + homepage         (after S4-18 / S4-22)
```

---

*Last updated: 2026-06-02 — Slice 2 complete; S4-14/15/16 shipped*
