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
| **Featured boost** | Landlord | Optional 7/14/30-day homepage + sort priority | **~3 months post-launch** (S5-08 deferred) |
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

## 5. Featured & badge (deferred monetization)

| Product | Timing | Notes |
|---------|--------|-------|
| **Launch featured** | Now | First 20 verified listings free 90 days (S4-18) |
| **Paid featured** | ~Month 3+ | After unlock volume proves ROI to landlords |
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

## 8. Code / schema notes (implementation)

- Keep `listing_fee_ugx` in DB for now — **do not enforce** at AVAILABLE toggle  
- Remove or hide `listingQuote` UI on landlord manage page when going live  
- `PaymentPurpose.LISTING` — retain for admin/coupon credits only until badge SKU exists  
- Sprint 5B checkout: **`UNLOCK` only** via **Flutterwave + Lemon Squeezy** (not Stripe until LLC)  
- See [PAYMENTS-STRATEGY.md](./PAYMENTS-STRATEGY.md)  

---

*See [IMPLEMENTATION-PLAN.md](./IMPLEMENTATION-PLAN.md) for build order.*
