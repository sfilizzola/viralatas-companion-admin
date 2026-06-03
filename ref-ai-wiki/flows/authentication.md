# Flow: Authentication

## Purpose

Document how users register, log in, maintain session state, and how the database trigger provisions each new user's profile row. Also covers test user creation, godlike role assignment, RLS enforcement, and session persistence to IndexedDB.

---

## Relevant Source Files

- `src/pages/LoginPage.tsx` — Sign-in form, profile verification with retry, "Forgot password?" inline step
- `src/pages/RegisterPage.tsx` — Sign-up form, registration gate, trigger-latency retry
- `src/pages/ResetPasswordPage.tsx` — Password reset form; listens for `PASSWORD_RECOVERY` auth event
- `src/hooks/useAuth.ts` — Session state subscription, cleanup
- `src/lib/supabase.ts` — Supabase client with custom IndexedDB auth storage
- `src/lib/db.ts` — `loadSession()`, `saveSession()` (IDB session store)
- `src/components/PrivateRoute.tsx` — Route guard for authenticated pages
- `src/i18n/AuthPage_*.json` — All auth + password-reset strings (br / en / es / de)
- `supabase/migrations/20240101000000_initial_schema.sql` — Original `handle_new_user` trigger
- `supabase/migrations/20260504000005_fix_handle_new_user_trigger.sql` — Bug-fixed trigger with `coalesce()`
- `supabase/migrations/20260504000003_add_test_user_flag.sql` — `is_test_user` column

---

## Triggers

There are three entry points into the authentication flow:

1. **Login** — returning user submits email + password at `/login`
2. **Registration** — new user submits display name + email + password at `/register`
3. **Password Recovery** — user clicks "Forgot password?" on `/login`, requests a reset email, then follows the link to `/reset-password`

Registration is gated behind an `app_settings` flag (`registration_enabled`). When disabled, `/register` redirects to `/login`. Godlike users can toggle this in the profile admin panel.

---

## Custom Auth Storage: IndexedDB

Instead of the default Supabase `localStorage` persistence, this app uses a custom storage adapter backed by IndexedDB:

```typescript
// src/lib/supabase.ts
export const supabase = createClient<Database>(url, key, {
  auth: {
    persistSession: true,
    storageKey: 'viralatas-auth',
    storage: {
      getItem: async (key) => {
        const session = await loadSession();   // IDB read
        return (session as Record<string, string>)?.[key] ?? null;
      },
      setItem: async (key, value) => {
        const existing = await loadSession();
        await saveSession({ ...existing, [key]: value });  // IDB write
      },
      removeItem: async (key) => {
        const existing = await loadSession();
        delete existing[key];
        await saveSession(existing);
      },
    },
  },
});
```

**Why IndexedDB instead of localStorage?**

- `localStorage` is synchronous — Supabase's async storage adapter needs async operations
- `localStorage` can be cleared by browser settings or private mode
- `IndexedDB` survives app restart and works in all PWA contexts
- Supabase validates the token server-side on reconnect, so the IDB token is just a cache of the last known session

The IDB `session` store has a single key `'current'` holding a JSON object of all Supabase auth keys.

---

## Flow: Login (Returning User)

```
User navigates to /login
         │
         ▼
LoginPage renders (checks registrationEnabled flag from Supabase)
         │
         ▼
User submits email + password
         │
         ▼
supabase.auth.signInWithPassword({ email, password })
         │
         ├─ Error (wrong credentials, user banned) → display error, stay on /login
         │
         └─ Success → { data: { user, session } }
                  │
                  ├─ session persisted to IDB via custom storage adapter
                  │  (Supabase calls setItem() which calls saveSession())
                  │
                  ├─ Profile verification with retry (up to 3 attempts):
                  │  supabase.from('users').select('id, role, preferred_language').eq('id', user.id)
                  │  Retry delays: 200ms, 300ms (covers trigger latency on first-ever load)
                  │
                  ├─ Profile not found after retries → sign out + error message
                  │
                  └─ Profile found → navigate('/now')
```

