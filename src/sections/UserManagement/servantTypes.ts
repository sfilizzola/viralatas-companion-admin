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
}
