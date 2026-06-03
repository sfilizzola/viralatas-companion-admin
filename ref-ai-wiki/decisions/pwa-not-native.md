# ADR: Progressive Web App (PWA) Not Native

**Status**: Accepted

**Date**: 2026-05

**Deciders**: Product team, engineering lead

---

## Context

Building a festival companion app for Viralatas Metaleiros (~20 people). Team considered:

1. **Native iOS + Android** — React Native, Capacitor, Flutter
2. **Progressive Web App (PWA)** — Responsive web + Service Worker + offline
3. **Hybrid web + native** — Web app + iOS App Store release

Constraints:
- Small group (~20 users)
- No budget for app store developer accounts
- iOS App Store requires annual $99 developer account
- Android Play Store requires one-time $25 account + review process
- Wacken attendees have phones already installed; "Add to Home Screen" is free

---

## Decision

**Build as Progressive Web App (PWA) only. No native apps.**

Users install via Safari "Add to Home Screen" (iOS) or "Install app" (Android).

---

## Rationale

### Why PWA

✅ **No app store friction**: Users tap "Add to Home Screen" → instant install. No review, no approval, no delay.

✅ **Single codebase**: React + Vite, deploy anywhere (GitHub Pages, Vercel, own server). No iOS/Android-specific code.

✅ **Instant updates**: New version pushed to production, users get it on next load (no store review cycle).

✅ **Zero cost**: No developer account fees. Vite PWA plugin free and open-source.

✅ **Works offline**: Service Worker + IndexedDB. Fully functional without network (core requirement).

✅ **Responsive**: Single design works on all screen sizes, orientations.

✅ **Hardware access**: Can access camera, geolocation, vibration via Web APIs. Permission model clearer than native.

### Why NOT Native (React Native / Capacitor)

❌ **App Store Review**: 1-3 days review process per update. Major bug? Can't patch quickly.

❌ **Store Fees**: iOS $99/year, Android $25 one-time. Ongoing account management burden.

❌ **Multiple Codebases**: Even with React Native, separate iOS and Android builds needed. Debug environment complexity.

❌ **Larger Team**: Needs iOS dev, Android dev, or expertise in cross-platform framework. Small team not sustainable.

❌ **Size**: iOS app + Android app combined ~50-100MB. PWA is ~2-5MB.

❌ **Battery**: Native apps can idle, run background tasks. Web apps compete with browser resources.

❌ **Maintenance**: Framework updates (RN 0.70 → 0.71) can break builds. PWA is just React + TypeScript (stable).

### Why NOT Hybrid (Web + App Store)

❌ **Double work**: Maintain web app AND App Store listing, which goes out of sync.

❌ **Review burden**: iOS review still required for app-store version; web version bypasses it. Fragmentation.

❌ **User confusion**: Two ways to install (App Store vs. home screen) create support burden.

❌ **ROI question**: 20-person group doesn't justify app store overhead.

---

## Consequences

### Positive

✅ **Instant updates**: Deploy new version, users see it in <1 min (on reload)
✅ **No approval delay**: Push whenever you want
✅ **Single codebase**: All users run same React app
✅ **No subscriptions**: No annual Apple fees
✅ **Easy support**: Just push a fix; users get it next session
✅ **Version consistency**: No fragmentation (old app store version vs. new web version)
✅ **Offline-first**: Service Worker + IndexedDB, fully offline capable

### Negative

❌ **App Store discoverability**: No iOS App Store listing, can't be "found" by random users
❌ **Credibility**: Some users distrust web apps; native = more "official"
❌ **Persistent icon**: iOS "Add to Home Screen" icon can be accidentally deleted
❌ **Background tasks**: Limited ability to run background processes (notifications require push API)
❌ **Deep linking**: App deep links (wacken://band/slipknot) require extra setup
❌ **Storage limit**: ~50MB quota per browser; if user has lots of bands cached, quota exhaustion possible

---

## Tradeoffs Accepted

### No App Store Presence
**Tradeoff**: Can't be discovered in App Store, only via URL sharing or direct link.
**Acceptance**: For a small known group, discovery not needed. Users are invited to join.

### Persistent Icon Fragility
**Tradeoff**: iOS home screen icon can be deleted like any shortcut.
**Acceptance**: Users can re-add via browser. Not ideal UX, but acceptable for festival (1-time event).

### Limited Background Notifications
**Tradeoff**: Can't do silent push notifications (iOS background fetch). Only visible notifications (Web Push API).
**Acceptance**: Alerts are UI-based, not push. Acceptable for this use case.

### Storage Quota
**Tradeoff**: ~50MB limit across all IndexedDB + cache storage.
**Acceptance**: Band lineup + announcements + crew data << 50MB. Not a concern for single festival.

---

## Implementation Details

### Installation Methods

**iOS (Safari)**:
1. User visits viralatas.example.com in Safari
2. Tap Share → Add to Home Screen
3. Icon added to home screen
4. Tap icon to open app

**Android (Chrome)**:
1. User visits viralatas.example.com in Chrome
2. Menu → "Install app"
3. Icon added to home screen
4. Tap icon to open app

**Both Platforms**:
- App launched in fullscreen ("standalone" mode, no browser chrome)
- Service Worker registered automatically
- Offline access works
- Version updates on next launch (browser checks manifest)

### Service Worker (Workbox)

```typescript
// vite.config.ts
VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'Viralatas Metaleiros',
    display: 'standalone',
    ...
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
    runtimeCaching: [
      {
        urlPattern: /\.supabase\.co/,
        handler: 'NetworkFirst',
      },
    ],
  },
})
```

### Manifest (web.app.json)

```json
{
  "name": "Viralatas Metaleiros",
  "short_name": "Viralatas",
  "description": "Festival companion for Wacken 2026",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#0a0a0a",
  "background_color": "#0a0a0a",
  "icons": [
    {
      "src": "pwa-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "pwa-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## Monitoring & Maintenance

1. **Version tracking**: Monitor app version in browser (localStorage)
2. **Error reporting**: Use Sentry or similar to catch crashes
3. **Update notifications**: Optionally notify users of new version available
4. **Offline metrics**: Track % of sessions that were fully offline

---

## Migration Path (If Needed)

If app grows beyond 20 users and discovers need for app store presence:

1. **Maintain web app** (primary): Continue deploying to web
2. **Add app store release** (secondary): Build iOS app with WebView, wrap web app, submit to App Store
3. **Keep in sync**: Deploy to web first, then request app store update review

This hybrid approach allows for discoverability without abandoning the PWA.

---

## Related Decisions

- **ADR: IndexedDB as Primary Store** — Offline-first architecture enabled by PWA
- **ADR: Supabase as Sync Target** — Backend choice supports instant updates (no app store review delay)

---

## Revision History

- **2026-05**: Initial decision, accepted based on small group size and festival timeline

---

**Last updated:** 2026-05-11