**Timeline**:
```
T=0ms  — User submits form
T=100ms— Supabase auth.signInWithPassword resolves → session in IDB
T=110ms— Profile check (attempt 1)
         → Success on first try for existing users → navigate to /now
```

---

## Flow: Registration (New User)

```
User navigates to /register
         │
         ▼
RegisterPage checks registration_enabled via getRegistrationEnabled()
         ├─ Disabled → redirect to /login immediately
         └─ Enabled → render form
         │
         ▼
User submits display_name + email + password
         │
         ▼
Double-check: getRegistrationEnabled() (guards against race with admin disabling)
         ├─ Disabled → redirect to /login
         │
         └─ Enabled →
                  │
                  ▼
         supabase.auth.signUp({
           email, password,
           options: {
             data: {
               display_name: displayName,
               preferred_language: language,  // from useI18n context
               is_test_user: false,
             }
           }
         })
                  │
                  ├─ Error → display error
                  │
                  └─ Success → { data: { user } }
                           │
                           ├─ auth.users row created (Supabase managed)
                           ├─ trigger fires: handle_new_user() (see below)
                           │
                           ├─ Profile verification with retry (up to 4 attempts):
                           │  delays: 200ms, 300ms, 400ms
                           │  Covers trigger propagation latency (~50–300ms typical)
                           │
                           ├─ Profile not found → error message (trigger failed)
                           │
                           └─ Profile found → navigate('/now')
```

---

## Flow: Password Recovery

The recovery flow uses Supabase's built-in email-based password reset. No schema changes are needed — Supabase manages the one-time token.

```
User clicks "Forgot password?" on /login
         │
         ▼
Inline "Are you sure?" confirmation panel appears
(email field pre-filled if user already typed it)
         │
         ├─ Cancel → panel dismissed, back to normal login form
         │
         └─ Confirm (submit email) →
                  │
                  ▼
         supabase.auth.resetPasswordForEmail(email, {
           redirectTo: `${origin}/reset-password`
         })
                  │
                  ├─ Error (invalid email, rate limit) → inline error shown
                  │
                  └─ Success → green "Check your email" message shown
                           │
                           (user receives email from Supabase)
                           │
                           ▼
                  User clicks link in email
                           │
                           ▼
                  Browser opens: /reset-password#access_token=...&type=recovery
                           │
                           ▼
                  ResetPasswordPage mounts
                  supabase.auth.onAuthStateChange fires: PASSWORD_RECOVERY
                  → setSessionReady(true)
                           │
                           ▼
                  "Cassio, is it you again?" form shown
                  User types new password + confirmation
                           │
                           ├─ Passwords don't match → inline error (localized)
                           │
                           └─ Match → supabase.auth.updateUser({ password })
                                    │
                                    ├─ Error → inline error shown
                                    │
                                    └─ Success → green success message
                                             → navigate('/now') after 1.8s
```

**Timeline**:
```
T=0ms    — User submits email on "Are you sure?" panel
T=200ms  — Supabase confirms reset email queued
T=?      — User opens email, clicks link (seconds to minutes later)
T=0ms    — /reset-password loads, PASSWORD_RECOVERY event fires
T=50ms   — sessionReady = true, form renders
T=?      — User types new passwords, submits
T=300ms  — supabase.auth.updateUser() resolves
T=300ms  — Success message shown
T=2100ms — navigate('/now')
```

**How Supabase handles the token**: The recovery link contains a short-lived JWT in the URL hash (`#access_token=...`). When the page loads, Supabase's JS client automatically exchanges it for a session and fires `onAuthStateChange('PASSWORD_RECOVERY')`. The `ResetPasswordPage` listens for this event to unlock the form.

**Session fallback**: If the user refreshes the page after the token is exchanged, `supabase.auth.getSession()` returns the active session, so `sessionReady` is set via the fallback `getSession()` call and the form remains usable.

