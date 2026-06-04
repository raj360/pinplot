# PlotPin — Sprint Tasks

## Strategic shift (June 2026)

**Product direction:** Open internationally for **discovery and diaspora tenants** while **Uganda remains primary supply market**. English-only UI. **Currency presentation** (not translation).

**Monetization (updated):** **Free verified listing** for landlords · **Paid tenant unlock** · **Featured/badge** optional ~3 months post-launch. See [docs/BUSINESS-MODEL.md](./docs/BUSINESS-MODEL.md).

**Trust:** Anti-blocker positioning — unlock = direct landlord contact. See [docs/TRUST-ANTI-SCAM.md](./docs/TRUST-ANTI-SCAM.md).

**Planning index:** [docs/README.md](./docs/README.md) · **Build order:** [docs/IMPLEMENTATION-PLAN.md](./docs/IMPLEMENTATION-PLAN.md)

---

## Sprint 4 — Supply, wallet & international foundations — **✅ complete**

(See git history / ROADMAP for full S4 task list.)

```bash
yarn db:migrate   # through 019
```

Keep `ALLOW_DEV_UNLOCK=1` in dev until Sprint **5B** webhooks enforce unlock payment.

---

## Sprint 5A — Trust, access & engagement — **current (start here)**

**Goal:** Guard product before taking money — verification, legal, anti-scam, notifications.

| ID | Task | Status | Ref |
|----|------|--------|-----|
| T-01 | Landlord phone required before admin approve | Pending | TRUST |
| T-02 | Ownership attestation on landlord submit | Pending | TRUST |
| T-03 | `/terms` + `/privacy` pages (from outlines) | Pending | legal/ |
| T-04 | Terms acceptance on submit + unlock | Pending | T-03 |
| T-05 | Admin verification checklist UI | Pending | TRUST §4 |
| T-06 | Report listing (tenant, post-unlock) + admin queue | Pending | TRUST |
| T-07 | Duplicate pin warning on approve | Pending | TRUST |
| T-08 | New landlord building cap | Pending | TRUST |
| T-09 | Free listing UX — remove listing fee banner/copy | Pending | BUSINESS |
| N-01 | Postmark integration | Pending | NOTIFICATIONS |
| N-02 | Email: listing approved | Pending | N-01 |
| N-03 | Email: listing rejected | Pending | N-01 |

**5A exit:** Phone gate · Terms live · Admin checklist · Report flow · Approve/reject emails · No listing fee UX

**Suggested order:** T-03 → T-04 → T-09 → T-01 → T-02 → T-05 → T-06–T-08 → N-01–N-03

---

## Sprint 5B — Stripe unlock payments

**Gate:** Sprint 5A exit criteria ✅

| ID | Task | Status | Notes |
|----|------|--------|-------|
| S4-20 | Multi-country pricing_rules seed | Pending | Unlock quotes only |
| S5-01 | **Stripe Checkout — UNLOCK only** | Pending | No landlord listing fee |
| S5-02 | Stripe webhooks | Pending | Idempotent unlock settlement |
| S5-03 | Enforce unlock payment | Pending | Remove dev unlock bypass prod/staging |
| S5-07 | Wallet + Stripe reconciliation | Pending | |
| N-04 | Email: landlord unlock received | Pending | |
| N-05 | Email: tenant unlock receipt | Pending | |

**Removed from 5B:** ~~Landlord listing fee checkout~~ · ~~Gate AVAILABLE on listing payment~~

---

## Sprint 5C — Uganda local rails (P1)

| ID | Task | Status |
|----|------|--------|
| S5-04 | Flutterwave MoMo unlock | Pending |
| S5-05 | USSD | Pending |
| N-06 | SMS unlock alert (landlord) | Pending |

---

## Phase 6 — Deferred monetization & growth

| ID | Task | Notes |
|----|------|-------|
| S5-08 | Paid featured checkout | **~3 months post-launch** |
| T-14 | Optional verify badge (one-time) | After supply proof |
| S4-19 | Landlord country on create | International supply |
| S6-* | UTM, Open Graph, PWA | ROADMAP Phase 6 |
| N-07+ | Stale listing, digest, in-app | NOTIFICATIONS |

---

## Product readiness checklist

| Milestone | Status |
|-----------|--------|
| Sprint 4 complete | ✅ |
| Free listing policy documented | ✅ docs |
| Trust / terms / notifications plan | ✅ docs |
| T-01–T-09 trust guardrails | ❌ 5A |
| Terms + Privacy pages live | ❌ T-03 |
| Stripe unlock checkout | ❌ 5B |
| Paid featured | ❌ Phase 6 (~3 mo) |

---

## Recommended build order

```
Now:   Sprint 5A (T-03 → T-04 → T-09 → T-01… → N-01–N-03)
Next:  Sprint 5B (S4-20 + S5-01 → S5-02 → S5-03)
Later: Sprint 5C MoMo · Phase 6 featured/badge
```

---

*Last updated: 2026-06-03 — Sprint 5A trust & access is next*
