# Wacken Open Air 2026 — Stage Reference

## Purpose

Document the 8 Wacken 2026 stages: their identities, physical layout, categories, color codes, slot schedules, and pairing rules. This file is the authoritative reference for **when** a slot happens. For **which band** is in each slot, see [lineup.md](lineup.md).

---

## Relevant Source Files

- `src/pages/SchedulePage.tsx` — Stage color constants (CSS variable mapping)
- `src/services/stageColors.ts` — `getStageColor(stage)` function returning CSS variable strings
- `supabase/seed/bands.ts` — Seed script; uses `STAGES` constants and date variables
- `src/types/index.ts` — `Band` type (has `stage: string` field)

---

## The 8 Stages

|Rank| Stage | Abbrev | Category | UI Color | Hex |
|---|-------|--------|----------|----------|-----|
|1| Faster | `FAS` | Main Infield | `var(--stage-faster)` | `#2980b9` (Blue) |
|2| Harder | `HAR` | Main Infield | `var(--stage-harder)` | `#e67e22` (Orange) |
|3| Louder | `LOU` | Main Infield | `var(--stage-louder)` | `#8e44ad` (Purple) |
|4| W.E.T. | `WET` | Outside Infield | `var(--stage-wet)` | `#c0392b` (Red) |
|5| Headbangers | `HBA` | Outside Infield | `var(--stage-headbangers)` | `#16a085` (Teal) |
|7| Wasteland | `WAS` | Specialized | `var(--stage-wasteland)` | `#2c3e50` (Dark Blue) |
|6| Wackinger | `WAK` | Specialized | `var(--stage-wackinger)` | `#95a5a6` (Gray) |
|8| Welcome to the Jungle | `JUN` | Specialized | `var(--stage-jungle)` | `#f39c12` (Gold) |

Stage colors are defined in `src/index.css` as CSS custom properties. `stageColors.ts` returns the CSS variable token (e.g., `var(--stage-faster)`), not the raw hex. Unknown stages fall back to `var(--accent)`.

---

## Stage Pairing Rule

> **HARDER and FASTER** are physically adjacent infield stages. Their slots interleave with ~15 min gaps — if Faster ends at 12:45, Harder likely starts at 13:00, and vice versa.
>
> **W.E.T. and HEADBANGERS** follow the same rule — adjacent outside-infield stages with ~15 min interleaving gaps between end and start times.
>
> This means: a band finishing on stage 1 at HH:45 is a reliable signal that stage 2 will start at HH+1:00, and vice versa. Useful for conflict resolution and "which stage next?" planning.

---

## Reference Keys

### Stage Abbreviations

| Abbrev | Full Name | Pairing |
|--------|-----------|---------|
| `HAR` | Harder | Paired with FASTER (adjacent) |
| `FAS` | Faster | Paired with HARDER (adjacent) |
| `LOU` | Louder | — |
| `WET` | W.E.T. | Paired with HEADBANGERS (adjacent) |
| `HBA` | Headbangers | Paired with W.E.T. (adjacent) |
| `WAS` | Wasteland | — |
| `WAK` | Wackinger | — |
| `JUN` | Welcome to the Jungle | — |

### Day Codes

| Code | Calendar Date | Day of Week |
|------|--------------|-------------|
| `D1` | 2026-07-29 | Wednesday |
| `D2` | 2026-07-30 | Thursday |
| `D3` | 2026-07-31 | Friday |
| `D4` | 2026-08-01 | Saturday |

After-midnight slots (shows crossing midnight) use the **next** calendar date in `bands.ts`:

| Overnight Code | Calendar Date |
|---------------|--------------|
| `D1n` | 2026-07-30 |
| `D2n` | 2026-07-31 |
| `D3n` | 2026-08-01 |
| `D4n` | 2026-08-02 |

Times are **CEST (UTC+2)**. Slots marked `*` cross midnight into the next calendar date.