**The page header says "Cassio, is it you again?"** — a permanent in-joke referencing a friend in the vira-latas group who frequently forgets his password. The name "Cassio" is intentionally hard-coded in all 4 language translations and must never be replaced with a generic string.

**Localization**: All strings live in `src/i18n/AuthPage_*.json` under keys:
`forgotPassword`, `forgotPasswordConfirm`, `sendResetLink`, `sendingResetLink`, `resetLinkSent`, `cancelAction`, `resetPasswordTitle`, `resetPasswordSubtitle`, `newPassword`, `confirmPassword`, `passwordsDoNotMatch`, `resetPasswordAction`, `resetPasswordLoading`, `resetPasswordSuccess`, `resetPasswordNoSession`

**Route**: `/reset-password` is a **public route** (no `PrivateRoute` wrapper). It must be accessible before login because the user arrives unauthenticated via the email link.

---

## Database Trigger: handle_new_user()

Every call to `supabase.auth.signUp()` inserts a row in `auth.users`, which fires this PostgreSQL trigger:

```sql
-- supabase/migrations/20260504000005_fix_handle_new_user_trigger.sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (
    id, email, display_name, avatar_url,
    preferred_language, is_test_user, role
  )
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', NULL),
    coalesce(new.raw_user_meta_data->>'avatar_url', NULL),
    coalesce(new.raw_user_meta_data->>'preferred_language', 'br'),
    coalesce(new.raw_user_meta_data->>'is_test_user' = 'true', false),
    CASE WHEN new.email = 'sfilizzola@gmail.com' THEN 'godlike' ELSE 'normal' END
  )
  ON CONFLICT (id) DO UPDATE SET
    role = CASE
      WHEN excluded.email = 'sfilizzola@gmail.com' THEN 'godlike'
      ELSE public.users.role
    END;
  RETURN new;
END;
$$;
```

**What the trigger does**:

1. Creates a `public.users` row mirroring the `auth.users` row
2. Reads `display_name`, `avatar_url`, `preferred_language` from `raw_user_meta_data`
3. Sets `is_test_user` from metadata (default `false`)
4. Assigns role: `'godlike'` for `sfilizzola@gmail.com`, `'normal'` for everyone else
5. On re-run (conflict on `id`): updates role for godlike email; preserves existing role for others

**Critical bug fix (migration 20260504000005)**:

The original trigger used:
```sql
new.raw_user_meta_data->>'is_test_user' = 'true'  -- ❌ WRONG
```

When `is_test_user` was absent from metadata, this returned `NULL = 'true'` → `NULL` → NOT NULL constraint violation → signup succeeds in `auth.users` but `public.users` insert fails silently.

The fix uses `coalesce()`:
```sql
coalesce(new.raw_user_meta_data->>'is_test_user' = 'true', false)  -- ✅ CORRECT
-- If field missing: NULL → coalesce → false
```

**Never revert** this to the original form.

---

## Session State Management (useAuth)

```typescript
// src/hooks/useAuth.ts
export function useAuth(): { session, user, loading } {
  const [state, setState] = useState({ session: null, user: null, loading: true });

  useEffect(() => {
    // 1. Load existing session from IDB on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({ session, user: session?.user ?? null, loading: false });
    });

    // 2. Subscribe to future auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setState({ session, user: session?.user ?? null, loading: false });
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return state;
}
```

**Auth state changes** that trigger `onAuthStateChange`:
- `SIGNED_IN` — after successful login or signup
- `SIGNED_OUT` — after `supabase.auth.signOut()`
- `TOKEN_REFRESHED` — Supabase auto-refreshes JWTs
- `USER_UPDATED` — profile metadata changed (also fires after `updateUser({ password })`)
- `PASSWORD_RECOVERY` — user arrived via a password-reset email link; `ResetPasswordPage` listens for this to unlock the reset form

