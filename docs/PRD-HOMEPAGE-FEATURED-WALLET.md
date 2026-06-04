# PlotPin PRD — Homepage, Featured Listings, Wallet & Monetization

**Version:** 1.1 · **Status:** Partially superseded  
**Owner:** Product · **Last updated:** 2026-06-03  

> **Business model update:** Landlord **listing is free** (verified). Revenue = **tenant unlock** + optional **featured/badge** later. See [BUSINESS-MODEL.md](./BUSINESS-MODEL.md) and [IMPLEMENTATION-PLAN.md](./IMPLEMENTATION-PLAN.md).

**Related:** [docs/README.md](./README.md), [ROADMAP.md](../ROADMAP.md), [SPRINT_TASK.md](../SPRINT_TASK.md), [PLAN-HOMEPAGE-D3-HERO.md](./PLAN-HOMEPAGE-D3-HERO.md)

---

## 1. Summary

PlotPin monetizes map-first rental discovery primarily through **tenant unlock fees**, with **free verified landlord listings** and optional **featured boosts** (monetized ~3 months post-launch). Homepage combines **D3 hero**, **featured grid**, and CTAs into explore and landlord onboarding.

This PRD covers product requirements for:

- Homepage v2 (hero + featured + value props)
- Featured listings (launch promo + paid boost)
- Wallet & promotional credits (non-refundable, in-app only)
- Payment rails (Stripe diaspora + Flutterwave Uganda)

**Out of scope:** Full i18n, rent escrow, React Native, USSD (separate PRDs).

---

## 2. Problem & opportunity

| Stakeholder | Problem today | Opportunity |
|-------------|---------------|-------------|
| **Tenant / diaspora** | Lands on static homepage; map defaults to Kampala; fees shown only in UGX | Homepage proves supply; geo + FX feel global; featured listings convert ad traffic |
| **Landlord** | No visibility boost beyond explore sort | Paid featured = marketing SKU; first 20 free at launch |
| **PlotPin** | Revenue = $0 (dev unlock); only 2 fee types in quote API | Three revenue streams; wallet drives activation without cash refunds |

---

## 3. Goals & success metrics

### 3.1 Goals (90 days post–Stripe live)

1. Homepage → explore CTR ≥ **15%**
2. Featured card → building view ≥ **40%**
3. Unlock conversion on featured traffic ≥ **1.5×** non-featured baseline
4. **20+** verified featured listings visible at soft launch
5. **10%+** of active landlords buy paid featured after promo ends

### 3.2 Non-goals

- Collecting rent or security deposits
- Transferable wallet balance / P2P credits
- Maps embedded on homepage (cost + clutter)
- Automatic featured placement without verification

---

## 4. Personas & user stories

### Visitor (ad landing)

- See motion hero that communicates “map + unlock contact”
- See real featured listings immediately
- Click through to explore without signing in

### Tenant

- Receive **1 welcome unlock credit** on first profile sync
- Redeem coupons for unlock credits (campaign / referral)
- Pay Stripe (diaspora card) or Flutterwave (MoMo) when credits exhausted

### Landlord

- List building **free** → admin verify → mark units available
- Receive **launch featured grant** if in first 20 verified
- Purchase 7 / 14 / 30-day featured boost **~3 months post-launch** (optional)

### Admin

- Grant / revoke featured; set `featured_until`
- Run launch batch grant (20 listings)
- Issue coupon codes → wallet credits

---

## 5. Wallet & promos — product policy

> **Core rule:** Wallet balance is **promotional platform credit**, not e-money. It reduces checkout amount; it is **not withdrawable** and **not refundable to cash** except where law requires reversal of a failed service.

### 5.1 Credit types (ledger)

| Type | Trigger | Typical value | Expires |
|------|---------|---------------|---------|
| `WELCOME_BONUS` | First profile sync (tenant) | 1× unlock fee | 90 days |
| `COUPON` | Admin / campaign code | Configurable | Per coupon |
| `ADMIN_GRANT` | Manual support | Configurable | Optional |
| `FEATURED_GRANT` | Launch promo / admin | 1 featured slot | `featured_until` |
| `REFERRAL` (v2) | Invite flow | TBD | TBD |