In `bands.ts`, the `end_time` (and `start_time` for 00:xx slots) uses the **next** day's date variable (e.g. `D1n`, `D2n`, `D3n`, `D4n`).

### Slot Confirmation Status

- **`YES`** = Official Wacken running order published for this slot (time is confirmed)
- **`NO`** = Approximate time, pending official confirmation

---

## Slot ID Scheme

Each slot has a unique ID combining stage abbreviation + sequential number, **global across all days**.

- Numbering starts at 1 per stage and increments through Day 1 → Day 4 in chronological order
- Example: `FAS1` = first Faster slot (Day 1, 16:00), `FAS17` = last Faster slot (Day 4, 01:00*)
- Use the Slot ID to cross-reference between this Stage Schedules grid and the Band Assignments tables in [lineup.md](lineup.md)

| Stage | Slot range |
|-------|-----------|
| HAR | HAR1 – HAR14 |
| FAS | FAS1 – FAS17 |
| LOU | LOU1 – LOU27 |
| WET | WET1 – WET36 |
| HBA | HBA1 – HBA36 |
| WAS | WAS1 – WAS32 |
| WAK | WAK1 – WAK29 |
| JUN | JUN1 – JUN8 |

---

## How Stages Link to Bands

Each `Band` record has a `stage: string` field that holds the full stage name (e.g., `"Faster"`, `"W.E.T."`). The `start_time` and `end_time` ISO timestamps encode both the day and the time. There is no separate "Stage" entity in the database — stage is a string attribute on `Band`.

```typescript
type Band = {
  id: string;
  name: string;
  stage: string;        // "Faster" | "Harder" | "Louder" | "W.E.T." | "Headbangers" | "Wasteland" | "Wackinger" | "Welcome to the Jungle"
  start_time: string;   // ISO 8601, e.g., "2026-07-29T18:30:00+02:00" — encodes the festival day
  end_time: string;     // ISO 8601
  image_url: string | null;
  genre: string | null;
};
```

The `supabase/seed/bands.ts` script maps this file's slot grid to band records:

| This file | `bands.ts` field | Notes |
|-----------|-----------------|-------|
| Stage heading (`### HARDER`) | `stage: STAGES.HARDER` | Use the constant from the `STAGES` object |
| Day heading (`## Day 1`) | `start_time: new Date(\`${D1}T15:30:00\`)` | `D1`/`D2`/`D3`/`D4` date variables |
| After-midnight slot (`*`) | Uses `D1n`, `D2n`, `D3n`, or `D4n` | Next calendar date strings |
| Slot ID (e.g. `HAR3`) | No direct field — cross-reference only | Match by stage + time |

---

## Stage Schedules

> Slot times are approximate until `Confirmed = YES`. All times are CEST (UTC+2).
> Each row here corresponds to one band row in [lineup.md](lineup.md) Band Assignments via the Slot ID.

---

### HARDER

> **Closed on Day 1 (Wednesday).** Paired with FASTER — slots interleave with ~15 min gap.

#### Day 1 (Wednesday)

*Closed — HARDER opens Thursday.*

#### Day 2 (Thursday)

| Slot ID | Start | End | Confirmed |
|---------|-------|-----|-----------|
| HAR1 | 16:15 | 17:15 | YES |
| HAR2 | 19:00 | 20:15 | YES |
| HAR3 | 22:15 | 00:00* | YES |


#### Day 3 (Friday)

| Slot ID | Start | End | Confirmed |
|---------|-------|-----|-----------|
| HAR4 | 13:30 | 14:15 | YES |
| HAR5 | 15:45 | 16:45 | YES |
| HAR6 | 18:15 | 19:30 | YES |
| HAR7 | 21:30 | 23:00 | YES |
| HAR8 | 01:00* | 02:15* | YES |

#### Day 4 (Saturday)