**`loading: true`** on initial mount prevents route guards from redirecting to login before the IDB session is read.

---

## Session Persistence

```
App loads (PWA)
     │
     ▼
supabase.auth.getSession()
     │
     ├─ Custom storage.getItem('viralatas-auth-token') called
     │   → loadSession() → IDB read from 'session' store key='current'
     │   → Returns stored JSON with JWT
     │
     ├─ JWT valid → useAuth() returns { session, user }
     │   → PrivateRoute allows access → /now rendered
     │
     └─ JWT expired → Supabase auto-refreshes via refresh token
         → storage.setItem() called → IDB updated
         → useAuth() returns new session
```

**Session survives**:
- App close and reopen
- Browser restart
- PWA reinstall (IndexedDB is preserved)
- Network loss (IDB read is local)

**Session clears when**:
- User clicks "Sign Out" (`supabase.auth.signOut()` calls `storage.removeItem()`)
- Refresh token expires (user must log in again)
- Browser clears IndexedDB (DevTools, privacy mode)

---

## Route Guards (PrivateRoute)

Unauthenticated users are redirected to `/login` by `PrivateRoute`:

```typescript
// src/components/PrivateRoute.tsx
function PrivateRoute({ children }) {
  const { session, loading } = useAuth();
  if (loading) return <LoadingSpinner />;  // Wait for IDB session check
  if (!session) return <Navigate to="/login" replace />;
  return children;
}
```

All app routes (`/now`, `/schedule`, `/my-picks`, `/popular`, `/announcements`, `/profile`, `/wrap`) are wrapped in `PrivateRoute`.

**Public routes** (no `PrivateRoute`): `/login`, `/register`, `/reset-password`. The reset page must be public because the user arrives unauthenticated from an email link.

---

## Test User Creation

Godlike users can create test vira-latas via the seed script or admin panel. Test users have `is_test_user: true` in their metadata.

**Via seed script** (`supabase/seed/seed-test-users.ts`):
```typescript
await supabase.auth.signUp({
  email: 'test-user@example.com',
  password: 'testpassword',
  options: {
    data: {
      display_name: 'Test User',
      is_test_user: true,
    }
  }
});
```

The trigger sets `public.users.is_test_user = true`, role = `'normal'`.

**Godlike can**:
- Toggle `is_test_user` on/off via admin panel
- Assign special badges to test users
- Soft-delete test user announcements

---

## RLS Enforcement

Row Level Security enforces per-table access rules at query time:

| Table | Policy | Condition |
|-------|--------|-----------|
| `users` | Read own | `auth.uid() = id` |
| `users` | Update own | `auth.uid() = id` |
| `users` | Read crew | `to authenticated` (via separate policy) |
| `bands` | Read all | `to authenticated` |
| `user_picks` | Read all | `to authenticated` |
| `user_picks` | Insert own | `auth.uid() = user_id` |
| `user_picks` | Delete own | `auth.uid() = user_id` |
| `announcements` | Read non-deleted | `deleted_at IS NULL` |
| `announcements` | Insert own | `auth.uid() = author_id` |
| `user_presence` | Read all | `to authenticated` |
| `user_presence` | Write own | `auth.uid() = user_id` |

**All Supabase calls include the JWT** in the `Authorization` header. Supabase validates it and applies RLS before executing any query.

**AnonymouS access returns 0 rows** — RLS blocks everything without a valid JWT.

---

## Offline Behavior

| Scenario | Behavior |
|----------|----------|
| User opens app offline with valid IDB session | `getSession()` reads from IDB → logged in, no network needed |
| User opens app offline with no session | Redirected to `/login`; login requires network |
| Token expires while offline | App still works using stale session; Supabase refreshes on reconnect |
| User taps Sign Out offline | `signOut()` calls `removeItem()` → IDB cleared → redirected to `/login`; server-side invalidation happens on reconnect |

---

## Data Flow Diagram

