# Flow: MoshSplit Balance Section

## Purpose

Documents how the **MoshSplit** collapsible section on `/profile` shows a vira-lata's net festival balance from **MoshSplit** (`split.viralatas.org`) — the pack's expense-splitting app — and deep-links them to the external app.

**Phase 23 status:** Part 2 complete and live. The component fetches real balance data from MoshSplit via a Vercel proxy (`/api/moshsplit/…`). Mock code fully removed.

---

## Trigger

User navigates to `/profile`. `ProfilePage` renders `<MoshSplitSection userEmail={user.email ?? ''} />` after `<ConflictSection>`, before `<EditProfileForm>`.

On mount, the component fetches live balance data from MoshSplit via the Vercel proxy and renders one of five states.

---

## Happy Path (Online)

```
User opens /profile
        │
        ▼
MoshSplitSection useEffect
  ├─ setLoadState('loading') — spinner chip in header, skeleton body
  ├─ POST /api/moshsplit/pitboss/v1/balances/external-summary
  │    Bearer: VITE_MOSHSPLIT_TOKEN
  │    Body:   { email: userEmail }
  │    ↓ Vercel rewrites → https://split.viralatas.org/pitboss/v1/balances/external-summary
  └─ Map response → render state
        │
        ├─ 404          → not_found  → return null (invisible)
        ├─ !res.ok      → error      → orange "!" chip + warning msg + CTA
        ├─ balance === 0→ settled    → teal chip + "All settled 🤘" + CTA
        └─ balance ≠ 0  → active     → owes (red) or owed (teal) chip + expense list + CTA
        │
        ▼
User taps "Open MoshSplit →"
        │
        ▼
Opens https://split.viralatas.org (new tab, real <a> element)
```

---

## Offline Behavior (Disconnected)

Balance fetch requires network (`VITE_MOSHSPLIT_TOKEN` + email via Vercel proxy). On failure → `error` state: orange `!` chip + warning message + CTA still visible (user can open MoshSplit manually). No IndexedDB cache for balance — not part of offline-first core data.

---

## Sync Behavior (Reconnect)

No sync queue. Balance is fetched fresh on each profile page mount (Part 2). User must revisit `/profile` to refresh.

---

## Relevant Source Files

| File | Role |
|------|------|
| `src/components/profile/MoshSplitSection.tsx` | Five states, real API fetch, collapsible UI |
| `src/components/profile/MoshSplitSection.module.css` | Chip palette (incl. `chipError`), CTA, layout tokens |
| `src/pages/ProfilePage.tsx` | Mount point after ConflictSection |
| `src/ui/Collapsible.tsx` | Shared collapsible wrapper |
| `vercel.json` | `/api/moshsplit/:path*` → `https://split.viralatas.org/:path*` rewrite |
| `vite.config.ts` | `server.proxy` mirrors Vercel rewrite for local dev |

**Env:** `VITE_MOSHSPLIT_TOKEN` in Vercel / `.env.local` (not committed, documented in `README.md`)

---

## Data Flow Diagram

```
┌─────────────────┐
│ ProfilePage     │
│ user.email      │
└────────┬────────┘
         │ userEmail prop
         ▼
┌─────────────────┐    POST /api/moshsplit/pitboss/v1/balances/external-summary
│ MoshSplitSection│ ──────────────────────────────────────────────────►
└─────────────────┘    Bearer: VITE_MOSHSPLIT_TOKEN  Body: {email}
                                        │
                              Vercel rewrite (same origin)
                                        │
                                        ▼
                       ┌───────────────────────────────┐
                       │ split.viralatas.org            │
                       │ External app — own DB/auth     │
                       │ Returns ApiResponse JSON       │
                       └───────────────────────────────┘
```

---

## Five Render States

| State | Condition | UI |
|-------|-----------|-----|
| `loading` | Fetch in progress | Spinner chip in header, shimmer skeleton body |
| `not_found` | API returned 404 | `return null` — component invisible |
| `error` | API error or network failure | Orange `!` chip in header; `⚠ Could not load MoshSplit data` + CTA in body |
| `settled` | `balance === 0` | Teal chip, "All settled 🤘", CTA |
| `active` | `balance !== 0` | Red chip if owes, teal if owed; expense list + festival/total row + CTA |

**Collapsible:** `defaultOpen={false}`. Header shows logo, label, sub-label (`split.viralatas.org`), balance chip.

---

## Edge Cases

| Case | Behavior |
|------|----------|
| Empty email | `useEffect` returns early; component stays in `loading` state (invisible until email is available) |
| API 404 | `not_found` — entire section absent from DOM |
| Non-OK API response | `error` state — orange chip + warning + CTA |
| Network failure / exception | `error` state — same UI as above |
| Logo load failure | Inline SVG wallet fallback (`LogoFallback` component) |
| EUR currency | `formatAmount()` formats with `de-DE` locale; BRL uses `pt-BR` |
| Component unmounts mid-fetch | `cancelled` flag prevents state updates after unmount |

---

## Important Hooks / Services / Repositories

- **No custom hook** — self-contained component, single `useEffect` on mount.
- **No repository layer** — Part 2 will use direct `fetch` inside component (same self-contained pattern as `PlaylistLaunchButton`).
- **`<Collapsible>`** from `src/ui` — shared with `ConflictSection`.

---

## Open Questions

- Token exchange vs plain URL for authenticated redirect to `split.viralatas.org` (currently opens the app root, user must log in separately).
- Should balance refresh on Realtime or poll while profile is open? Current design: mount-only.
- Should balance be cached in IndexedDB to show stale data while offline rather than the error state?

---

**Last updated:** 2026-05-24 — Phase 23 Part 2 complete; real API via Vercel proxy; error state added; mock code removed