| Slot ID | Start | End | Confirmed |
|---------|-------|-----|-----------|
| HAR9 | 11:30 | 12:15 | YES |
| HAR10 | 13:45 | 14:45 | YES |
| HAR11 | 16:15 | 17:15 | YES |
| HAR12 | 19:00 | 20:30 | YES |
| HAR13 | 22:30 | 23:00 | YES |
| HAR14 | 23:00 | 00:45* | YES |

---

### FASTER

> Paired with HARDER — slots interleave with ~15 min gap.

#### Day 1 (Wednesday)

| Slot ID | Start | End | Confirmed |
|---------|-------|-----|-----------|
| FAS1 | 16:00 | 17:00 | YES |
| FAS2 | 18:00 | 19:00 | YES |
| FAS3 | 20:00 | 21:00 | YES |
| FAS4 | 22:00 | 00:00* | YES |

#### Day 2 (Thursday)

| Slot ID | Start | End | Confirmed |
|---------|-------|-----|-----------|
| FAS5 | 15:00 | 16:00 | YES |
| FAS6 | 17:30 | 18:45 | YES |
| FAS7 | 20:30 | 22:00 | YES |


#### Day 3 (Friday)

| Slot ID | Start | End | Confirmed |
|---------|-------|-----|-----------|
| FAS8 | 12:30 | 13:30 | YES |
| FAS9 | 14:30 | 15:30 | YES |
| FAS10 | 17:00 | 18:00 | YES |
| FAS11 | 19:45 | 21:15 | YES |
| FAS12 | 23:15 | 00:45* | YES |


#### Day 4 (Saturday)

| Slot ID | Start | End | Confirmed |
|---------|-------|-----|-----------|
| FAS13 | 12:30 | 13:30 | YES |
| FAS14 | 15:00 | 16:00 | YES |
| FAS15 | 17:30 | 18:45 | YES |
| FAS16 | 20:45 | 22:30 | YES |
| FAS17 | 01:00* | 02:00* | YES |

---

### LOUDER

#### Day 1 (Wednesday)

| Slot ID | Start | End | Confirmed |
|---------|-------|-----|-----------|
| LOU1 | 12:00 | 12:45 | YES |
| LOU2 | 13:30 | 14:30 | YES |
| LOU3 | 15:15 | 16:15 | YES |
| LOU4 | 17:00 | 18:00 | YES |
| LOU5 | 18:45 | 20:00 | YES |
| LOU6 | 21:00 | 22:30 | YES |

#### Day 2 (Thursday)

| Slot ID | Start | End | Confirmed |
|---------|-------|-----|-----------|
| LOU7 | 12:00 | 13:00 | YES |
| LOU8 | 13:45 | 14:45 | YES |
| LOU9 | 15:30 | 16:30 | YES |
| LOU10 | 17:30 | 18:45 | YES |
| LOU11 | 19:45 | 21:00 | YES |
| LOU12 | 22:00 | 22:30 | YES |

#### Day 3 (Friday)

| Slot ID | Start | End | Confirmed |
|---------|-------|-----|-----------|
| LOU13 | 12:00 | 13:00 | YES |
| LOU14 | 13:45 | 14:45 | YES |
| LOU15 | 15:30 | 16:30 | YES |
| LOU16 | 17:15 | 18:15 | YES |
| LOU17 | 19:00 | 20:00 | YES |
| LOU18 | 20:45 | 22:00 | YES |
| LOU19 | 22:45 | 00:00* | YES |
| LOU20 | 00:45* | 02:00* | YES |

#### Day 4 (Saturday)

| Slot ID | Start | End | Confirmed |
|---------|-------|-----|-----------|
| LOU21 | 12:00 | 13:00 | YES |
| LOU22 | 13:45 | 14:45 | YES |
| LOU23 | 15:30 | 16:30 | YES |
| LOU24 | 17:15 | 18:15 | YES |
| LOU25 | 19:00 | 20:00 | YES |
| LOU26 | 20:45 | 21:45 | YES |
| LOU27 | 22:45 | 00:00* | YES |

