// Shared domain types — all hooks and components import from here,
// not from each other. Dependency arrows all point inward to lib/.

export interface BandOption {
  id: string
  name: string
  pickCount: number
}

export interface Servant {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  role: 'normal' | 'manager' | 'godlike'
  is_friend: boolean | null
  is_test_user: boolean
  is_blocked: boolean
  badge_count: number
  // true = confirmed subscription; false = confirmed none (own user only); null = unknown (RLS)
  has_push: boolean | null
}
