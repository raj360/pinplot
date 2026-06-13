# Open Graph, social previews & UTM (paid socials)

**Phase:** 6 · **Goal:** Diaspora and Uganda paid traffic lands with correct preview, currency context, and attributable funnel metrics.

---

## 1. Open Graph & Twitter cards

### Pages to cover (priority)

| Route | `og:type` | Primary image |
|-------|-----------|---------------|
| `/` | `website` | Hero / map brand asset |
| `/explore` | `website` | Map screenshot or generic Kampala |
| `/explore?building={id}` | `article` or `website` | Building cover photo (signed URL or CDN) |
| `/buildings/{id}` | same | Cover photo + rent hint in description |
| `/tenant/unlocks` | `website` | Generic “My unlocks” (no PII in OG) |

### Next.js implementation

Use `generateMetadata` per route (App Router):

```ts
export async function generateMetadata({ params }): Promise<Metadata> {
  return {
    title: `${building.name} · PlotPin`,
    description: `From ${formatRent(...)} in ${building.district}. Map-first rentals in Uganda.`,
    openGraph: {
      title: '...',
      description: '...',
      images: [{ url: coverUrl, width: 1200, height: 630, alt: building.name }],
      locale: 'en_GB',
      siteName: 'PlotPin',
    },
    twitter: { card: 'summary_large_image', ... },
  };
}
```

### Image requirements

- **1200×630** JPG/PNG for Meta; avoid text smaller than 24px
- Fallback: static `/og/default.png` when building has no cover
- **No exact pin** in OG images — use cover photo only (trust)

### Checklist

- [ ] Default OG in root `layout.tsx`
- [ ] Dynamic OG for building detail
- [ ] `metadataBase` set from `NEXT_PUBLIC_APP_URL`
- [ ] Validate with [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) and Twitter Card Validator

---

## 2. UTM convention (paid social)

### Standard params

| Param | Value | Example |
|-------|-------|---------|
| `utm_source` | Platform | `facebook`, `instagram`, `tiktok`, `google` |
| `utm_medium` | `paid_social` or `cpc` | |
| `utm_campaign` | Campaign slug | `ug_diaspora_q3_2026` |
| `utm_content` | Creative variant | `video_walkthrough_a`, `static_map_b` |
| `utm_term` | Audience (optional) | `uk_ugandan_diaspora` |

### Landing URLs

| Campaign goal | Landing path |
|---------------|--------------|
| Brand / discovery | `https://plotpin.com/?utm_source=...` |
| Map browse | `https://plotpin.com/explore?utm_source=...&region=UG` |
| Single listing ad | `https://plotpin.com/buildings/{id}?utm_source=...` |

**Homepage v2** should preserve UTMs when routing to explore (read `searchParams` once, store in sessionStorage for same-session events).

---

## 3. Analytics events (minimal)

Reuse `listing_analytics_events` or add lightweight client events:

| Event | When |
|-------|------|
| `LANDING_VIEW` | First paint with any `utm_*` in URL |
| `EXPLORE_FROM_CAMPAIGN` | Explore loaded with stored UTMs |
| `UNLOCK_CHECKOUT_START` | Checkout with `campaign` in metadata |
| `UNLOCK_PAID` | Webhook settlement attaches `utm` from session if stored |

Store on unlock/payment metadata (JSONB) for ROAS reporting:

```json
{ "utm_source": "facebook", "utm_campaign": "ug_diaspora_q3_2026" }
```

---

## 4. Paid social creative brief (alignment)

- **Hook:** “See the pin before you pay” / “Talk to the landlord directly”
- **CTA:** Explore map or specific building — always with UTMs
- **Locale:** GBP/USD hint for diaspora ads; UGX for local UG campaigns
- **Compliance:** No fake “verified” badges in ad copy unless listing is verified

---

## 5. Build order (S6)

1. Static OG defaults + `metadataBase`
2. Building detail dynamic OG (cover image)
3. UTM capture hook + session persistence
4. Pass UTMs to checkout metadata (Flutterwave / Lemon Squeezy custom fields)
5. Admin/export: unlocks by campaign (SQL or Metabase)

---

## Exit criteria

- [ ] Sharing a building link shows cover + title on WhatsApp/Facebook/iMessage
- [ ] Paid ad URL appears in analytics with campaign attribution through unlock
- [ ] Homepage → explore preserves UTMs for same session

---

## Related

- [ROADMAP.md](../ROADMAP.md) — “Map meets them where they are”
- [BUSINESS-MODEL.md](./BUSINESS-MODEL.md) — unlock monetization
- [SPRINT_TASK.md](../SPRINT_TASK.md) — S6-* row