### 5.2 Checkout order (S5-03)

1. Compute list price from quote API  
2. Apply eligible wallet credits (FIFO, purpose-matched)  
3. Charge **remainder** via Stripe or Flutterwave  
4. If fully covered by credits → internal settlement only (no PSP charge)

### 5.3 Refund policy (avoid refund burden)

| Scenario | Policy |
|----------|--------|
| User paid **cash** via Stripe/Flutterwave, unlock failed (bug) | **Full PSP refund** to original payment method |
| User paid with **credits only** | **Restore credits** to wallet; no cash movement |
| User paid **mixed** (credits + card) | Refund **card portion** to PSP; **restore credits** used |
| User unlocked successfully, regrets purchase | **No refund** (digital access delivered) — state in ToS |
| Wrong listing / fraud | Admin discretion; case-by-case credit or PSP refund |
| Coupon abuse | Revoke credits; ban coupon |

**Why this avoids a refund burden:** Most launch promos are **credits**, not cash outflows. Cash refunds only attach to **card/MoMo charges**, which are fewer when welcome bonus converts first-time users. Credits expire, limiting long-tail liability.

### 5.4 Stripe compliance framing

- Credits = **discount mechanism**, not stored value product
- Non-transferable, no cash-out, PlotPin-issued only
- Display: “You have 1 unlock credit (~20,000 UGX value)” not “Wallet balance: UGX 20,000 withdrawable”

---

## 6. Payment rails

### 6.1 Stripe (merchant-of-record)

**Who pays:** Diaspora + anyone with Visa/Mastercard (including many Ugandan bank cards — see FAQ in main doc).  
**Who gets paid:** PlotPin entity in **Stripe-supported country** (US LLC / UK Ltd / etc.).  
**Products:** Unlock, listing fee, featured boost.  
**Not:** Rent, escrow, landlord payouts.

### 6.2 Flutterwave (Uganda local)

**Who pays:** MTN / Airtel MoMo users without cards.  
**Required** for Uganda-local monetization at scale.

### 6.3 Rail selection UX

- Viewer in UG + no card on file → prefer Flutterwave when live  
- Diaspora / international → Stripe with presentment currency (S4-15)  
- Credits applied before rail selection

---

## 7. Homepage v2

### 7.1 Layout

```
AppHeader
├── HeroBand
│   ├── Copy (headline, subline, CTAs)
│   └── PlotPinMapHero (D3 SVG — see PLAN-HOMEPAGE-D3-HERO.md)
├── FeaturedListingsSection (max 12 cards)
├── ValueProps (3 cards — refined copy)
├── LandlordCta
Footer
```

### 7.2 Featured section

**API:** `GET /api/v1/buildings/featured?limit=12`

**Eligibility:** verified + `is_featured` + not expired + ≥1 available unit + cover image recommended

**Card fields:** cover, name, city/district, rent from, beds hint, Featured badge, CTA → `/explore?building={id}`

**Empty:** honest message + explore CTA; never fake listings

### 7.3 Performance

- No Google Maps on `/`
- Hero: lazy-init D3 after LCP text; `prefers-reduced-motion` → static SVG
- Featured: SSR/RSC fetch with skeleton loaders

---

## 8. Featured listings

### 8.1 Launch promo (S4-18)

- First **20 verified** listings globally → `FEATURED_GRANT`, **90 days**
- Admin batch action + audit log
- Direct revenue = **$0** in month 1

### 8.2 Paid featured (S5-08)

**Table:** `featured_pricing_rules`

| Duration | UGX (default) | ~USD |
|----------|---------------|------|
| 7 days | 35,000 | ~$9 |
| 14 days | 50,000 | ~$14 |
| 30 days | 100,000 | ~$27 |

**Effects while active:**

- Homepage grid inclusion (sort by expiry / recency)
- Explore sort boost (`is_featured DESC` — exists)
- Optional “Featured” badge on list rows (v1.1)

**Renewal v1:** allowed within 7 days of expiry only; no stacking mid-term

### 8.3 Data model additions