```
Browser load / app start
         │
         ▼
┌──────────────────────────────────────────────────────┐
│                    useAuth()                          │
│  supabase.auth.getSession()                          │
│  → custom storage.getItem('viralatas-auth-token')    │
│  → loadSession() [IndexedDB 'session' store]         │
│  → JWT found → setState({ session, user })           │
└──────────────────────────────────────────────────────┘
         │
         ├─ loading: false + session present → PrivateRoute lets through
         │
         └─ loading: false + no session → redirect to /login
                  │
                  ▼
         ┌─────────────────────────┐
         │  LoginPage / Register   │
         └──────────┬──────────────┘
                    │ signInWithPassword / signUp
                    ▼
         ┌─────────────────────────────────────┐
         │  Supabase Auth (server)              │
         │  Validates credentials               │
         │  Returns JWT + refresh token         │
         └──────────┬──────────────────────────┘
                    │ onAuthStateChange(SIGNED_IN)
                    ▼
         ┌─────────────────────────────────────┐
         │  custom storage.setItem()           │
         │  → saveSession() [IndexedDB]        │
         └──────────┬──────────────────────────┘
                    │
                    ▼
         useAuth() setState({ session, user })
                    │
                    ▼
         PickSync, AnnouncementSync, CacheVersionCheck
         (all trigger on userId change)
```

---

## Edge Cases

### 1. Trigger Latency on First Signup

The `handle_new_user()` trigger fires asynchronously after `auth.users` insert. The client may receive the `signUp()` response before the trigger completes, causing the profile verification check to fail on attempt 1.

**Mitigation**: `RegisterPage` retries up to 4 times with increasing delays (200ms, 300ms, 400ms). Trigger typically completes in <100ms on production Supabase.

### 2. Trigger Fails (Production Bug)

If the trigger function throws (e.g., NOT NULL violation, schema mismatch), `auth.users` has the row but `public.users` does not. The user's signup appears to succeed but they can't use the app.

**Mitigation**: Profile verification with retry surfaces this to the user as "Profile synchronization failed". They must contact support. This was the bug fixed in migration `20260504000005`.

### 3. JWT Expiry During Use

Supabase JWTs expire every 1 hour by default. The client auto-refreshes using the stored refresh token before expiry.

**What happens**: `onAuthStateChange(TOKEN_REFRESHED)` fires → `setItem()` updates IDB → same session, new token.

**If refresh fails** (offline, token revoked): `SIGNED_OUT` fires → `setState({ session: null })` → PrivateRoute redirects to `/login`.

### 4. Concurrent Sessions (Same User, Two Devices)

Both devices have valid sessions. If the user logs out on device A:

- Device A: `signOut()` → `removeItem()` → IDB cleared → `/login`
- Device B: Server-side token revoked → next Supabase call fails → `SIGNED_OUT` event → `/login`

Device B may continue using the app until its next Supabase call (could be minutes if purely reading from IndexedDB offline).

### 5. Registration Disabled Mid-Flow

Admin disables registration while user is filling out the form. The `handleSubmit` double-checks `getRegistrationEnabled()` before calling `signUp()`, so the user gets redirected to `/login` rather than seeing a Supabase error.

---

## Known Limitations

1. **No email verification**: Supabase email confirmation is disabled. Users can sign up with any email without verifying ownership.

2. **Godlike is hard-coded to email**: The godlike role is assigned by matching email string in the trigger. If the godlike user changes their email, the trigger won't re-assign the role.

3. **Test users visible to crew**: `is_test_user: true` is a DB flag but there's no UI filtering to hide test users from crew grids.

4. **Recovery link is single-use**: The Supabase recovery token in the email link is consumed on first exchange. If the user refreshes `/reset-password` before submitting, the `PASSWORD_RECOVERY` event won't fire again, but the `getSession()` fallback keeps the form available as long as the browser tab isn't closed.

---

**Last updated:** 2026-05-12 (password recovery flow added)
