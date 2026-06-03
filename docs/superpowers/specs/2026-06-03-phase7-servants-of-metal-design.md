# Phase 7 — Servants of Metal: Design Spec

**Date:** 2026-06-03  
**Phase:** 7 — User Management (`D-01`)  
**Status:** Approved for implementation

---

## Overview

Replace the `ManageServants` stub with a full user management view. The godlike user can see all registered users, change their role (normal ↔ manager) and friend status, and delete any non-godlike user from the database entirely.

**No user creation in this phase.**

---

## Scope

- List **all** users in `public.users` (not limited to `is_test_user = true`)
- Each user card shows: avatar/initials, name, email, role badge, badge count, friend status
- Inline editable fields: `role` (manager toggle), `is_friend` (toggle)
- Delete any user except godlike (requires Edge Function)
- **Visual design:** Variant C — Command Strip (approved 2026-06-03)
  - HTML prototype: `docs/superpowers/specs/assets/phase7-approved-design-variant-c.html`
  - Screenshot: `docs/superpowers/specs/assets/phase7-approved-design-variant-c.png`

---

## Data Model

### Fetch query

Load all users with their total badge count in a single query:

```typescript
supabase
  .from('users')
  .select('id, email, display_name, avatar_url, role, is_friend, is_test_user, user_badge_history(count)')
  .order('created_at', { ascending: false })
```

`user_badge_history(count)` uses Supabase's embedded resource count (returns `[{ count: N }]`). 

### `Servant` type

```typescript
interface Servant {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  role: 'normal' | 'manager' | 'godlike'
  is_friend: boolean | null
  is_test_user: boolean
  badge_count: number
}
```

### Avatar fallback

If `avatar_url` is null, render initials:
- Use first letter of first word + first letter of last word from `display_name`
- If `display_name` is null, use first 2 chars of `email`

---

## Component Structure

```
src/sections/UserManagement/
  ManageServants.tsx    ← orchestrator: renders FunctionCard + UserList
  UserList.tsx          ← maps servants → UserRow; shows empty/loading states
  UserRow.tsx           ← avatar, info, controls (role toggle, friend toggle, delete)
  useServants.ts        ← data hook: fetch, optimistic mutations, edge function call
  servantTypes.ts       ← Servant interface
```

### `useServants` hook

```typescript
const {
  servants,
  loading,
  error,
  toggleFriend,     // (userId: string) => Promise<void>
  toggleManager,    // (userId: string) => Promise<void>
  deleteUser,       // (userId: string) => Promise<void>
} = useServants()
```

- Fetches on mount
- Each mutation is **optimistic**: update local state immediately, revert + show error banner on failure
- `deleteUser` removes the row from local state immediately; if Edge Function fails, re-inserts the row and shows an error

---

## Mutations

### Toggle `is_friend`

```typescript
await supabase
  .from('users')
  .update({ is_friend: !currentValue })
  .eq('id', userId)
```

- `null` is treated as `false` for display; toggling from null sets it to `true`
- Requires godlike UPDATE RLS policy on `public.users`. If missing, a new Supabase migration must add it (see implementation notes below).

### Toggle manager role

```typescript
const newRole = servant.role === 'manager' ? 'normal' : 'manager'
await supabase
  .from('users')
  .update({ role: newRole })
  .eq('id', userId)
  .neq('role', 'godlike') // safety guard
```

- Godlike users: the toggle button is hidden entirely in the UI
- `neq('role', 'godlike')` on the update is a server-side safety guard in addition to the UI guard

### Delete user

```typescript
await supabase.functions.invoke('delete-user', {
  body: { userId }
})
```

- Confirmation dialog required before invoking (message: "This will permanently delete [email] and all their data. This cannot be undone.")
- Godlike users: the delete button is hidden entirely in the UI
- Edge Function handles all safety checks (see below)

---

## Edge Function: `delete-user`

**Location:** Supabase Edge Functions (new function, does not currently exist)  
**Runtime:** Deno  
**Auth:** Caller JWT must belong to a godlike user

### Logic

```typescript
// 1. Verify caller is godlike
const callerRole = await getRole(callerUserId, supabaseAdmin)
if (callerRole !== 'godlike') return 403

// 2. Verify target is not godlike
const targetRole = await getRole(targetUserId, supabaseAdmin)
if (targetRole === 'godlike') return 400 { error: 'Cannot delete godlike user' }

// 3. Delete from auth.users (cascades to public.users via FK)
await supabaseAdmin.auth.admin.deleteUser(targetUserId)
return 200
```

### Error responses

| Status | Condition |
|--------|-----------|
| 403 | Caller is not godlike |
| 400 | Target is the godlike user |
| 404 | Target user not found |
| 500 | Supabase admin API error |

### Environment variables needed

- `SUPABASE_SERVICE_ROLE_KEY` — must be set in Supabase project secrets (likely already set for other functions)
- `SUPABASE_URL` — same

---

## RLS Verification Required

The schema doc states "Only the godlike user can UPDATE `public.users`" but the migration does not show an explicit UPDATE policy. During implementation, verify:

1. Run a test UPDATE as the godlike session — if it succeeds, policy exists.
2. If it fails (row-level security violation), add a migration:

```sql
CREATE POLICY "Godlike can update user profiles"
ON public.users
FOR UPDATE
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'godlike'
);
```

This migration is in scope for Phase 7 if needed.

---

## UI Behavior

### Loading state
- Show a spinner or skeleton list while `loading = true`

### Empty state
- Text: "No users found." (should never actually happen in practice)

### Error state
- Show inline error banner with the message

### Per-mutation feedback
- Success: no explicit toast needed (optimistic update is immediate and visible)
- Error: show the existing `useFeedback` error banner with reason, revert state

### Delete confirmation
- Inline two-step: click trash icon → row changes to show "Are you sure? [Cancel] [Delete]"
- Do NOT use `window.confirm()` — inline keeps UX consistent with the rest of the admin app

---

## What is NOT in scope

- Creating new users (deferred)
- Filtering or searching the user list (deferred)
- Editing email or display_name
- Viewing individual user detail beyond the card fields
- Pagination (V2 if user count grows significantly)