---

### W.E.T.

> Paired with HEADBANGERS — slots interleave with ~15 min gap.

#### Day 1 (Wednesday)

| Slot ID | Start | End | Confirmed |
|---------|-------|-----|-----------|
| WET1 | 11:00 | 11:20 | YES |
| WET2 | 11:50 | 12:10 | YES |
| WET3 | 12:40 | 13:00 | YES |
| WET4 | 13:30 | 13:50 | YES |
| WET5 | 14:20 | 14:40 | YES |
| WET6 | 15:50 | 16:10 | YES |
| WET7 | 16:40 | 17:00 | YES |
| WET8 | 17:30 | 17:50 | YES |
| WET9 | 18:20 | 18:40 | YES |
| WET10 | 19:10 | 19:30 | YES |
| WET11 | 20:15 | 21:00 | YES |
| WET12 | 22:45 | 00:00* | YES |

#### Day 2 (Thursday)

| Slot ID | Start | End | Confirmed |
|---------|-------|-----|-----------|
| WET13 | 11:00 | 11:20 | YES |
| WET14 | 11:50 | 12:10 | YES |
| WET15 | 12:40 | 13:00 | YES |
| WET16 | 13:30 | 13:50 | YES |
| WET17 | 14:20 | 14:40 | YES |
| WET18 | 15:10 | 15:30 | YES |
| WET19 | 16:15 | 17:00 | YES |
| WET20 | 18:15 | 19:00 | YES |
| WET21 | 20:30 | 21:30 | YES |
| WET22 | 23:00 | 00:00* | YES |

#### Day 3 (Friday)

| Slot ID | Start | End | Confirmed |
|---------|-------|-----|-----------|
| WET23 | 11:00 | 11:45 | YES |
| WET24 | 13:00 | 13:45 | YES |
| WET25 | 15:00 | 15:45 | YES |
| WET26 | 17:00 | 17:45 | YES |
| WET27 | 19:00 | 19:45 | YES |
| WET28 | 21:15 | 22:15 | YES |
| WET29 | 23:45 | 00:45* | YES |

#### Day 4 (Saturday)

| Slot ID | Start | End | Confirmed |
|---------|-------|-----|-----------|
| WET30 | 11:00 | 11:55 | YES |
| WET31 | 13:00 | 13:45 | YES |
| WET32 | 15:00 | 15:45 | YES |
| WET33 | 17:00 | 17:45 | YES |
| WET34 | 19:00 | 19:45 | YES |
| WET35 | 21:15 | 22:15 | YES |
| WET36 | 23:45 | 00:45* | YES |

---

### HEADBANGERS

> Paired with W.E.T. — slots interleave with ~15 min gap.

#### Day 1 (Wednesday)

| Slot ID | Start | End | Confirmed |
|---------|-------|-----|-----------|
| HBA1 | 11:25 | 11:45 | YES |
| HBA2 | 12:15 | 12:35 | YES |
| HBA3 | 13:05 | 13:25 | YES |
| HBA4 | 13:55 | 14:15 | YES |
| HBA5 | 14:45 | 15:45 | YES |
| HBA6 | 16:15 | 16:35 | YES |
| HBA7 | 17:05 | 17:25 | YES |
| HBA8 | 17:55 | 18:15 | YES |
| HBA9 | 18:45 | 19:05 | YES |
| HBA10 | 19:35 | 19:55 | YES |
| HBA11 | 21:15 | 22:30 | YES |
| HBA12 | 00:15* | 01:00* | YES |

#### Day 2 (Thursday)

