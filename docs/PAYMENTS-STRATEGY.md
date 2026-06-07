# PlotPin — Payments strategy

**Status:** Approved (June 2026)  
**Default rails:** **Flutterwave** (Uganda + local) + **Lemon Squeezy** (international cards, MoR)  
**Deferred:** **US LLC + Stripe** until revenue justifies entity overhead

Related: [BUSINESS-MODEL.md](./BUSINESS-MODEL.md), [IMPLEMENTATION-PLAN.md](./IMPLEMENTATION-PLAN.md)

---

## 1. Decision summary

| Path | When | Why |
|------|------|-----|
| **Flutterwave + Lemon Squeezy** | **Sprint 5B (now)** | No US company; live unlocks in ~1–2 weeks; UG MoMo + diaspora cards |
| **US LLC + Stripe** | **Later** (traction) | Lower fees at scale, single diaspora rail — after entity + bank exist |

**UK Ltd:** Not recommended for Uganda-based founders unless UK operations/co-founder (banking often harder than US LLC + Mercury).

---

## 2. US/UK entity + Stripe — effort (deferred)

Mostly **legal, banking, tax admin** — not engineering.

| Step | Typical time | Typical cost (ballpark) |
|------|--------------|-------------------------|
| Form US LLC (e.g. Delaware) | 3–10 business days | $100–300 state + ~$100–150/yr agent |
| EIN | 1–4 weeks | Free (or $50–200 via service) |
| US business bank (Mercury, Relay, Wise) | 1–3 weeks KYC | Low monthly |
| Stripe application | Days–2 weeks after bank | — |
| Ongoing compliance | Ongoing | $300+/yr + accountant |

**Calendar:** often **4–8 weeks** end-to-end; **2–3 weeks** with Stripe Atlas (~$500 one-time).

**Founder time:** **15–40 hours** first time.

**Ongoing:** Foreign-owned LLC US tax (e.g. Form 5472), possible Uganda tax on personal income — **don’t start until revenue justifies it**.

---

## 3. Flutterwave + Lemon Squeezy — effort to start

Mostly onboarding + one integration pattern — **days to ~2 weeks**.

| Provider | Role | Friction | Sandbox |
|----------|------|----------|---------|
| **Flutterwave** | Uganda MoMo, local cards, settlement to UG business | UG KYC + bank | Yes (`.env.example`) |
| **Lemon Squeezy** | International cards; **Merchant of Record** (VAT/GST in many markets) | Indie/SaaS signup; digital goods | Yes |

**Calendar:** **3–14 days** (Flutterwave KYC often long pole).

**Founder time:** **~5–15 hours** accounts + test purchases before app wiring.

Neither requires a US company.

---

## 4. Consistent international UX (one PlotPin flow, two PSPs)

**Perfectly identical checkout worldwide:** No — two hosted checkouts.  
**Consistent product UX:** Yes — same quote → credit → pay → receipt → unlock.

```text
Tenant taps "Unlock"
  → Apply wallet credit (ledger)
  → If remainder > 0:
       Uganda / MoMo / local preference → Flutterwave
       Else (diaspora / international card) → Lemon Squeezy
  → Webhook: verify → idempotent payment row → unlockUnit
```

**Internal architecture:** one `settleUnlock()` path; two provider adapters (webhooks).

| Concern | Flutterwave + LS | US LLC + Stripe (later) |
|---------|------------------|-------------------------|
| Time to first live charge | Days–2 weeks | Weeks–2 months |
| International cards | Lemon Squeezy (MoR) | Stripe |
| Uganda MoMo | Flutterwave | Still need Flutterwave |
| Global digital tax | LS handles much MoR tax | You + entity + accountant |
| Dev work | 2 webhooks + routing | 1 Stripe + FW |
| User trust at pay | Two brands | Stripe badge |

---

## 5. Routing rules (Sprint 5B)

| Viewer / preference | Provider |
|---------------------|----------|
| `country_code === UG` or user selects MoMo | **Flutterwave** |
| Tenant or listing in **Flutterwave MoMo markets** (UG, KE, TZ, RW, NG, GH, …) | **Flutterwave** |
| Diaspora corridors / international card default | **Lemon Squeezy** |
| Override in Settings (future) | User choice |

Presentment: Lemon Squeezy checkout in USD/GBP/etc. from `pricing_rules` + viewer context (S4-20). Flutterwave in UGX.

---

## 6. Schema & code (Sprint 5B)

| Item | Action |
|------|--------|
| `payment_provider` enum | Add `LEMON_SQUEEZY`; keep `STRIPE` for future migration |
| `PaymentProvider` in shared-types | `FLUTTERWAVE`, `LEMON_SQUEEZY`, `STRIPE` (deprecated until entity) |
| `.env` | Lemon Squeezy API key + webhook secret; keep Stripe vars commented optional |
| `POST /unlocks/checkout` | Returns `{ provider, checkoutUrl }` |
| Webhooks | `POST /webhooks/flutterwave`, `POST /webhooks/lemon-squeezy` |
| Idempotency | Provider payment id → unique on `payments` |

**Lemon Squeezy products:** one product per unlock tier *or* dynamic checkout — confirm against LS API vs `pricing_rules`.

---

## 7. Sprint alignment

| Sprint | Payments |
|--------|----------|
| **5A** | Unchanged — terms, trust, notifications |
| **5B** | Lemon Squeezy (intl unlock) + Flutterwave (UG unlock); shared settlement |
| **5C** | MoMo polish, USSD, SMS — may merge with 5B for UG |
| **Later** | US LLC + Stripe migration for diaspora if LS fees/friction hurt |

**Removed from 5B gate:** US LLC, Stripe Checkout, Stripe webhooks.

---

## 8. When to add Stripe (trigger checklist)

- [ ] Monthly unlock GMV > threshold (set internally, e.g. $2k+)  
- [ ] Lemon Squeezy fees materially exceed LLC + Stripe admin cost  
- [ ] US LLC + bank account live  
- [ ] Accountant sign-off on tax structure  

Until then: **Flutterwave + Lemon Squeezy only.**

---

## 9. Compliance notes

- **Lemon Squeezy:** MoR for many jurisdictions — still describe product accurately (“digital access to rental listing contact”).  
- **Flutterwave:** Uganda business KYC; settlement to local bank.  
- **PlotPin:** Not rent escrow; unlock = digital service (align [legal/TERMS-OUTLINE.md](./legal/TERMS-OUTLINE.md)).

---

*Last updated: 2026-06-03*
