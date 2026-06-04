# PlotPin — Trust & anti-scam

**Problem domain:** Uganda rental market — “blockers” and imposters on classifieds (Jiji, Facebook, word of mouth).

---

## 1. The blocker scam (local context)

Typical pattern:

1. Someone who **does not own** the property lists it or claims to represent it  
2. Tenant pays **blockage / tour fee** (often 50k–200k+ UGX) before seeing the real place  
3. **Bait-and-switch:** agreed 300k rent → tours at 500k houses  
4. Tenant never gets **landlord direct access** → pays again with another blocker  
5. Cycle repeats; tenants lose **200k–400k UGX** with no lease  

**PlotPin answer:** Verified landlord + **paid unlock = direct contact & exact location** — no broker in the middle. Product and ops must enforce that story.

---

## 2. Threat model

| Actor | Goal | PlotPin risk |
|-------|------|--------------|
| **Blocker / imposter** | List others’ buildings, collect off-platform fees | Fake supply, reputational harm |
| **Greedy agent** | Pose as landlord, unlock revenue share | Wrong contact after unlock |
| **Stale landlord** | Leave AVAILABLE after rented | Tenant unlock waste |
| **Tenant fraud** | Unlock, harass, chargeback abuse | Support load |
| **Duplicate spam** | Same building many accounts | Map clutter |

---

## 3. Defense layers

### Layer A — Live today ✅

| Control | Location |
|---------|----------|
| Admin must **approve** before verified | `buildings.is_verified` |
| **Reject + reason** + resubmit | `016_building_rejection.sql` |
| No AVAILABLE until verified | `buildings.service` updateUnitStatus |
| Approximate pin on explore; exact only after unlock | explore + unlock flow |
| Unit **LOCKED** during active unlock | unit status |
| Rate limit explore API | ThrottlerGuard |

### Layer B — Sprint 5A (guardrails) 🎯

| ID | Control | Acceptance |
|----|---------|------------|
| T-01 | **Landlord phone required** before admin can approve | Approve blocked if `profiles.phone` empty |
| T-02 | **Ownership attestation** on submit | Checkbox + timestamp; stored on building |
| T-03 | **Terms acceptance** on landlord submit + tenant unlock | `accepted_terms_at` on profile or building |
| T-04 | **Admin verification checklist** UI | Structured approve flow (see §4) |
| T-05 | **Report listing** (tenant, post-unlock) | API + admin queue |
| T-06 | **Duplicate pin alert** | Admin flag when pin within ~50m of existing verified building (different landlord) |
| T-07 | **New landlord building cap** | e.g. max 3 pending/unverified per account |
| T-08 | **Hide listing quote fee** UI | Free listing — remove misleading listing fee banner |

### Layer C — Sprint 5A / 6

| ID | Control | Notes |
|----|---------|-------|
| T-09 | **Landlord notifications** on approve / reject / unlock | Postmark email; SMS later |
| T-10 | **Stale listing nudge** | AVAILABLE > 30 days → email landlord |
| T-11 | **Unlock expiry reminder** | 12h before 72h ends → landlord SMS |
| T-12 | **Scam refund policy** | Admin-verified scam → tenant credit (process doc) |
| T-13 | **Landlord ban** | `profiles.suspended_at` — hide all listings |

### Layer D — Later (badge / scale)

| ID | Control |
|----|---------|
| T-14 | Optional **ID upload** for paid verify badge |
| T-15 | Admin spot-check video for high-rent listings |
| T-16 | SMS OTP on landlord phone at approve |
| T-17 | Pattern detection: high unlocks, never RENTED |

---

## 4. Admin verification checklist

Before **Approve**, admin confirms:

- [ ] Listing phone matches landlord profile phone (or documented agent authorization)  
- [ ] Photos match building type and area (not stock / copied)  
- [ ] Pin is plausible for stated district/city  
- [ ] Rent on units is internally consistent (no obvious bait 300k → 500k in same listing)  
- [ ] No duplicate verified building at same pin for different landlord  
- [ ] Landlord account not suspended  
- [ ] **Ownership attestation** recorded on submit  

**Reject reasons (preset + free text):**

- Cannot verify ownership / authority  
- Duplicate or conflicting listing  
- Photos misleading or missing  
- Pin inaccurate  
- Rent information inconsistent  
- Suspected broker / third-party listing  

---

## 5. Product copy (anti-blocker)

Use on homepage, unlock panel, landlord submit:

- “Unlock **the landlord** — not a broker.”  
- “Verified listings. Rent shown **before** you pay.”  
- “Listing is **free** for property owners. Tenants pay only to unlock contact.”  

---

## 6. ToS alignment

Prohibited: impersonation, listing property without authority, collecting “blockage fees” while representing PlotPin, deliberate rent misrepresentation.  
See [legal/TERMS-OUTLINE.md](./legal/TERMS-OUTLINE.md).

---

## 7. Metrics

| Metric | Target |
|--------|--------|
| Reject rate (pending) | Track; high may mean bad supply or strict bar |
| Report rate / unlock | < 2% |
| Time to approve | < 48h median at launch |
| Stale AVAILABLE > 30d | < 20% of inventory |
| Unlock → RENTED update | > 40% within 14d (honor system) |

---

*Implementation tasks: [IMPLEMENTATION-PLAN.md](./IMPLEMENTATION-PLAN.md) Sprint 5A*
