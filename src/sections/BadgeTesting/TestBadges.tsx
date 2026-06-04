import { useState } from 'react'
import { FunctionCard } from '../../components/FunctionCard/FunctionCard'
import { useFeedback } from '../../hooks/useFeedback'
import { supabase } from '../../lib/supabase'
import styles from '../sections.module.css'

// Derives image_path and label_key from a slug per the badge system convention.
// image_path: /badges/badge_{slug}.png
// label_key:  badge{PascalCase(slug)}
function slugToImagePath(slug: string) {
  return `/badges/badge_${slug}.png`
}

function slugToLabelKey(slug: string) {
  const pascal = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
  return `badge${pascal}`
}

interface BadgeEntry {
  slug: string
  label: string
  group: string
}

const BADGES: BadgeEntry[] = [
  // Profile & Social
  { slug: 'puppy',                 label: 'Puppy',                    group: 'Profile & Social' },
  { slug: 'pack-member',           label: 'Pack Member',              group: 'Profile & Social' },
  { slug: 'pais-tropical',         label: 'País Tropical',            group: 'Profile & Social' },
  { slug: 'deutscher',             label: 'Deutscher',                group: 'Profile & Social' },
  { slug: 'america-fuck-yeah',     label: 'America F*** Yeah',        group: 'Profile & Social' },
  { slug: 'belga',                 label: 'Belga',                    group: 'Profile & Social' },
  { slug: 'cafetero',              label: 'Cafetero',                 group: 'Profile & Social' },
  // Wacken Veteran
  { slug: 'og',                    label: 'OG',                       group: 'Wacken Veteran' },
  { slug: 'mud-survivor',          label: 'Mud Survivor',             group: 'Wacken Veteran' },
  { slug: '5-wackens',             label: '5 Wackens',                group: 'Wacken Veteran' },
  { slug: '10-wackens',            label: '10 Wackens',               group: 'Wacken Veteran' },
  // Festival 2026
  { slug: 'early-bird',            label: 'Early Bird',               group: 'Festival 2026' },
  { slug: 'dreamer',               label: 'Dreamer',                  group: 'Festival 2026' },
  { slug: 'death-metal',           label: 'Death Metal',              group: 'Festival 2026' },
  { slug: 'power-metal',           label: 'Power Metal',              group: 'Festival 2026' },
  { slug: 'party-metal',           label: 'Party Metal',              group: 'Festival 2026' },
  { slug: 'denim-and-leather',     label: 'Denim and Leather',        group: 'Festival 2026' },
  { slug: 'kvlt',                  label: 'Kvlt',                     group: 'Festival 2026' },
  { slug: 'wall-of-death',         label: 'Wall of Death',            group: 'Festival 2026' },
  { slug: 'viking-fur',            label: 'Viking Fur',               group: 'Festival 2026' },
  { slug: 'slow-and-low',          label: 'Slow and Low',             group: 'Festival 2026' },
  { slug: 'breakdown-believer',    label: 'Breakdown Believer',       group: 'Festival 2026' },
  { slug: 'dad-rock-respect',      label: 'Dad Rock Respect',         group: 'Festival 2026' },
  { slug: 'pit-pup',               label: 'Pit Pup',                  group: 'Festival 2026' },
  { slug: 'alestorm',              label: 'Alestorm',                 group: 'Festival 2026' },
  { slug: 'roots',                 label: 'Roots',                    group: 'Festival 2026' },
  { slug: 'live-beast',            label: 'Live Beast',               group: 'Festival 2026' },
  { slug: 'wacken-firefighters',   label: 'Wacken Firefighters',      group: 'Festival 2026' },
  { slug: 'gutalax',               label: 'Gutalax',                  group: 'Festival 2026' },
  { slug: 'heavysaurus',           label: 'Heavysaurus',              group: 'Festival 2026' },
  { slug: 'wackinger-regular',     label: 'Wackinger Viking',         group: 'Festival 2026' },
  { slug: 'wasteland-warrior',     label: 'Wasteland Warrior',        group: 'Festival 2026' },
  { slug: 'bullhead-heat',         label: 'Bullhead Heat',            group: 'Festival 2026' },
  { slug: 'witching-hour',         label: 'Witching Hour',            group: 'Festival 2026' },
  { slug: 'vampire',               label: 'Vampire',                  group: 'Festival 2026' },
  { slug: 'small-stage-champion',  label: 'Small Stage Champion',     group: 'Festival 2026' },
  { slug: 'judas-witness',         label: 'Judas Witness',            group: 'Festival 2026' },
  { slug: 'stage-hopper',          label: 'Stage Hopper',             group: 'Festival 2026' },
  { slug: 'octopus',               label: 'Octopus',                  group: 'Festival 2026' },
  // Weak Skip 2026
  { slug: 'weak',                  label: 'Weak',                     group: 'Weak Skip 2026' },
  { slug: 'weakling-supreme',      label: 'Weakling Supreme',         group: 'Weak Skip 2026' },
  // Rating 2026
  { slug: 'zine-pup',              label: 'Zine Pup',                 group: 'Rating 2026' },
  { slug: 'press-pass',            label: 'Press Pass',               group: 'Rating 2026' },
  { slug: 'pitchfork-paw',         label: 'Pitchfork Paw',            group: 'Rating 2026' },
  // Arrival Day 2026
  { slug: 'civil-engineers-of-doom', label: 'Civil Engineers of Doom', group: 'Arrival Day 2026' },
  { slug: 'beerforcement',         label: 'Beerforcement',            group: 'Arrival Day 2026' },
  { slug: 'campfire-veteran',      label: 'Campfire Veteran',         group: 'Arrival Day 2026' },
  { slug: 'spawn-point-infield',   label: 'Spawn Point Infield',      group: 'Arrival Day 2026' },
  // Merit / Assigned
  { slug: 'mosh-pit',              label: 'Mosh Pit',                 group: 'Merit / Assigned' },
  { slug: 'crowdsurfer',           label: 'Crowdsurfer',              group: 'Merit / Assigned' },
  { slug: 'girl-power',            label: 'Girl Power',               group: 'Merit / Assigned' },
  { slug: 'nutella',               label: 'Nutella',                  group: 'Merit / Assigned' },
  { slug: 'bbq-king-2026',         label: 'BBQ King 2026',            group: 'Merit / Assigned' },
  { slug: 'jagger-king',           label: 'Jagger King',              group: 'Merit / Assigned' },
  { slug: 'total-kaput-2026',      label: 'Total Kaput 2026',         group: 'Merit / Assigned' },
  { slug: 'melon',                 label: 'Melon',                    group: 'Merit / Assigned' },
  { slug: 'medic',                 label: 'Medic',                    group: 'Merit / Assigned' },
  { slug: 'smoke-signals',         label: 'Smoke Signals',            group: 'Merit / Assigned' },
  { slug: 'space-brownie',         label: 'Space Brownie',            group: 'Merit / Assigned' },
  { slug: 'beer-master',           label: 'Beer Master',              group: 'Merit / Assigned' },
  { slug: 'beer-hater',            label: 'Beer Hater',               group: 'Merit / Assigned' },
  { slug: 'code-wizards',          label: 'Code Wizards',             group: 'Merit / Assigned' },
  { slug: 'sun-sacrifice',         label: 'Sun Sacrifice',            group: 'Merit / Assigned' },
  { slug: 'tactical-nap',          label: 'Tactical Nap',             group: 'Merit / Assigned' },
  { slug: 'patient-zero',          label: 'Patient Zero',             group: 'Merit / Assigned' },
  { slug: 'alemao-mode',           label: 'Alemão Mode',              group: 'Merit / Assigned' },
  // Location Presence
  { slug: 'metal-place-2026',      label: 'Metal Place 2026',         group: 'Location Presence' },
  { slug: 'bbq-crew',              label: 'BBQ Crew',                 group: 'Location Presence' },
  { slug: 'lost-together',         label: 'Lost Together',            group: 'Location Presence' },
  { slug: 'full-pack',             label: 'Full Pack',                group: 'Location Presence' },
  { slug: 'mass-lost',             label: 'Mass Lost',                group: 'Location Presence' },
]

