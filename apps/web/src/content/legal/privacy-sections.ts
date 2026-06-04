/** Draft privacy from docs/legal/PRIVACY-OUTLINE.md — counsel must replace before production. */

export const PRIVACY_DRAFT_NOTICE =
  "Draft summary for product review only. This is not binding legal text. A qualified lawyer must publish a final Privacy Policy before launch.";

export const PRIVACY_SECTIONS: { title: string; paragraphs: string[] }[] = [
  {
    title: "1. Introduction",
    paragraphs: [
      "This policy explains how [Entity Name] (“PlotPin”, “we”) collects, uses, and shares personal data when you use our website, API, and related services.",
    ],
  },
  {
    title: "2. Data we collect",
    paragraphs: [
      "Account: email (via Supabase Auth), name, phone (especially for landlords), role, country preference.",
      "Listings: building details, approximate and exact coordinates (exact gated until unlock), photos, video URLs, unit rent and status, ownership attestation timestamp.",
      "Tenant activity: unlock purchases, wallet credits, coupon use, report submissions.",
      "Payments: transaction IDs and amounts via Lemon Squeezy / Flutterwave — not full card numbers.",
      "Technical: IP (for viewer country), browser/device, cookies; communications and support messages.",
    ],
  },
  {
    title: "3. How we use data",
    paragraphs: [
      "To provide map discovery and unlock services, verify listings, prevent fraud, process payments, notify landlords of unlocks and listing status, improve security, and comply with law.",
    ],
  },
  {
    title: "4. What unlock reveals",
    paragraphs: [
      "Before unlock, explore shows approximate location only. After a paid unlock, you receive exact coordinates, address notes, and landlord contact as configured. Other users do not see your identity on the public map.",
    ],
  },
  {
    title: "5–7. Legal bases & sharing",
    paragraphs: [
      "We process data under contract, legitimate interest (fraud prevention), and consent where required.",
      "We share data with Supabase (auth, database, storage), payment processors, Postmark (email), hosting (e.g. Vercel), and Google Maps (client-side maps). We do not sell personal data to brokers.",
    ],
  },
  {
    title: "8–12. Rights & retention",
    paragraphs: [
      "Data may be processed outside Uganda. You may request access, correction, or deletion subject to law and active transactions. We retain data as needed for the service, fraud prevention, and legal obligations. Contact: privacy@[domain].",
    ],
  },
];
