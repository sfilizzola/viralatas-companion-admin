# ADR: Workbox Caching Strategy

**Status**: Accepted

**Date**: 2026-05

**Deciders**: Product team, engineering lead

---

## Context

The app must work fully offline at Wacken. Three categories of resources need caching:

1. **App shell** — HTML, JS, CSS, icons (the React app itself)
2. **Supabase API responses** — Auth token exchange, DB reads, Edge Function responses
3. **Band images** — ~200 thumbnails from `www.wacken.com` CDN (cross-origin)

Without explicit caching strategy, offline use would fail for:
- The app shell (blank screen if no network)
- Band images (broken img tags)
- API responses (stuck loading spinners)

**Note**: Structured data (picks, bands, announcements) is cached in IndexedDB, not via HTTP cache. The Service Worker handles only the HTTP-layer caching: assets, API responses, images.

Options per resource category:
- **NetworkFirst** — Fetch from network, fall back to cache on failure
- **CacheFirst** — Serve from cache, fall back to network if not cached
- **StaleWhileRevalidate** — Serve stale cache immediately, update in background
- **NetworkOnly** — Never cache (always network)
- **CacheOnly** — Never fetch (always cache)

---

## Decision

| Resource | Strategy | Cache TTL | Rationale |
|----------|----------|-----------|-----------|
| App shell (JS, CSS, HTML, fonts, icons) | **Precached (CacheFirst)** | Unlimited (versioned filenames) | Must work offline; filenames have content hashes |
| Supabase API responses | **NetworkFirst** | 24 hours, max 50 entries | Prefer fresh data; fall back to cached for offline |
| Wacken band images | **CacheFirst** | 30 days, max 200 entries | Cross-origin; immutable per season |

---

## Configuration (vite.config.ts)

```typescript
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    // Precache all build output (app shell)
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json}'],

    runtimeCaching: [
      // Supabase API: NetworkFirst with 24h cache fallback
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'supabase-cache',
          expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
        },
      },

      // Wacken band images: CacheFirst, 30-day TTL, allow opaque responses
      {
        urlPattern: /^https:\/\/www\.wacken\.com\/fileadmin\//i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'band-images',
          expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },  // Allow opaque (CORS) responses
        },
      },
    ],
  },
})
```

---

## Rationale by Resource Type

### App Shell: Precaching with Auto-Update

The Vite build produces JS/CSS files with content hashes in filenames (e.g., `index-Dkj3as9.js`). Workbox's `globPatterns` precaches all matching files during Service Worker installation.

**Why CacheFirst for precached assets?**
- Filenames are versioned — a new deploy creates new filenames
- Old filenames always serve the same content (immutable)
- Cache-first = zero network for app loads = instant startup

**How cache invalidation works**:
- On new deploy, Vite generates new hashed filenames
- Service Worker update routine downloads the new `sw.js`
- `registerType: 'autoUpdate'` — new SW installs and activates automatically
- `skipWaiting` and `clientsClaim` ensure new cache takes effect without user reload (or prompts to reload)
- Old cache entries are pruned by Workbox (not explicitly, but via cache versioning in `sw.js`)

**What gets precached**:
- ✅ `index.html`
- ✅ `main-[hash].js`, `vendor-[hash].js` (React app bundle)
- ✅ `index-[hash].css`
- ✅ `*.woff2` (fonts)
- ✅ `*.ico`, `*.png`, `*.svg` (app icons)
- ✅ `*.json` (i18n files, manifest)
- ❌ `*.mp3`, `*.webm` (not in glob pattern; festival audio would need adding)

---

### Supabase API: NetworkFirst

All requests to `*.supabase.co/*` use NetworkFirst:

1. **Attempt network** — fresh data preferred
2. **If network fails** (offline, timeout) → **serve cache** (up to 24h old)

**Why NetworkFirst for Supabase?**

✅ **Data freshness**: Supabase responses include band data, auth, edge function results. These can change (new announcement, pick by another user). NetworkFirst ensures fresh data when online.

✅ **Offline fallback**: If network fails, the cached response is returned. For auth token exchange, this means the IDB session continues to be valid (no unnecessary logout on flaky network).

✅ **24h TTL**: Old cached responses are purged after 24 hours to prevent stale data accumulating.

**Why NOT CacheFirst for Supabase?**
Cached API responses could be hours old. A user coming back to the app after 6 hours would see stale pick counts if Supabase responses were served from cache. NetworkFirst ensures they see fresh data when online.

**Why NOT StaleWhileRevalidate?**
- SWR serves the stale response and updates cache in background. The user sees old data for a brief moment.
- For auth responses (token refresh), SWR could return an expired token before the background refresh completes → auth error.
- NetworkFirst's 24h fallback provides the same offline resilience without the stale-response risk.

**Cache limit (50 entries)**:
- Prevents unbounded cache growth for API calls
- 50 entries covers typical usage (band list, picks, announcements, presence)