const GROUPS = [...new Set(BADGES.map(b => b.group))]

const CURRENT_YEAR = 2026

export function TestBadges() {
  const { feedback, show } = useFeedback()
  const [selectedSlug, setSelectedSlug] = useState<string>('')
  const [year, setYear] = useState<string>(String(CURRENT_YEAR))
  const [loading, setLoading] = useState(false)

  async function handleAdd() {
    if (!selectedSlug) return
    setLoading(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      show('error', 'No active session')
      setLoading(false)
      return
    }

    const festivalYear = Number(year) || CURRENT_YEAR
    const slug = selectedSlug
    const imagePath = slugToImagePath(slug)
    const labelKey = slugToLabelKey(slug)

    const { error } = await supabase
      .from('user_badge_history')
      .insert({
        user_id: session.user.id,
        festival_year: festivalYear,
        slug,
        image_path: imagePath,
        label_key: labelKey,
        consolidated_at: new Date().toISOString(),
      })

    setLoading(false)

    if (error) {
      show('error', `Failed — ${error.message}`)
    } else {
      const badge = BADGES.find(b => b.slug === slug)
      show('success', `Badge "${badge?.label ?? slug}" added for ${festivalYear}.`)
    }
  }

  return (
    <FunctionCard
      id="D-01"
      title="Test Badges"
      description="Insert a badge into your history to test the archive display."
      status={loading ? 'loading' : selectedSlug ? 'active' : 'ready'}
    >
      <div className={styles.inputRow}>
        <select
          value={selectedSlug}
          onChange={e => setSelectedSlug(e.target.value)}
          disabled={loading}
          style={{
            flex: 1,
            background: 'var(--ink-soft)',
            border: '1px solid var(--rule-slate)',
            color: selectedSlug ? 'var(--bone)' : 'var(--bone-dim)',
            fontFamily: 'var(--f-mono)',
            fontSize: 11,
            letterSpacing: '0.04em',
            padding: '6px 10px',
            cursor: 'pointer',
          }}
        >
          <option value="">— Select badge —</option>
          {GROUPS.map(group => (
            <optgroup key={group} label={group}>
              {BADGES.filter(b => b.group === group).map(b => (
                <option key={b.slug} value={b.slug}>{b.label}</option>
              ))}
            </optgroup>
          ))}
        </select>

        <input
          type="number"
          value={year}
          onChange={e => setYear(e.target.value)}
          min={2022}
          max={2030}
          disabled={loading}
          style={{
            width: 72,
            background: 'var(--ink-soft)',
            border: '1px solid var(--rule-slate)',
            color: 'var(--bone)',
            fontFamily: 'var(--f-mono)',
            fontSize: 11,
            padding: '6px 8px',
            textAlign: 'center',
          }}
        />
      </div>

      {selectedSlug && (
        <p className={styles.metaLabel}>
          slug: {selectedSlug} · image_path: {slugToImagePath(selectedSlug)} · label_key: {slugToLabelKey(selectedSlug)}
        </p>
      )}

      {feedback && (
        <p className={feedback.type === 'success' ? styles.feedbackOk : styles.feedbackErr}>
          {feedback.message}
        </p>
      )}

      <button
        className="btn-primary"
        onClick={handleAdd}
        disabled={!selectedSlug || loading}
      >
        {loading ? 'Adding…' : 'Add Badge →'}
      </button>
    </FunctionCard>
  )
}
