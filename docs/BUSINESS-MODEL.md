# PlotPin — Business model (June 2026)

**Status:** Approved product direction  
**Supersedes:** Landlord listing fee in early PRD drafts and ROADMAP Sprint 5 P0 listing checkout

---

## 1. Positioning

PlotPin is **map-first rental discovery with paid landlord contact** — not rent collection, not a broker marketplace like Booking.com.

**Core wedge (Uganda):** Tenants pay **blockers** on Jiji for tours with no landlord access, bait-and-switch pricing, and repeat fees. PlotPin charges **tenants** to unlock **verified landlord contact + exact pin** — cutting out imposters.

---

## 2. Revenue streams

| Stream | Who pays | When | Launch |
|--------|----------|------|--------|
| **Listing on map** | Landlord | **Free** after admin verification | Now |
| **Tenant unlock** | Tenant | Pay (or wallet credit) to unlock contact for 72h exclusive on one unit | Sprint 5B — [PAYMENTS-STRATEGY.md](./PAYMENTS-STRATEGY.md) |
| **Featured boost** | Landlord | 7/14/30-day homepage + sort priority — UGX 30k/50k/90k via FW/LS | **✅ Implemented (S5-08, June 2026)** — enable when unlock volume proves ROI |
| **Verified landlord badge** | Landlord | Optional one-time fee → trust badge on profile/listings | Phase 6+ (after supply proof) |

### Removed / not planned

- **Mandatory landlord listing fee** (~30k UGX per AVAILABLE toggle) — removed from product direction
- Rent commission / escrow — out of scope
- Broker “blockage” fees — prohibited in ToS

---

## 3. Free listing — rules

Listing is free but **guarded**:

1. Landlord submits building + units + photos + pin  
2. **Admin verifies** ownership/authority, pin, photos, rent accuracy  
3. Landlord marks units **AVAILABLE** only after `is_verified = true`  
4. Explore shows **approximate** location until tenant unlocks  

**Landlord messaging:** “List for free. Tenants pay to unlock your contact — serious inquiries only.”

---

## 4. Tenant unlock — rules

- Tiered fee by building type + bedrooms + country (`pricing_rules`)  
- **72 hours** exclusive contact window for first payer on a unit  
- Welcome credit + coupons reduce checkout (promotional credits, not cash wallet)  
- Diaspora / international cards: **Lemon Squeezy** (MoR checkout)  
- Uganda locals: **Flutterwave** (MoMo + local cards)  
- **Stripe:** deferred until US LLC + bank exist — see [PAYMENTS-STRATEGY.md](./PAYMENTS-STRATEGY.md)  

---

## 5. Featured & badge

| Product | Timing | Notes |
|---------|--------|-------|
| **Launch featured** | Now | First 20 verified listings free 90 days (S4-18) |
| **Paid featured** | **Built (S5-08)** | Tiers 7d/14d/30d = UGX 30k/50k/90k; FW (MoMo markets) or Lemon Squeezy (cards); extends any active window; `featured_source = 'PAID'`. Landlord buys from the building manage page; stats (unlock count, featured-until) shown on dashboard. Push marketing once unlock volume proves ROI |
| **Verify badge** | Month 2–3+ | Optional one-time; ID check + badge UI |

---

## 6. Long-term revenue mix (target)

| Source | Share (steady state) |
|--------|----------------------|
| Tenant unlock | 60–80% |
| Featured boost | 15–25% |
| Verify badge | 5–15% |
| Listing fee | 0% |

---

## 7. International expansion

- **Supply:** Free verified listing in any supported country (S4-19 country on create + S4-20 pricing seeds)  
- **Demand:** Global explore + diaspora unlock in viewer currency  
- **Payments:** Lemon Squeezy (intl) + Flutterwave (UG); Stripe when entity exists  
- **Trust:** Same admin verification bar; local scam patterns documented in [TRUST-ANTI-SCAM.md](./TRUST-ANTI-SCAM.md)  

---

## 8. Policy decisions (June 2026 review)

### 8.1 Unlock exclusivity vs multi-unlock

**Current (keep as default):** one winner per unit — first payer gets 72h exclusive
contact; unit goes `LOCKED`; other tenants see `locked_by_other`.

Exclusivity **is** the core anti-blocker promise: a tenant pays *because* nobody
else can swoop in during their window. Unlimited concurrent unlocks would
recreate the Jiji pain (pay → landlord already committed elsewhere) and is
**against the initial model**.

**Compatible evolution (Phase 6, landlord opt-in):** a clearly-labeled
**"open contact"** mode per unit —

- Landlord chooses per unit: **Exclusive** (default, current behavior) or
  **Open** (up to N concurrent unlocks, suggested cap N = 3).
- Open units show tenants "*X of N contact slots used*" **before** payment and
  charge a discounted unlock fee (~60% of exclusive).
- Never silently sell the same unit twice — transparency keeps the trust wedge.
- Revenue upside: up to N× fee per unit on high-demand listings.

### 8.2 Rental periods — /month vs /day (planned)

Today all rents are stored and displayed per month. Plan:

- `units.rent_period` enum: `MONTH` (default) | `DAY` (later `WEEK`).
- Default by building type: `AIRBNB`/short-stay → `DAY`; others → `MONTH`.
- Display: `formatListingRentPerMonth` generalizes to `/mo` · `/day` suffixes;
  explore filters gain a stay-type toggle.
- Unlock pricing: `pricing_rules` can later key off period (short-stay unlocks
  may price differently); no change needed at introduction.
- Migration + DTO/validation + landlord unit form select. **Phase 6 task R-01.**

### 8.3 Unwanted listings — keep listing free

**Decision: do not reinstate the listing fee.** It kills cold-start supply and
the live guardrails already cover spam:

1. Admin verification before anything is visible (photos, pin, phone, attestation)
2. `MAX_UNVERIFIED_BUILDINGS_PER_LANDLORD = 3` cap (T-08)
3. Report listing + admin queue (T-06) · duplicate-pin warning (T-07)
4. Rejected listings must be fixed + resubmitted before re-review

**Escalate only on real abuse signals** (in order): tighten the unverified cap
per account age → auto-pause listings that accumulate reports → require a
**refundable** verification deposit for repeat offenders only. A blanket fee
stays out of the model (Section 2: listing revenue target = 0%).

---

## 9. Code / schema notes (implementation)

- Keep `listing_fee_ugx` in DB for now — **do not enforce** at AVAILABLE toggle  
- Remove or hide `listingQuote` UI on landlord manage page when going live  
- `PaymentPurpose.LISTING` — retain for admin/coupon credits only until badge SKU exists  
- Sprint 5B checkout: **`UNLOCK` only** via **Flutterwave + Lemon Squeezy** (not Stripe until LLC)  
- See [PAYMENTS-STRATEGY.md](./PAYMENTS-STRATEGY.md)  

---

*See [IMPLEMENTATION-PLAN.md](./IMPLEMENTATION-PLAN.md) for build order.*