---

### Band Images: CacheFirst

Band thumbnails from `www.wacken.com/fileadmin/` are:
- **Cross-origin**: Different domain from the app; CORS headers may restrict caching
- **Immutable per season**: Same image URL = same image for the entire festival year
- **Numerous**: ~78 bands × 1 image each = ~200 files
- **Binary**: Can't store in IndexedDB (IndexedDB is for structured JSON data)

**Why CacheFirst for band images?**

✅ **Offline**: Band images must be visible even without network. CacheFirst serves them instantly.

✅ **Performance**: HTTP cache avoids re-downloading 200 images on every app load.

✅ **Immutable content**: Wacken doesn't change band artwork mid-festival. CacheFirst is safe.

✅ **30-day TTL**: Long enough for the festival (4 days) with plenty of margin.

**The `cacheableResponse: { statuses: [0, 200] }` option**:

Cross-origin images without CORS headers return **opaque responses** (HTTP status 0 in the Service Worker, body inaccessible). Browsers don't normally cache these. This option tells Workbox to cache opaque responses anyway.

**Risk of opaque caching**: A 404 can be cached as status 0 (indistinguishable from 200 in opaque mode). Mitigated by the 30-day TTL (stale entries expire) and maxEntries limit (200).

---

## Cache Invalidation

### App Shell
Automatic via versioned filenames (content hash) + `registerType: 'autoUpdate'`.

### Supabase Cache
Time-based: 24h TTL + LRU (max 50 entries). No explicit invalidation needed.

### Band Images
Time-based: 30-day TTL + LRU (max 200 entries). If Wacken updates a band image mid-season (rare), the old image stays cached up to 30 days. Acceptable risk.

### Force-Refresh (Nuclear Option)
The `meta` IndexedDB store has a `cache_version` key. If the backend increments `meta.cache_version`, `CacheVersionCheck` in `App.tsx` calls `wipeAllLocalData()`. This clears IndexedDB stores (not the HTTP cache). HTTP cache is not affected, but all structured data forces a re-fetch.

To fully clear HTTP cache: Service Worker update (new `sw.js` version) causes Workbox to prune old caches automatically.

---

## Update Strategy

`registerType: 'autoUpdate'` means:
1. Service Worker checks for updates in the background on app load
2. New `sw.js` downloads silently
3. New SW activates when all tabs using the old SW are closed (or immediately if the app uses `skipWaiting` + `clientsClaim`)
4. `vite-plugin-pwa` injects `skipWaiting` + `clientsClaim` — new version takes effect without user action
5. Old caches are pruned by Workbox on activation

**User experience**: Update is seamless. The user may briefly see old content, then the page auto-refreshes to the new version.

---

## Consequences

### Positive

✅ App shell loads instantly offline (precached)
✅ Band images visible offline (CacheFirst, 30-day TTL)
✅ Supabase API responses cached as fallback for flaky network
✅ Auto-updates seamlessly without user action
✅ Cross-origin images cached despite CORS restrictions
✅ Band image cache size bounded (max 200 entries)

### Negative

❌ **Opaque caching risk**: A failed image request (4XX) could be cached as status 0 for 30 days
❌ **NetworkFirst adds latency**: For Supabase requests, the network is always tried first. On poor connections, this adds 500ms+ before cache fallback
❌ **Cache not encrypted**: HTTP cache on disk is not encrypted. Sensitive API response bodies could be read by physical device access
❌ **Service Worker complexity**: The `autoUpdate` + `skipWaiting` strategy can cause jarring reloads on slow connections if not handled carefully in the UI

---

## Tradeoffs Accepted

### Opaque Band Image Caching
**Tradeoff**: Cache a Wacken CDN response even without knowing if it was a success (status 0).
**Acceptance**: Wacken CDN is reliable. In practice all responses are 200. Stale broken entries expire in 30 days.

### NetworkFirst Adds Latency for Supabase
**Tradeoff**: On slow network, Supabase calls wait for timeout before falling back to cache.
**Acceptance**: Workbox NetworkFirst has a reasonable timeout (default 10s). Structured data is served from IndexedDB, not HTTP cache, so UI responsiveness is unaffected. HTTP cache is only a fallback for auth and edge functions.

### Unencrypted Cache
**Tradeoff**: API responses (non-sensitive: band data, pick counts) are cached unencrypted.
**Acceptance**: No secrets or PII in cached API responses. Auth tokens are in IndexedDB (not HTTP cache).

---

## Related Decisions

- **ADR: IndexedDB as Primary Store** — Structured data (picks, bands) is NOT cached by Service Worker; it lives in IndexedDB
- **ADR: PWA Not Native** — Service Worker caching is only possible because this is a PWA

---

## Revision History

- **2026-05**: Initial decision, accepted based on project requirements

---

**Last updated:** 2026-05-12
