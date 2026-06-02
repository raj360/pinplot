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
yarn db:migrate   # required on each env after merge (through 019)
```

Keep `ALLOW_DEV_UNLOCK=1` in dev/staging until Sprint 5.

---

### Sprint 4 — Slice 3 (international foundations) — **mostly complete**

| ID | Task | Status | Notes |
|----|------|--------|-------|
| S4-13 | **Explore geo bootstrap** | In progress | Diaspora defaults ✅; optional: viewport persist; bootstrap GPS only on Near me (polish) |
| S4-14 | **Country catalog** | Done | Migration `017`; UG + 10 diaspora corridors |
| S4-15 | **Currency display layer** | Done | Migration `018`; explore cards + building detail; API returns listing `currency` |
| S4-16 | **Viewer context** | Done | Profile → localStorage → **timezone → language** → UG |
| S4-17 | **Explore empty state** | Done | Diaspora copy + “Browse Uganda” + landlord CTA |
| S4-18 | **Featured launch program** | Done | Migration `019`; admin `/admin/featured` batch grant (20 × 90 days) |

**Acceptance (S4-13 + S4-15):** Diaspora user in London opens `/explore` → map centers London when GPS denied → UG listing shows rent + `~£` footnote; Ugandan user with GPS → Near me in Kampala.

---

### Sprint 4 — Slice 4 (admin + landlord polish)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| S4-19 | Landlord country on create | Pending | Default from profile; explicit country selector |
| S4-20 | Pricing rules multi-country seed | Pending | US/GB fee rows for diaspora checkout quotes |

---

## Sprint 5 — Payments (**Stripe-first**)

**Gate:** S4-15 display layer ✅ — Stripe work can start after S4-19/20 or in parallel.

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
| Country catalog + diaspora map default | ✅ |
| Dual-currency / viewer money display | ✅ explore + detail |
| Explore empty state (diaspora + CTA) | ✅ S4-17 |
| Featured launch (20 free) | ✅ S4-18 |
| Stripe checkout | ❌ S5-01 |

---

## Recommended build order

```
Now:     S4-19 → S4-20               (landlord country + pricing seed)
         ── Sprint 5 Stripe ──
Parallel: S4-13 persist viewport + bootstrap GPS polish
         S6-01 UTM + homepage           (after S4-22)
```

---

*Last updated: 2026-06-03 — S4-15/16/17/18 polish; migration 019*