| Slot ID | Start | End | Confirmed |
|---------|-------|-----|-----------|
| HBA13 | 11:25 | 11:45 | YES |
| HBA14 | 12:15 | 12:35 | YES |
| HBA15 | 13:05 | 13:25 | YES |
| HBA16 | 13:55 | 14:15 | YES |
| HBA17 | 14:45 | 15:05 | YES |
| HBA18 | 15:35 | 15:55 | YES |
| HBA19 | 17:15 | 18:00 | YES |
| HBA20 | 19:15 | 20:15 | YES |
| HBA21 | 21:45 | 22:45 | YES |
| HBA22 | 00:00* | 03:00* | YES |

#### Day 3 (Friday)

| Slot ID | Start | End | Confirmed |
|---------|-------|-----|-----------|
| HBA23 | 12:00 | 12:45 | YES |
| HBA24 | 14:00 | 14:45 | YES |
| HBA25 | 16:00 | 16:45 | YES |
| HBA26 | 18:00 | 18:45 | YES |
| HBA27 | 20:00 | 21:00 | YES |
| HBA28 | 22:30 | 23:30 | YES |
| HBA29 | 01:00* | 02:00* | YES |

#### Day 4 (Saturday)

| Slot ID | Start | End | Confirmed |
|---------|-------|-----|-----------|
| HBA30 | 12:00 | 12:45 | YES |
| HBA31 | 14:00 | 14:45 | YES |
| HBA32 | 16:00 | 16:45 | YES |
| HBA33 | 18:00 | 18:45 | YES |
| HBA34 | 20:00 | 21:00 | YES |
| HBA35 | 22:30 | 23:30 | YES |
| HBA36 | 01:00* | 02:00* | YES |

---

### WASTELAND

#### Day 1 (Wednesday)

| Slot ID | Start | End | Confirmed |
|---------|-------|-----|-----------|
| WAS1 | 14:00 | 14:45 | YES |
| WAS2 | 15:30 | 16:15 | YES |
| WAS3 | 17:00 | 17:45 | YES |
| WAS4 | 18:30 | 19:15 | YES |
| WAS5 | 20:00 | 20:45 | YES |
| WAS6 | 21:30 | 22:15 | YES |
| WAS7 | 23:00 | 00:00* | YES |

#### Day 2 (Thursday)

| Slot ID | Start | End | Confirmed |
|---------|-------|-----|-----------|
| WAS8 | 14:00 | 14:30 | YES |
| WAS9 | 15:00 | 15:30 | YES |
| WAS10 | 16:00 | 16:45 | YES |
| WAS11 | 17:15 | 18:00 | YES |
| WAS12 | 18:30 | 19:15 | YES |
| WAS13 | 19:45 | 20:45 | YES |
| WAS14 | 21:15 | 22:15 | YES |
| WAS15 | 23:00 | 00:00* | YES |

#### Day 3 (Friday)

| Slot ID | Start | End | Confirmed |
|---------|-------|-----|-----------|
| WAS16 | 14:00 | 14:30 | YES |
| WAS17 | 15:00 | 15:30 | YES |
| WAS18 | 16:00 | 16:45 | YES |
| WAS19 | 17:15 | 18:00 | YES |
| WAS20 | 18:30 | 19:15 | YES |
| WAS21 | 19:45 | 20:45 | YES |
| WAS22 | 21:15 | 22:15 | YES |
| WAS23 | 23:00 | 00:00* | YES |

#### Day 4 (Saturday)

| Slot ID | Start | End | Confirmed |
|---------|-------|-----|-----------|
| WAS24 | 14:00 | 14:30 | YES |
| WAS25 | 15:00 | 15:30 | YES |
| WAS26 | 16:00 | 16:45 | YES |
| WAS27 | 17:15 | 18:00 | YES |
| WAS28 | 18:30 | 19:15 | YES |
| WAS29 | 19:45 | 20:45 | YES |
| WAS30 | 21:15 | 22:15 | YES |
| WAS31 | 23:00 | 00:00* | YES |
| WAS32 | 00:30* | 01:11* | YES |

---

### WACKINGER

#### Day 1 (Wednesday)