```text
buildings.featured_until      TIMESTAMPTZ NULL
buildings.featured_granted_at TIMESTAMPTZ NULL
buildings.featured_source     TEXT NULL  -- PAID | LAUNCH_GRANT | ADMIN_GRANT | COUPON | CREDIT

featured_pricing_rules        (country, duration_days, fee_ugx, …)

wallet_ledger                 (user_id, type, amount_ugx, purpose, expires_at, …)
coupons                       (code, credit_type, amount, max_redemptions, …)
```

### 8.4 PaymentPurpose extension

```text
UNLOCK | LISTING | FEATURED
```

---

## 9. API summary

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/buildings/featured` | Public | Homepage cards |
| GET | `/pricing/quote?purpose=FEATURED&…` | Public / landlord | Featured price |
| GET | `/wallet` | User | Balance + credits breakdown |
| POST | `/wallet/redeem-coupon` | User | Apply coupon |
| POST | `/buildings/:id/featured/checkout` | Landlord | Stripe/Flutterwave session |
| POST | `/admin/buildings/:id/featured` | Admin | Grant/revoke |
| POST | `/admin/featured/launch-grant` | Admin | Batch first 20 |

---

## 10. UX requirements

### 10.1 Unlock panel (S4-07)

- Show quoted fee from API (type + beds)
- Show credit balance: “Use 1 welcome credit” when available
- Show remainder if partial credit

### 10.2 Landlord dashboard

- Featured status chip + expiry
- “Boost listing” when eligible
- Clear separation: listing fee vs featured fee

### 10.3 Admin

- Featured toggle on building edit
- Launch grant button with preview list
- Coupon create / deactivate

---

## 11. Legal & compliance checklist

- [ ] ToS: unlock = digital access to contact/location; no rent guarantee
- [ ] Refund policy published (table §5.3)
- [ ] Wallet terms: non-transferable, non-cash, expiry
- [ ] Stripe account: US/UK entity if founders UG-based
- [ ] Product description in Stripe dashboard accurate
- [ ] URA VAT advisory before scale (non-resident digital services to UG)

---

## 12. Phasing & sprint mapping

| Phase | Deliverables | Sprint |
|-------|--------------|--------|
| **A** | Wallet schema, welcome bonus, coupon redeem | S4-03, S4-04, S4-08 |
| **B** | Dynamic pricing in unlock UI | S4-07 |
| **C** | Featured fields, admin grant, launch batch | S4-18, S4-21 |
| **D** | Homepage featured grid + public API | S4-22 |
| **E** | D3 hero (parallel, non-blocking) | S4-24 (new) |
| **F** | Stripe unlock + listing | S5-01–S5-04 |
| **G** | Featured checkout | S5-08 |
| **H** | Flutterwave MoMo | S5-05 |

**Recommended build order:** A → B → C → D → F → G; E can ship with D.

---

## 13. Acceptance criteria (release gate)

### Homepage + featured

- [ ] `/` shows D3 hero + up to 12 featured verified listings
- [ ] No Maps API load on homepage
- [ ] Click featured card → explore with building focused
- [ ] Launch grant populates homepage within one refresh

### Wallet

- [ ] New tenant receives 1 welcome credit once
- [ ] Credit redeems at unlock without PSP when sufficient
- [ ] Coupon adds credit; expired credits rejected at checkout
- [ ] No UI path to “withdraw” credits

### Payments

- [ ] Stripe checkout for unlock, listing, featured
- [ ] Webhook idempotent; ledger + building state consistent
- [ ] Flutterwave path documented / stubbed until S5-05

---

## 14. Open questions

| # | Question | Owner | Default |
|---|----------|-------|---------|
| 1 | Launch featured duration | Product | 90 days |
| 2 | Welcome credit expiry | Product | 90 days |
| 3 | US LLC vs UK Ltd for Stripe | Founders | TBD |
| 4 | Featured requires cover photo? | Product | Yes (admin QA) |
| 5 | Homepage country filter for featured? | Product | Global v1 |

---

## 15. Appendix — revenue model pointer

Interactive unit economics: [plotpin-unit-economics.canvas.tsx](/Users/mac/.cursor/projects/Users-mac-Projects-gitstart/canvases/plotpin-unit-economics.canvas.tsx)

Three streams modeled: **unlock**, **listing**, **featured** (+ infra & Maps costs).
