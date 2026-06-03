# Flow: Duck Quack

## Purpose

Documents the full lifecycle of a duck quack — from button press to in-app toast and Web Push system notification — including cooldown mechanics, offline queuing, and the diagnostic test flow available to godlike admins.

---

## Trigger

A vira-lata who has **picked a band** presses the rubber duck 🦆 button on that band's card while the band is **currently live** (and `category !== 'ceremony'`). The quack is sent to all other vira-latas who also picked that band.

---

## Visibility Conditions

The duck button renders only when ALL of these are true:

| Condition | Source |
|-----------|--------|
| Band is currently live | `isBandLive` from `useNowData` / `bandTime.ts` |
| Current user has picked that band | `useMyPicks` → IndexedDB |
| Band is not a ceremony | `band.category !== 'ceremony'` |
| User is on `/now` (CrewGroupsSection) or `/schedule` (DuckableBandCard) | route-specific wiring |

---

## Happy Path (Online)

```
User presses duck button
        │
        ▼
useDuckQuack.quack()
  ├─ Checks isOnCooldown → false, proceed
  ├─ Sets localStorage key duck_cooldown:{userId}:{bandId} = now + 90s
  ├─ setCooldownUntil(now + 90s) → drain animation starts
  └─ duckRepository.quackBand(userId, bandId)
            │
            ▼
     navigator.onLine = true
            │
            ▼
     supabase.from('duck_quacks').insert(...)
            │
            ├──────────────────────────────────────────────┐
            │                                              │
            ▼                                              ▼
  Supabase Realtime INSERT event              Supabase Database Webhook
  received by all connected clients           fires send-duck-push
            │                                              │
            ▼                                              ▼
  useDuckNotifications (in App.tsx)    send-duck-push Edge Function
  ├─ Filters: row.user_id !== userId   ├─ Queries user_picks for band
  └─ Filters: pickedBandIds.has(...)   │   (excluding quacker)
            │                          ├─ Queries push_subscriptions
            ▼                          │   for recipient user_ids
  window.dispatchEvent(                └─ webpush.sendNotification(...)
    'viralatas:duck-quack',                        │
    { bandId, bandName? }                          ▼
  )                                    Service Worker 'push' event
            │                          └─ registration.showNotification(
            ▼                               bandName, { body: '🦆 quack!',
  DuckToast appears (floating,               icon: '/rubber-duck.png' })
  band name, auto-dismisses 3s)
```

---

## Cooldown Mechanics

- Cooldown is **90 seconds per user per band**, stored in `localStorage`
- Key format: `duck_cooldown:{userId}:{bandId}` → value is expiry timestamp (ms)
- `useDuckQuack` reads on mount and on userId/bandId change; auto-clears via `setTimeout`
- The drain animation is a CSS conic-gradient overlay that sweeps clockwise from 12 o'clock, representing elapsed cooldown (dark area = remaining time)
- Cooldowns are **per-user and independent** — other users' cooldowns are not visible and do not affect each other

---

## Offline Behavior

```
User presses duck (offline)
        │
        ▼
useDuckQuack.quack()
  ├─ Cooldown set in localStorage (same as online)
  └─ duckRepository.quackBand(userId, bandId)
            │
            ▼
     navigator.onLine = false
            │
            ▼
  enqueueOfflineDuckQuack(...)
  → Stored in IndexedDB 'offline_duck_quacks' store
```

**No in-app toast** is shown for the quacker's own quack (by design). Other users see nothing until reconnect.

---

## Sync Behavior (Reconnect)

```
'online' event fires
        │
        ▼
DuckSync (App.tsx)
  └─ duckRepository.flushOfflineDucks()
            │
            ▼
  For each op in offline_duck_quacks:
    supabase.from('duck_quacks').insert(...)
    if ok → removeFromOfflineDuckQuackQueue(op.id)
    if error → left in queue for next retry
            │
            ▼
  Supabase INSERT → Webhook → send-duck-push
  (identical to online path from here)
```

**Edge case:** If the band set ended before reconnect, the quack is still flushed and the Web Push is still sent. Documented as "stale but harmless."

---

## Web Push Subscription Setup

Before any quack can be received as a system notification, the device must be subscribed:

```
User logs in
        │
        ▼
PushSetup (App.tsx) → subscribeToPush(userId)
  ├─ Guard: VITE_VAPID_PUBLIC_KEY must be set
  ├─ Guard: 'serviceWorker' and 'PushManager' must exist
  ├─ Notification.requestPermission() → 'granted'
  ├─ navigator.serviceWorker.ready → registration
  ├─ registration.pushManager.getSubscription() or .subscribe(...)
  └─ supabase.from('push_subscriptions').upsert(
       { user_id, endpoint, p256dh, auth },
       { onConflict: 'endpoint' }
     )
```

**iOS note:** The PWA must be installed to the Home Screen via Safari "Add to Home Screen." Push permission cannot be granted while running inside the Safari browser tab.

---

## Service Worker Push Handler

When the OS delivers a Web Push to the device:

```typescript
// src/workers/sw.ts
self.addEventListener('push', (event) => {
  const data = event.data.json(); // { title: bandName, body: '🦆 quack!' }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/rubber-duck.png',
      badge: '/rubber-duck.png',
      tag: 'duck-quack',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // Focus existing window or open /now
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      for (const c of clients) if ('focus' in c) return c.focus();
      return self.clients.openWindow('/now');
    })
  );
});
```

---

## Killswitch (Phase 21)

The duck feature has a global killswitch managed from **Godlike Powers → Duck feature**.

- **Source of truth:** `app_settings.duck_enabled boolean default true not null`. Inherits the existing `app_settings_select` (anyone can read) and `app_settings_update` (godlike only) RLS policies — no new policies were added.
- **Read path:** fetched once at app boot via `getDuckEnabled()` in `src/lib/appSettings.ts`, cached in `DuckEnabledProvider` (`src/contexts/DuckEnabledContext.tsx`), consumed by `useDuckEnabled()`.
- **UI gate points:** three consumer call-sites read the cached value:
  - `src/pages/RightNowPage.tsx` — passes `undefined` to `CrewGroupsSection`'s `onDuck` prop when off
  - `src/pages/SchedulePage.tsx` (`DuckableBandCard`) — `canDuck` short-circuits to `false` when off
  - `src/components/profile/GodlikeAdminPanel.tsx` — renders a "currently disabled for all users" hint above the Test Quack tile when off (the tile itself stays functional)
- **Propagation:** *next load only*. There is no Realtime subscription on `app_settings`; a user mid-session won't see the change until reload. The admin's own session refreshes the context value immediately after a successful toggle via `useRefreshDuckEnabled()`.
- **Default-on resilience:** `getDuckEnabled()` returns `true` on any read failure. A transient network error never silently disables the feature.
- **Server-side is untouched.** `send-duck-push`, `duck_quacks` INSERT, and `useDuckNotifications` Realtime subscription are all gate-free. Offline-queued ducks still flush on reconnect even if the switch was flipped to OFF in the meantime — this respects the user's intent at press time (offline-first principle: never silently drop a queued action). Recipients still receive the in-app toast / Web Push for those legitimately-intent ducks.
- **The killswitch is purely a "future button visibility" gate**, not a data block. A press that already happened gets honored; a press that hasn't happened yet simply has no button to press.

---

## Admin Test Flows

### Test Quack (in-app toast only)
Found in: **Godlike Powers → Test Quack**

- Pressing the duck starts a **15-second** drain animation
- After 15 seconds: dispatches `viralatas:duck-quack` window event with `{ bandName: 'Queen' }` locally
- `DuckToast` shows the floating toast
- **No database write. No Web Push. Only tests the DuckToast component.**
- Remains visible and functional even when the Phase 21 killswitch is OFF — a "currently disabled for all users" hint appears above the button so the admin knows users aren't seeing the feature.

### Test Push Notification (full Web Push stack)
Found in: **Godlike Powers → Test Push Notification**

- Calls `send-test-push` Edge Function via `supabase.functions.invoke`
- Edge Function authenticates the caller via JWT, queries their `push_subscriptions`, sends a real VAPID push
- Tests the complete stack: VAPID keys → `push_subscriptions` table → Service Worker `push` event → OS system notification
- Feedback shown inline:
  - ✅ `testPushSent` — push delivered, check system notifications
  - ⚠️ `testPushNoSubscription` — no subscription row found; permission not granted or `subscribeToPush` failed
  - ❌ `testPushFailed` — push delivery error; check VAPID keys / Supabase secrets
  - ❌ `testPushError` — Edge Function call failed; check deployment

---

## Relevant Source Files

