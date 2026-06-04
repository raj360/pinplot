# Privacy Policy — Outline for counsel

**Status:** Product requirements outline · **Not legal text**  
**Controller:** [Entity Name] · **Contact:** privacy@[domain]

---

## 1. Introduction

- What PlotPin is  
- This policy explains collection, use, and sharing of personal data  
- Applies to website, API, and related services  

---

## 2. Data we collect

### Account & profile

- Email (Supabase Auth)  
- Name, phone (landlords especially)  
- Role (tenant / landlord / admin)  
- Country preference, display settings  

### Listing data (landlords)

- Building name, description, city, district  
- Approximate and exact coordinates (exact gated until unlock)  
- Photos, video URLs  
- Unit rent, bedrooms, status  
- Ownership attestation timestamp  

### Tenant activity

- Unlock purchases, timestamps, units  
- Wallet credits, coupon redemptions  
- Report submissions  

### Payment data

- Processed by **Stripe / Flutterwave** — we receive transaction IDs, amounts, status — **not** full card numbers  

### Technical

- IP address (viewer country via `/api/geo`)  
- Browser, device, cookies  
- UTM parameters (when Phase 6 ads live)  

### Communications

- Email notification logs  
- Support correspondence  

---

## 3. How we use data

- Provide map discovery and unlock service  
- Verify listings and prevent fraud  
- Process payments and send receipts  
- Notify landlords of unlocks and listing status  
- Improve product, rate limits, security  
- Legal compliance  

---

## 4. What unlock reveals

- Before unlock: approximate location only on public explore  
- After paid unlock: exact coordinates, address notes, landlord phone/email as configured  
- Other users do not see tenant identity on public map  

---

## 5. Legal bases (GDPR-style where applicable)

- Contract — providing the service  
- Legitimate interest — fraud prevention, analytics  
- Consent — marketing emails (if any), optional cookies  

---

## 6. Sharing

| Recipient | Purpose |
|-----------|---------|
| Supabase | Auth, database, storage |
| Stripe / Flutterwave | Payments |
| Postmark (or equivalent) | Email |
| SMS provider (future) | Landlord alerts |
| Vercel / hosting | Application delivery |
| Google Maps | Client-side maps (API key; user device loads map) |

**We do not sell** personal data to brokers or listing agents.

---

## 7. International transfers

- Data may be processed outside Uganda (US/EU cloud)  
- Appropriate safeguards per counsel (SCCs, etc.)  

---

## 8. Retention

- Account data while active + reasonable period after  
- Unlock and payment records for accounting/disputes (e.g. 7 years — counsel)  
- Admin audit logs for trust & safety  

---

## 9. Security

- HTTPS, RLS on Supabase, service role for API  
- Access controls on admin routes  

---

## 10. Your rights

- Access, correction, deletion requests  
- Object to processing where applicable  
- Contact privacy@[domain]  
- Uganda / UK / EU rights as applicable to user location  

---

## 11. Children

- Not directed at under 18  

---

## 12. Cookies & analytics

- Essential cookies for auth  
- Optional analytics (disclose providers)  
- Cookie consent if required (EU/UK)  

---

## 13. Changes

- Updated policy posted with date  
- Material changes notified  

---

## 14. Contact

- privacy@[domain]  
- Data protection officer if required  

---

*Related: [TERMS-OUTLINE.md](./TERMS-OUTLINE.md)*
