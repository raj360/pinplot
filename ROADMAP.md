# PlotPin — Product Roadmap

> Map-first rental discovery for tenants and landlords. **Uganda-first supply, globally open discovery.** English UI only; prices shown in the viewer’s familiar currency where possible.

**Planning docs:** [docs/README.md](./docs/README.md) · **Payments:** [docs/PAYMENTS-STRATEGY.md](./docs/PAYMENTS-STRATEGY.md)

---

## Vision (2026)

PlotPin should work for **any visitor** landing from social ads anywhere in the world:

1. **Map meets them where they are** — geolocation or sensible country default; Uganda/Kampala when unknown or denied.
2. **Money makes sense** — listing rent in canonical currency + **approximate FX hint** `(~£308)` for diaspora viewers.
3. **Supply grows without borders** — **free verified listings**; admins verify; featured slots bootstrap supply.
4. **Trust** — direct landlord contact after unlock; anti-blocker vs Jiji brokers ([docs/TRUST-ANTI-SCAM.md](./docs/TRUST-ANTI-SCAM.md)).
5. **No app translation yet** — English copy only; **locale/currency formatting** localized.

---

## Where we stand (product snapshot)

**Phase:** Sprint 4 **complete** → **Sprint 5A trust & access** → **5B unlock payments (FW + Lemon Squeezy)**

| Persona | Can do today | Next |
|---------|--------------|------|
| **Tenant** | Homepage v2, explore, FX, unlock (dev) | Terms gate + paid unlock (5B) |
| **Landlord** | Submit, photos, unit status, reject + resubmit | Phone gate, attestation, notifications (5A) |
| **Admin** | Approve/reject, coupons, featured launch (20) | Verification checklist, reports (5A) |

**Monetization:** [docs/BUSINESS-MODEL.md](./docs/BUSINESS-MODEL.md) — free listing, paid unlock.  
**Payments:** [docs/PAYMENTS-STRATEGY.md](./docs/PAYMENTS-STRATEGY.md) — **Flutterwave + Lemon Squeezy** now; **Stripe when US LLC exists**.

---

## Phase 4 — Supply, wallet & international foundations — **✅ complete**

- Wallet, coupons, reject, homepage v2, D3 hero, featured launch, FX, IP geo, country catalog  
- Details: [SPRINT_TASK.md](./SPRINT_TASK.md)

---

## Phase 5A — Trust, access & engagement — **current**

**Goal:** Safe for real users before payments.

| Priority | Deliverable |
|----------|-------------|
| **P0** | Terms + Privacy pages; acceptance on submit/unlock |
| **P0** | Landlord phone required to approve |
| **P0** | Ownership attestation; admin verification checklist |
| **P0** | Report listing; duplicate pin alerts |
| **P0** | Postmark: approve / reject emails |
| **P0** | Free listing UX (remove listing fee messaging) |

Full task list: [docs/IMPLEMENTATION-PLAN.md](./docs/IMPLEMENTATION-PLAN.md)

---

## Phase 5B — Unlock payments — **after 5A**

**Rails:** Lemon Squeezy (international) + Flutterwave (Uganda). **Not Stripe** until entity formation.

| Priority | Deliverable |
|----------|-------------|
| **P0** | S4-20 multi-country unlock pricing seed |
| **P0** | Checkout routing + shared webhook settlement |
| **P0** | Lemon Squeezy + Flutterwave integrations |
| **P0** | S5-03 enforce unlock payment |
| **P1** | Wallet reconciliation; unlock notification emails |

---

## Phase 5C — Uganda rails polish

MoMo UX, USSD (TBD), SMS landlord alerts on unlock.

---

## Phase 6 — Global soft launch & deferred monetization

- Social ad landing + UTM, Open Graph, PWA  
- **S5-08 paid featured** (~3 months post-launch)  
- Optional **verify badge** (one-time)  
- **US LLC + Stripe** for diaspora if Lemon Squeezy economics warrant ([PAYMENTS-STRATEGY.md](./docs/PAYMENTS-STRATEGY.md) §8)

---

## Architecture principles (international)

| Layer | Rule |
|-------|------|
| **Data** | Listing currency on units; unlock fees per `country_code` in `pricing_rules` |
| **Display** | `formatMoney` — canonical rent + optional `(~£X)` hint |
| **Listing** | **Free** after admin verification |
| **Payments** | One unlock flow; route to FW or Lemon Squeezy |
| **Map** | Near me → GPS; deny → viewer country bounds |
| **Trust** | Admin verify; phone; attestation; reports |
| **Homepage** | Kampala D3 hero; no live Maps API on `/` |

---

*Last updated: 2026-06-03 — Payments: Flutterwave + Lemon Squeezy; Stripe deferred*