| File | Role |
|------|------|
| `src/hooks/useDuckQuack.ts` | Cooldown state + quack dispatch (derives `isOnCooldown` via `useCooldown`) |
| `src/hooks/useCooldown.ts` | Render-pure cooldown derivation. Takes a `cooldownUntil: number \| null \| undefined`, returns whether the deadline is still in the future; flips to `false` automatically via a `setTimeout` inside `useEffect`. Used by `DuckButton`, `useDuckQuack`, and the Godlike Test Quack tile. |
| `src/hooks/useDuckNotifications.ts` | Realtime subscription + window event |
| `src/repositories/duck.ts` | Supabase INSERT + offline queue |
| `src/lib/db.ts` | `offline_duck_quacks` IDB store |
| `src/lib/pushSubscription.ts` | Push subscription registration |
| `src/components/DuckButton.tsx` | Button UI with drain animation. **Prop contract:** `{ onDuck, cooldownUntil, inBody?, tile? }` — `isOnCooldown` is derived internally via `useCooldown(cooldownUntil)`, never passed in. |
| `src/components/DuckToast.tsx` | Floating in-app toast |
| `src/workers/sw.ts` | `push` + `notificationclick` SW handlers |
| `src/App.tsx` | `DuckSync`, `PushSetup`, `DuckNotificationsListener`, `DuckToast` mounting |
| `src/pages/RightNowPage.tsx` | Passes `onDuck` to `CrewGroupsSection` |
| `src/pages/SchedulePage.tsx` | `DuckableBandCard` wrapper |
| `src/components/now/CrewGroupsSection.tsx` | DuckButton in live band group card |
| `src/components/BandCard.tsx` | `onDuck?` prop + `.withDuck` grid variant |
| `src/components/profile/GodlikeAdminPanel.tsx` | Test Quack + Test Push buttons + Duck feature killswitch toggle |
| `src/contexts/DuckEnabledContext.tsx` | Phase 21 killswitch Context provider + `useDuckEnabled` / `useRefreshDuckEnabled` hooks |
| `src/lib/appSettings.ts` | `getDuckEnabled` / `setDuckEnabled` helpers (alongside registration killswitch helpers) |
| `supabase/functions/send-duck-push/index.ts` | Web Push for real quacks |
| `supabase/functions/send-test-push/index.ts` | Diagnostic test push for admins |

---

## Data Flow Diagram

```
                    ┌──────────────────────┐
                    │   DuckButton (UI)     │
                    └──────────┬───────────┘
                               │ press
                               ▼
                    ┌──────────────────────┐
                    │   useDuckQuack       │
                    │   (cooldown + quack) │
                    └──────────┬───────────┘
                               │ quackBand(userId, bandId)
                               ▼
              ┌────────────────────────────────┐
              │       duckRepository            │
              │                                │
     online ──┤→ supabase INSERT duck_quacks   │
    offline ──┤→ IndexedDB offline_duck_quacks │
              └────────────────┬───────────────┘
                               │ on reconnect: flushOfflineDucks
                               │
             ┌─────────────────┴─────────────────────────┐
             │                                           │
             ▼ Supabase Realtime                        ▼ DB Webhook
  ┌───────────────────────┐              ┌────────────────────────────┐
  │ useDuckNotifications  │              │  send-duck-push (Deno)     │
  │ (other users' clients)│              │  • query user_picks        │
  │                       │              │  • query push_subscriptions│
  │ → viralatas:duck-quack│              │  • webpush.sendNotification│
  │   window event        │              └────────────┬───────────────┘
  └──────────┬────────────┘                           │ Web Push
             │                                        ▼
             ▼                            ┌───────────────────────┐
  ┌──────────────────────┐               │ Service Worker (push) │
  │   DuckToast           │              │ showNotification(...)  │
  │   (in-app floating)   │              └───────────────────────┘
  └──────────────────────┘
```

---

## Edge Cases

- **Quacker never receives their own notification** — filtered in both `useDuckNotifications` (client-side) and `send-duck-push` (server-side)
- **Stale offline quacks** — if the band set ends before reconnect, the quack still flushes and a push is sent. Harmless.
- **Multiple devices** — a user with two devices gets two push notifications. Acceptable for ~20 users.
- **Expired push subscriptions** — a `410 Gone` from the push service indicates the subscription is stale. `send-duck-push` does not currently clean up stale rows; this is a known open item.
- **iOS Safari** — push only works in installed PWA mode, not in a Safari tab.
- **Ceremony bands** — duck button is never rendered for `category === 'ceremony'` bands, enforced in `BandCard` and `useNowData`.
- **`VITE_VAPID_PUBLIC_KEY` missing** — `subscribeToPush` exits silently; no push subscription is created; users will never receive Web Push.