| Slot ID | Start | End | Confirmed |
|---------|-------|-----|-----------|
| WAK1 | 12:00 | 12:45 | YES |
| WAK2 | 13:30 | 14:15 | YES |
| WAK3 | 15:00 | 16:00 | YES |
| WAK4 | 16:45 | 17:45 | YES |
| WAK5 | 18:30 | 19:30 | YES |
| WAK6 | 20:15 | 21:15 | YES |
| WAK7 | 22:15 | 23:15 | YES |

#### Day 2 (Thursday)

| Slot ID | Start | End | Confirmed |
|---------|-------|-----|-----------|
| WAK8 | 12:00 | 12:45 | YES |
| WAK9 | 13:30 | 14:15 | YES |
| WAK10 | 15:00 | 16:00 | YES |
| WAK11 | 16:45 | 17:45 | YES |
| WAK12 | 18:30 | 19:30 | YES |
| WAK13 | 20:15 | 21:15 | YES |
| WAK14 | 22:15 | 23:15 | YES |

#### Day 3 (Friday)

| Slot ID | Start | End | Confirmed |
|---------|-------|-----|-----------|
| WAK15 | 12:00 | 12:45 | YES |
| WAK16 | 13:15 | 13:45 | YES |
| WAK17 | 14:15 | 15:00 | YES |
| WAK18 | 15:30 | 16:15 | YES |
| WAK19 | 17:00 | 18:00 | YES |
| WAK20 | 18:45 | 19:45 | YES |
| WAK21 | 20:30 | 21:30 | YES |
| WAK22 | 22:15 | 23:15 | YES |

#### Day 4 (Saturday)

| Slot ID | Start | End | Confirmed |
|---------|-------|-----|-----------|
| WAK23 | 12:00 | 12:45 | YES |
| WAK24 | 13:30 | 14:15 | YES |
| WAK25 | 15:00 | 16:00 | YES |
| WAK26 | 16:45 | 17:45 | YES |
| WAK27 | 18:30 | 19:30 | YES |
| WAK28 | 20:15 | 21:15 | YES |
| WAK29 | 22:15 | 23:15 | YES |

---

### WELCOME TO THE JUNGLE

#### Day 1 (Wednesday)

| Slot ID | Start | End | Confirmed |
|---------|-------|-----|-----------|
| JUN1 | 19:30 | 20:30 | NO |
| JUN2 | 21:00 | 21:30 | NO |

#### Day 2 (Thursday)

| Slot ID | Start | End | Confirmed |
|---------|-------|-----|-----------|
| JUN3 | 19:30 | 20:30 | NO |
| JUN4 | 21:00 | 21:30 | NO |


#### Day 3 (Friday)

| Slot ID | Start | End | Confirmed |
|---------|-------|-----|-----------|
| JUN5 | 21:00 | 21:30 | NO |

#### Day 4 (Saturday)

| Slot ID | Start | End | Confirmed |
|---------|-------|-----|-----------|
| JUN6 | 18:00 | 19:00 | NO |
| JUN7 | 19:30 | 20:30 | NO |
| JUN8 | 21:00 | 21:30 | NO |

---

## How to Confirm a Slot's Official Time

When Wacken publishes the official running order for a stage:

1. Update the `Start` and `End` columns for the affected slots to match the official times
2. Change `Confirmed` from `NO` to `YES` for those slots
3. Update the matching `start_time` / `end_time` values in `supabase/seed/bands.ts`
4. Run `npm run seed:bands`

---

## How to Add a New Slot

When a new band is announced that doesn't fit an existing slot:

1. Add a new row to the appropriate Stage Schedules day table with the next available Slot ID for that stage
2. Update the Slot ID range table above
3. Add the corresponding band row to [lineup.md](lineup.md) Band Assignments for that day + stage, referencing the new Slot ID
4. Add the band to `supabase/seed/bands.ts` and run `npm run seed:bands`

---

**Last updated:** 2026-05-20
