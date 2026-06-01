# PlotPin — Sprint Tasks

## Strategic shift (June 2026)

**Product direction:** Open internationally for **discovery and diaspora tenants** while **Uganda remains primary supply market**. English-only UI. **Currency presentation** (not translation) so US/UK/EU users see familiar amounts—Stripe Checkout will mirror this later.

**Ads:** YouTube, Facebook, Instagram, TikTok → land on explore with geo-centered map + UTM tracking (Phase 6 infra; design hooks in Sprint 4).

**Featured listings:** Paid add-on later; **launch promo = first 20 verified listings globally** featured via admin grant / coupon / credit.

---

## Sprint 4 — Supply, wallet & international foundations (current)

**Slice 1 ✅ merged**

| ID | Task | Status |
|----|------|--------|
| S4-01 | Pricing rules schema | Done — `012_pricing_rules`, UG seed |
| S4-02 | Quote API | Done — `GET /pricing/quote` |
| S4-05 | Landlord unit status UI | Done |
| S4-06 | Landlord unit status API | Done |
| S4-E1–E5 | Explore filters, perf, auth skeleton | Done |
| S4-A1 | Admin edit pending building | Done — pin, units, cover upload |
| S4-A2 | Admin exact pin on review | Done |
| S4-A3 | Admin loading UX | Done — `loading.tsx` + skeletons |

**Prerequisites:**

```bash
yarn db:migrate   # required on each env after merge (through 014)
```

Keep `ALLOW_DEV_UNLOCK=1` in dev/staging until Sprint 5.

---

### Sprint 4 — Slice 2 (wallet + UX) — **do next**

| ID | Task | Status | Notes |
|----|------|--------|-------|
| S4-03 | Wallet / credits foundation | Done | Migration `013`; `GET /wallet`; FIFO credit consume on unlock |
| S4-04 | Coupon codes (admin) | Done | Migration `014`; `POST /wallet/redeem-coupon`; `/admin/coupons` |
| S4-07 | Dynamic fee in unlock UX | Done | Quote API in unlock status + unlock panel (type + beds) |
| S4-08 | Welcome bonus | Done | `POST /profiles/sync` → 1× unlock credit, 90-day expiry |
| S4-09 | Landlord multi-photo UI | Pending | Cover + gallery on create/edit |
| S4-10 | Admin reject listing | Pending | Reason + landlord notification stub |
| S4-11 | Explore 429 UX | Pending | Friendly rate-limit message |
| S4-12 | Auth guard DB resilience | Pending | Transient pg errors in guards |

---

### Sprint 4 — Slice 3 (international foundations) — **parallel after S4-03**

| ID | Task | Status | Notes |
|----|------|--------|-------|
| S4-13 | **Explore geo bootstrap** | Pending | On load: try browser geolocation → center map + initial bounds search; persist last viewport; fallback chain: profile `country_code` centroid → Kampala |
| S4-14 | **Country catalog** | Pending | Extend `countries`: default map center, bounds, `display_locale` (e.g. `en-GB`), currency; seed UG, US, GB, KE (+ EU later) |
| S4-15 | **Currency display layer** | Pending | `formatMoney(amount, listingCurrency, viewerContext)` → primary + optional FX footnote; use ECB/Stripe rates cache (daily); rent stays in listing currency |
| S4-16 | **Viewer context** | Pending | Derive from profile country → else `navigator.language` + timezone hint → else UG; store preference in profile or localStorage |
| S4-17 | **Explore empty state** | Pending | No buildings in viewport: “No listings here yet” + CTA for landlords (English); don’t fake pins |
| S4-18 | **Featured launch program** | Pending | Admin grant or auto rule: first 20 verified `is_featured`; optional `featured_until`; uses wallet FEATURED_GRANT |

**Acceptance (S4-13 + S4-15):** Diaspora user in London opens `/explore` → map centers London → sees FX on UG listing if any in view; Ugandan user denied GPS → Kampala default.

---

### Sprint 4 — Slice 4 (admin + landlord polish)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| S4-19 | Landlord country on create | Pending | Default from profile; explicit country selector; drives pricing quote country |
| S4-20 | Pricing rules multi-country seed | Pending | US/GB fee rows (even if launch supply is UG-only) for diaspora checkout quotes |

---

## Sprint 5 — Payments (**Stripe-first**)

**Do not start until:** S4-03 wallet schema + S4-15 display layer merged.

| ID | Task | Status | Notes |
|----|------|--------|-------|
| S5-01 | **Stripe Checkout** | Pending | **First** — unlock + listing; presentment currency from viewer context; show localized amount on checkout page |
| S5-02 | Payment webhooks + idempotency | Pending | Settle wallet; receipt email stub |
| S5-03 | Enforce unlock fee | Pending | Credits first, then Stripe |
| S5-04 | Enforce listing fee | Pending | Before unit AVAILABLE |
| S5-05 | Flutterwave mobile money | Pending | Uganda MTN/Airtel |
| S5-06 | USSD flow | Pending | Provider TBD |
| S5-07 | SMS phone verification | Pending | Africa's Talking / Twilio |
| S5-08 | Featured listing checkout | Pending | Paid boost beyond launch 20 |

---

## Sprint 6 — Global launch & growth infra

| ID | Task | Notes |
|----|------|-------|
| S6-01 | UTM + ad attribution | `utm_source` persist; explore entry |
| S6-02 | Open Graph / share cards | Building + explore previews for social |
| S6-03 | Featured monetization | Self-serve or admin-priced slots |
| S6-04 | Superadmin pricing UI | Per-country rules without SQL |
| S6-05 | PWA manifest | `/sw.js` |
| S6-06 | Supply targets | 20–30 verified UG + diaspora corridor listings |

---

## Product readiness checklist

| Milestone | Status |
|-----------|--------|
| Tenant discover → unlock → contact (dev) | ✅ |
| Landlord submit → admin approve/edit | ✅ |
| Landlord unit status toggle | ✅ |
| Tiered pricing quote API | ✅ |
| Dynamic fees in UI | ✅ S4-07 |
| Wallet / coupons / welcome bonus | ✅ S4-03, S4-04, S4-08 |
| Map centers on user location | ❌ S4-13 |
| Dual-currency / viewer money display | ❌ S4-15 |
| Featured launch (20 free) | ❌ S4-18 |
| Stripe checkout | ❌ S5-01 |
| MoMo / USSD | ❌ S5-05, S5-06 |
| Social ad landing + UTM | ❌ S6-01 |

---

## Recommended build order (post–slice 1 merge)

```
Week A: S4-03 → S4-04 → S4-07 → S4-08     (wallet + visible pricing)
Week B: S4-13 → S4-14 → S4-15 → S4-16     (geo + currency display)
Week C: S4-09 → S4-10 → S4-18             (supply quality + featured launch)
Week D: S4-11 → S4-12 → S4-19 → S4-20     (stability + country on create)
        ── then Sprint 5 Stripe ──
```

---

## Admin setup (manual)

```sql
UPDATE profiles SET role = 'ADMIN' WHERE id = 'your-auth-user-uuid';
```

---

## Commands

```bash
yarn workspace @plotpin/shared-types build
yarn dev:api
yarn dev:web
yarn db:migrate
```

---

## Backlog (post–Sprint 6)

- Explore pagination + virtual list
- Saved searches
- SEO district pages (English)
- React Native
- Full UI i18n (explicit future sprint—not current scope)

---

*Last updated: 2026-06-01 — International strategy; Sprint 4 slice 1 merged; Stripe-first Sprint 5*
