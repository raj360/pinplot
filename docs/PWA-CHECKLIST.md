# PWA checklist — PlotPin web

**Phase:** 6 (growth) · **Strategy:** PWA first on Next.js; native shell (RN/Flutter WebView) later if store presence needed.

**Note:** Dev logs showing `GET /sw.js 404` are expected until this work ships — the browser (or a stale registration) is requesting a service worker that does not exist yet.

---

## 1. Manifest & installability

| Item | Status | Notes |
|------|--------|-------|
| `public/manifest.webmanifest` | ☐ | `name`, `short_name`, `start_url: "/"`, `display: standalone`, theme/background colors |
| Icons 192 + 512 (+ maskable) | ☐ | Brand pin mark; use existing logo assets |
| `<link rel="manifest">` in root layout | ☐ | `apps/web/src/app/layout.tsx` |
| Apple touch icon + `apple-mobile-web-app-capable` | ☐ | iOS Add to Home Screen |
| `NEXT_PUBLIC_APP_URL` canonical for `start_url` | ☐ | Prod vs staging |

---

## 2. Service worker (`/sw.js`)

| Item | Status | Notes |
|------|--------|-------|
| Register SW only in production (or explicit flag) | ☐ | Avoid dev 404 noise |
| **Workbox** or Next `@serwist/next` | ☐ | Match Next 15 app router patterns |
| Precache shell: `/`, `/explore`, offline fallback page | ☐ | |
| **Do not** cache authenticated API responses by default | ☐ | Stale unlock/contact data risk |
| Cache static assets + map tiles policy | ☐ | Google Maps offline limited — document |
| Update prompt (“New version available”) | ☐ | Optional toast + reload |

---

## 3. Mobile UX (install-worthy)

| Item | Status | Notes |
|------|--------|-------|
| Viewport + safe-area insets | ☐ | Unlock hub mobile bar already started |
| Touch targets ≥ 44px on primary actions | ☐ | Call / WhatsApp on unlock hub |
| Splash / loading state without layout shift | ☐ | |
| Explore map performance on mid-range Android | ☐ | Test on real UG devices |

---

## 4. Push notifications (optional Phase 6b)

| Item | Status | Notes |
|------|--------|-------|
| Web Push VAPID keys | ☐ | Separate from email |
| Subscribe after unlock or saved listing | ☐ | Permission timing matters |
| Backend store `push_subscriptions` | ☐ | |
| Re-use notification types from [NOTIFICATIONS.md](./NOTIFICATIONS.md) | ☐ | |

---

## 5. QA before calling it “PWA”

- [ ] Lighthouse PWA audit ≥ 90 (installable + SW)
- [ ] Install on Android Chrome + iOS Safari (Add to Home Screen)
- [ ] Offline: app shell loads; explore shows friendly offline message
- [ ] After deploy: old SW updates without infinite reload loop
- [ ] Clear dev fix: unregister stale SW in DevTools if 404 persists locally

---

## Suggested file layout

```
apps/web/public/
  manifest.webmanifest
  icons/icon-192.png
  icons/icon-512.png
apps/web/src/app/sw.ts          # or serwist config
apps/web/src/app/offline/page.tsx
```

---

## Related

- [ROADMAP.md](../ROADMAP.md) Phase 6
- [SPRINT_TASK.md](../SPRINT_TASK.md) S6-* tasks
