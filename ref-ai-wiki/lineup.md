# Wacken Open Air 2026 — Band Lineup Reference

> **This file is the human-editable source of truth for band assignments.**
> For stage schedules (slot times, stage colors, day codes, pairing rules), see [stages.md](stages.md).
>
> To update the lineup:
> 1. Edit this file
> 2. Apply changes to `supabase/seed/bands.ts`
> 3. Run `npm run seed:bands:sync` (dry-run), then `npm run seed:bands:sync -- --apply`
>
> Use destructive `npm run seed:bands` only for festival reset / full rebuild — see [lineup-sync.md](lineup-sync.md).

**Summary:** 155 bands CONFIRMED · 12 `TDB MTB` Metal Battle placeholders · 19 named TDB (known name, image pending) · 12 TBD (dropped, Name=TBD) · 199 total · 1 ceremony (Farewell & Announcements, HAR13)

**Genres:** 13 canonical labels after Phase 25 collapse — **[old → new mapping table](genre-collapse-mapping.md)** · [domain-model](domain-model.md#band) · [ADR](decisions/genre-collapse-canonical-labels.md). Unknown/TBD tags in this file seed as `Metal`.

---

## Stable Identity (`slot_id`)

Each row in `public.bands` carries a `slot_id` (e.g. `FAS1`, `WET12`, `HAR13`). This is the canonical, stable identity of a festival slot — it survives edits to `name`, `start_time`, `image_url`, `genre`, etc., so user picks stay attached across small lineup changes.

Every row in `supabase/seed/bands.ts` declares `slot_id` explicitly (formerly end-of-line comments). For everyday edits, use [lineup-sync.md](lineup-sync.md) (`npm run seed:bands:sync`). Destructive `npm run seed:bands` is reserved for festival reset and catastrophic refresh.

---

## Reference Keys

### Stage Abbreviations

See [stages.md](stages.md) for full stage reference (colors, categories, pairing rules, physical layout). Quick abbreviation lookup:

| Abbrev | Full Name             |
| ------ | --------------------- |
| `HAR`  | Harder                |
| `FAS`  | Faster                |
| `LOU`  | Louder                |
| `WET`  | W.E.T.                |
| `HBA`  | Headbangers           |
| `WAS`  | Wasteland             |
| `WAK`  | Wackinger             |
| `JUN`  | Welcome to the Jungle |

### Slot ID

Each slot has a unique ID (e.g. `FAS1`, `HAR7`). Use it to look up the **time** for that slot in [stages.md](stages.md#stage-schedules). Slot IDs link this file to the stage schedule grid.

### Band Status

- **`CONFIRMED`** = Band has a real image URL from wacken.com
- **`TBD`** = Placeholder — no confirmed band yet (non-Metal-Battle slot)
- **`TDB MTB`** = Metal Battle slot whose representative band has not yet been announced. Once announced, the row should be updated to `CONFIRMED` with the band name and image URL from wacken.com.

---

## Band Assignments

> Stage order within each day: Harder · Faster · Louder · W.E.T. · Headbangers · Wasteland · Wackinger · Welcome to the Jungle
>
> For slot start/end times, look up the Slot ID in [stages.md](stages.md#stage-schedules).

---

## Day 1 — Wednesday, 29 July 2026

> **Note:** Harder stage is closed on Day 1. Faster starts at 16:00 (Doors: 15:30). Louder, W.E.T., Headbangers, Wasteland, and Wackinger stages open from 10:30 / 11:00. Welcome to the Jungle has not been added to the official running order.
>
> **Source:** Band placements below mirror the official Wacken 2026 running order (https://www.wacken.com/en/line-up/running-order-music/) as of 2026-05-20.

### Harder Stage

*Closed — opens Thursday.*

### Faster Stage

| Name | Genre | Slot | Band Status | Image URL |
| ------ | ------ | ------ | ------------- | ----------- |
| Lovebites | Heavy Metal | FAS1 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/8/d/csm_lovebites_26b_38ca926080.jpg |
| The Butcher Sisters | Metal | FAS2 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/7/a/csm_the_butcher_sisters26_63acf7d891.jpg |
| Electric Bassboy | Metal | FAS3 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/2/3/csm_electric_bassboy26_c1af9b52ad.jpg |
| Hämatom | Metal | FAS4 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/5/e/csm_haematom_26_a104ede3d5.jpg |

### Louder Stage

| Name | Genre | Slot | Band Status | Image URL |
| ------ | ------ | ------ | ------------- | ----------- |
| Broken By The Scream | Metal | LOU1 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/6/5/csm_Broken_By_The_Scream-WOA26_8ad83f8245.jpg |
| Visions of Atlantis | Power Metal | LOU2 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/1/6/csm_visions_of_atlantis_26_2bfe817394.jpg |
| Thundermother | Hard Rock | LOU3 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/9/a/csm_Thundermother-Band-2023_d61771d790.jpg |
| The Hardkiss | Hard Rock | LOU4 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/9/8/csm_The_Hardkiss-WOA26_2db7165b54.jpg |
| The Gathering | Doom Metal | LOU5 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/0/2/csm_The_Gathering-WOA26_57ded7843d.jpg |
| Lacuna Coil | Doom Metal | LOU6 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/6/3/csm_lacuna_coil_26_289f52868d.jpg |

### W.E.T. Stage

| Name | Genre | Slot | Band Status | Image URL |
| ------ | ------ | ------ | ------------- | ----------- |
| TDB MTB | Metal Battle | WET1 | TDB MTB | PLACEHOLDER |
| Speak in Whispers | Metal Battle | WET2 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/9/9/csm_speak_in_whispers_26_157b14e684.jpg |
| I See Red | Metal Battle | WET3 | TDB | PLACEHOLDER |
| Goodnight Greatness | Metal Battle | WET4 | TDB | PLACEHOLDER |
| The Crescent's Call | Metal Battle | WET5 | TDB | PLACEHOLDER |
| Ashed Winter | Metal Battle | WET6 | TDB | PLACEHOLDER |
| Blanket Hill | Metal Battle | WET7 | TDB | PLACEHOLDER |
| TDB MTB | Metal Battle | WET8 | TDB MTB | PLACEHOLDER |
| Elchivo | Metal Battle | WET9 | TDB | PLACEHOLDER |
| Morphide | Metal Battle | WET10 | TDB | PLACEHOLDER |
| Velvet Rush | Hard Rock | WET11 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/c/c/csm_velvet_rush_26_79ee43e0e7.jpg |
| Rose Tattoo | Hard Rock | WET12 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/5/5/csm_rose_tattoo26_a5747c907d.jpg |

### Headbangers Stage

| Name | Genre | Slot | Band Status | Image URL |
| ------ | ------ | ------ | ------------- | ----------- |
| TDB MTB | Metal Battle | HBA1 | TDB MTB | PLACEHOLDER |
| BornBroken | Metal Battle | HBA2 | TDB | PLACEHOLDER |
| TDB MTB | Metal Battle | HBA3 | TDB MTB | PLACEHOLDER |
| TDB MTB | Metal Battle | HBA4 | TDB MTB | PLACEHOLDER |
| Expellow | Metal | HBA5 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/b/b/csm_expellow_26b_f274263240.jpg |
| Sinamort | Metal Battle | HBA6 | TDB | PLACEHOLDER |
| Deflag | Metal Battle | HBA7 | TDB | PLACEHOLDER |
| TDB MTB | Metal Battle | HBA8 | TDB MTB | PLACEHOLDER |
| TDB MTB | Metal Battle | HBA9 | TDB MTB | PLACEHOLDER |
| Sót | Metal Battle | HBA10 | TDB | PLACEHOLDER |
| Kadavar | Doom Metal | HBA11 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/f/9/csm_kadavar_26b_5241b42bda.jpg |
| Mambo Kurt | Metal | HBA12 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/f/4/csm_mambo_kurt_25_d25410db45.jpg |

### Wasteland Stage

| Name | Genre | Slot | Band Status | Image URL |
| ------ | ------ | ------ | ------------- | ----------- |
| Diabolisches Werk | Metal | WAS1 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/8/3/csm_diabolisches_werk_26_584e2240f9.jpg |
| Battlecreek | Metal | WAS2 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/5/e/csm_Battlecreek-WOA26_ebdf45051d.jpg |
| Poison The Preacher | Metal | WAS3 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/5/c/csm_poison_the_preacher_26_719f682a4a.jpg |
| Phantom | Heavy Metal | WAS4 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/c/7/csm_phantom_26_2946b95d36.jpg |
| Crypt Sermon | Doom Metal | WAS5 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/4/4/csm_crypt_sermon_26_25a80f0eed.jpg |
| The Troops Of Doom | Thrash Metal | WAS6 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/6/6/csm_troops_of_doom26_13f1c1c107.jpg |
| Sacred Steel | Power Metal | WAS7 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/d/0/csm_sacred_steel_26_78f1daf932.jpg |

### Wackinger Stage

| Name | Genre | Slot | Band Status | Image URL |
| ------ | ------ | ------ | ------------- | ----------- |
| Wacken Firefighters | Metal | WAK1 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/0/6/csm_wacken_firefighters_25_5f6d39317e.jpg |
| Alien Rockin Explosion | Hard Rock | WAK2 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/a/4/csm_alien_rockin_explosion_26_dba5a44bfe.jpg |
| 5th Avenue | Metal | WAK3 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/5/f/csm_5th_Avenue25_9d44c97386.jpg |
| Ricky Warwick | Hard Rock | WAK4 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/9/d/csm_ricky_warwick26c_9f35eea5b5.jpg |
| Vanir | Black Metal | WAK5 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/0/f/csm_vanir_26_4989af5ab2.jpg |
| Dirty Shirt | Thrash Metal | WAK6 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/8/d/csm_dirty_Shirt_26_d6b1aa60da.jpg |
| Unzucht | Metal | WAK7 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/b/2/csm_unzucht_26_5662cb7925.jpg |

### Welcome to the Jungle Stage

> Welcome to the Jungle has not been published in the official running order yet — slots and bands here are TBD.

| Name | Genre | Slot | Band Status | Image URL |
| ------ | ------ | ------ | ------------- | ----------- |
| TBD | Metal | JUN1 | TBD | PLACEHOLDER |
| TBD | Metal | JUN2 | TBD | PLACEHOLDER |

---

## Day 2 — Thursday, 30 July 2026

> **Source:** Band placements below mirror the official Wacken 2026 running order as of 2026-05-20. All 8 stages open on Day 2 (Welcome to the Jungle not yet in official running order).

### Harder Stage

| Name | Genre | Slot | Band Status | Image URL |
| ------ | ------ | ------ | ------------- | ----------- |
| Uli Jon Roth | Hard Rock | HAR1 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/3/b/csm_uli_jon_roth26_db0812a7ce.jpg |
| Europe | Hard Rock | HAR2 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/5/3/csm_Europe-WOA26_9d76063492.jpg |
| Def Leppard | Hard Rock | HAR3 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/3/4/csm_Def_Leppard-WOA26_27e5f4ed42.jpg |

### Faster Stage

| Name | Genre | Slot | Band Status | Image URL |
| ------ | ------ | ------ | ------------- | ----------- |
| Skyline | Metal | FAS5 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/6/5/csm_skyline_2024_a76c70015c.jpg |
| Yngwie Malmsteen | Heavy Metal | FAS6 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/9/0/csm_yngwie_malmsteen_26_451945c4f5.jpg |
| Savatage | Heavy Metal | FAS7 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/9/9/csm_Savatage-WOA26_6be2e38515.jpg |

### Louder Stage

| Name | Genre | Slot | Band Status | Image URL |
| ------ | ------ | ------ | ------------- | ----------- |
| Alien Ant Farm | Hard Rock | LOU7 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/a/b/csm_alien_ant_farm_26_f4695d8f52.jpg |
| H-Blockx | Metal | LOU8 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/c/7/csm_H_Blockx-WOA26_c10c9dda61.jpg |
| Therapy? | Hard Rock | LOU9 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/8/5/csm_therapy26_acbd2ac94b.jpg |
| Life of Agony | Metal | LOU10 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/9/4/csm_life_of_agony26_68ef27b061.jpg |
| P.O.D. | Metal | LOU11 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/f/0/csm_POD_26_52d8ce1512.jpg |
| Turbonegro | Punk | LOU12 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/1/b/csm_turbonegro26_2118d824cd.jpg |

### W.E.T. Stage

| Name | Genre | Slot | Band Status | Image URL |
| ------ | ------ | ------ | ------------- | ----------- |
| E.N.D. | Metal Battle | WET13 | TDB | PLACEHOLDER |
| Haine | Metal Battle | WET14 | TDB | PLACEHOLDER |
| TDB MTB | Metal Battle | WET15 | TDB MTB | PLACEHOLDER |
| TDB MTB | Metal Battle | WET16 | TDB MTB | PLACEHOLDER |
| Given By The Flames | Metal Battle | WET17 | TDB | PLACEHOLDER |
| TDB MTB | Metal Battle | WET18 | TDB MTB | PLACEHOLDER |
| Craft | Black Metal | WET19 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/8/d/csm_Craft_cropped_size_-_photo_by_Soile_Siirtola_fabe03b40f.jpg |
| Spectral Wound | Black Metal | WET20 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/2/e/csm_spectral_wound26_3263ad4710.jpg |
| Misery Index | Death Metal | WET21 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/5/a/csm_Misery_Index-WOA26_477d278139.jpg |
| Misþyrming & Nergal | Black Metal | WET22 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/5/c/csm_Sventevith-Logo-2_da655748b4.jpg |

### Headbangers Stage

| Name | Genre | Slot | Band Status | Image URL |
| ------ | ------ | ------ | ------------- | ----------- |
| Novelization | Metal Battle | HBA13 | TDB | PLACEHOLDER |
| Gágor | Metal Battle | HBA14 | TDB | PLACEHOLDER |
| Force | Metal Battle | HBA15 | TDB | PLACEHOLDER |
| Midhaven | Metal Battle | HBA16 | TDB | PLACEHOLDER |
| Gidora | Metal Battle | HBA17 | TDB | PLACEHOLDER |
| TDB MTB | Metal Battle | HBA18 | TDB MTB | PLACEHOLDER |
| Firespawn | Death Metal | HBA19 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/0/3/csm_Firespawn-WOA26_b9d52bcc7e.jpg |
| Blood Red Throne | Death Metal | HBA20 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/0/a/csm_blood_red_throne26_98867522b5.jpg |
| Anaal Nathrakh | Black Metal | HBA21 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/c/6/csm_AnaalNathrakh1_1706ff6610.jpg |
| Cowgirls From Hell | Metal | HBA22 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/4/0/csm_cowgirls_from_hell_26_30a60185cc.jpg |

### Wasteland Stage

| Name | Genre | Slot | Band Status | Image URL |
| ------ | ------ | ------ | ------------- | ----------- |
| Saviourself | Metal | WAS8 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/a/5/csm_saviourself_26_2359155f97.jpg |
| Black Tish | Metal | WAS9 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/c/6/csm_black_tish_26_9887b0d604.jpg |
| Brunhilde | Folk Metal | WAS10 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/b/4/csm_brunhilde_26_489882e4fb.jpg |
| 9mm Headshot | Metal | WAS11 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/5/c/csm_9mm_26_b14cffe6c2.jpg |
| Wytch Hazel | Heavy Metal | WAS12 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/2/5/csm_Wytch_Hazel-WOA26_3a3c5566d4.jpg |
| Temple of the Absurd | Metal | WAS13 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/f/a/csm_temple_of_the_absurd_26_ad20ecb9ce.jpg |
| Evil Jared & Krogi | Metal | WAS14 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/9/5/csm_evil_jared_krogi26_9d4bb77d9d.jpg |
| Year of the Goat | Doom Metal | WAS15 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/4/e/csm_year_of_the_goat_26_f271ba4dd9.jpg |

### Wackinger Stage

| Name | Genre | Slot | Band Status | Image URL |
| ------ | ------ | ------ | ------------- | ----------- |
| Wüstenberg | Metal | WAK8 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/1/1/csm_wuestenberg_26_7a5a7ede3d.jpg |
| Katerfahrt | Hard Rock | WAK9 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/7/0/csm_Katerfahrt-WOA26_4213c9f3a0.jpg |
| Vogelfrey | Folk Metal | WAK10 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/a/3/csm_vogelfrey_26_b_0c6f4b5859.jpg |
| Sagenbringer | Folk Metal | WAK11 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/7/2/csm_sagenbringer_26_b57d26c84d.jpg |
| Storm Seeker | Folk Metal | WAK12 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/c/9/csm_stormseeker26_ffac69751b.jpg |
| Kupfergold | Metal | WAK13 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/2/c/csm_Kupfergold-WOA26_1d73350ab6.jpg |
| Manntra | Folk Metal | WAK14 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/1/3/csm_manntra_26_a22fae1fff.jpg |

### Welcome to the Jungle Stage

> Welcome to the Jungle has not been published in the official running order yet — slots and bands here are TBD.

| Name | Genre | Slot | Band Status | Image URL |
| ------ | ------ | ------ | ------------- | ----------- |
| TBD | Metal | JUN3 | TBD | PLACEHOLDER |
| TBD | Metal | JUN4 | TBD | PLACEHOLDER |

---

## Day 3 — Friday, 31 July 2026

> **Source:** Band placements below mirror the official Wacken 2026 running order as of 2026-05-20.

### Harder Stage

| Name | Genre | Slot | Band Status | Image URL |
| ------ | ------ | ------ | ------------- | ----------- |
| Vreid | Metal | HAR4 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/8/0/csm_vreid_26_f92e6e9af1.jpg |
| Danko Jones | Hard Rock | HAR5 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/d/e/csm_danko_jones_26_3405a63446.jpg |
| Saxon | Heavy Metal | HAR6 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/3/6/csm_saxon_26_0097ea04d2.jpg |
| Judas Priest | Heavy Metal | HAR7 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/0/d/csm_judas_priest26_47424c35d1.jpg |
| Sepultura | Metal | HAR8 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/6/1/csm_Sepultura-WOA26_f6b8328d6d.jpg |

### Faster Stage

| Name | Genre | Slot | Band Status | Image URL |
| ------ | ------ | ------ | ------------- | ----------- |
| Gutalax | Death Metal | FAS8 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/f/4/csm_Gutalax-WOA26_6c3c4625c6.jpg |
| Paradise Lost | Doom Metal | FAS9 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/8/a/csm_oaradise_lost_26_339356239c.jpg |
| Black Label Society | Heavy Metal | FAS10 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/d/4/csm_Blacl_Label_Society_26_315019e5cb.jpg |
| In Flames | Death Metal | FAS11 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/8/6/csm_In-Flames-WOA26_9e6947d658.jpg |
| Running Wild | Heavy Metal | FAS12 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/b/f/csm_Running_Wild-WOA26_5c9b78de18.jpg |

### Louder Stage

| Name | Genre | Slot | Band Status | Image URL |
| ------ | ------ | ------ | ------------- | ----------- |
| Mr. Hurley und die Pulveraffen | Folk Metal | LOU13 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/b/0/csm_mr_hurley_und_die_pulveraffen_26_39b0d12506.jpg |
| Future Palace | Metalcore | LOU14 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/c/6/csm_Future_Palace-WOA26_03d8bb4d08.jpg |
| Mantar | Doom Metal | LOU15 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/0/1/csm_Mantar-WOA26_41ea1e294a.jpg |
| Paleface Swiss | Metal | LOU16 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/6/2/csm_Paleface_Swiss-WOA26_9755b4556f.jpg |
| Hatebreed | Metalcore | LOU17 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/a/6/csm_hatebreed_26_1a7dea75de.jpg |
| Blood Fire Death | Black Metal | LOU18 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/5/d/csm_Blood_Fire_Death-WOA26_c420b03929.jpg |
| Emperor | Black Metal | LOU19 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/d/2/csm_Emperor-WOA26_d4f869c941.jpg |
| Subway to Sally | Hard Rock | LOU20 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/6/3/csm_subway_to_sally_26_c89a7c04fa.jpg |

### W.E.T. Stage

| Name | Genre | Slot | Band Status | Image URL |
| ------ | ------ | ------ | ------------- | ----------- |
| TDB MTB | Metal Battle | WET23 | TDB MTB | PLACEHOLDER |
| Employed to Serve | Metalcore | WET24 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/a/a/csm_employed_to_serve26_631874c4dd.jpg |
| Deafheaven | Black Metal | WET25 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/1/0/csm_deafheaven_26_4d801d532f.jpg |
| The Haunted | Death Metal | WET26 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/d/3/csm_The_Haunted-WOA26_849d3b2a7e.jpg |
| Animals as Leaders | Metal | WET27 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/2/b/csm_animals_as_leaders26_0a9b3dfbf5.jpg |
| Crematory | Doom Metal | WET28 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/7/c/csm_crematory_26_8ae2e22d82.jpg |
| Skynd | Metal | WET29 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/7/3/csm_skynd26_fdaccaa45e.jpg |

### Headbangers Stage

| Name | Genre | Slot | Band Status | Image URL |
| ------ | ------ | ------ | ------------- | ----------- |
| Ten56. | Metalcore | HBA23 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/c/b/csm_Ten56-WOA26_515bdac59e.jpg |
| Grand Magus | Heavy Metal | HBA24 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/2/a/csm_Grand_Magus-WOA26_00bbab917e.jpg |
| Any Given Day | Metalcore | HBA25 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/d/f/csm_Any_given_Day-WOA26_45b0bb14e2.jpg |
| Pig Destroyer | Death Metal | HBA26 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/7/9/csm_Pig_Destroyer-WOA26_111d076650.jpg |
| Bear McCreary | Metal | HBA27 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/a/e/csm_bear_mccreary_26b_802dfd47bf.jpg |
| Bleed from Within | Metalcore | HBA28 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/c/6/csm_bleed_from_within_26_c38f26c402.jpg |
| Alcest | Black Metal | HBA29 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/d/2/csm_alcest_26_ca67b9d832.jpg |

### Wasteland Stage

| Name | Genre | Slot | Band Status | Image URL |
| ------ | ------ | ------ | ------------- | ----------- |
| Heartless Human Harvest | Death Metal | WAS16 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/b/9/csm_heartless_human_harvest_26_5c7a455a4e.jpg |
| Cursed Abyss | Black Metal | WAS17 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/e/d/csm_cursed_abyss_26_924d9b9653.jpg |
| Chaosbay | Death Metal | WAS18 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/c/8/csm_chaos_bay_26_6d40a05540.jpg |
| Luna Kills | Power Metal | WAS19 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/3/3/csm_Luna_Kills-WOA26_9c2715ab09.jpg |
| Insanity Alert | Thrash Metal | WAS20 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/a/3/csm_Insanity_Alert-WOA26_32944b8820.jpg |
| Arroganz | Metal | WAS21 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/6/f/csm_arroganz_26b_b0fc829592.jpg |
| Divlje Jagode | Hard Rock | WAS22 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/5/0/csm_divlje_jagode_26_e0a2c64203.jpg |
| Alfahanne | Black Metal | WAS23 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/b/6/csm_alfahanne_26_9c1f0784c4.jpg |

### Wackinger Stage

| Name | Genre | Slot | Band Status | Image URL |
| ------ | ------ | ------ | ------------- | ----------- |
| tuXedoo | Heavy Metal | WAK15 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/a/b/csm_tuxedoo_26_2cbaa64988.jpg |
| Blaas of Glory | Folk Metal | WAK16 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/e/5/csm_blaas_of_glory_26_f53a31927e.jpg |
| Metaklapa | Folk Metal | WAK17 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/8/7/csm_metaklapa_2024_ec19d5fd80.jpg |
| Trold | Black Metal | WAK18 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/7/2/csm_trold_26_e2d88c204e.jpg |
| Cruachan | Folk Metal | WAK19 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/4/0/csm_cruachan_26_fe9f62c6a3.jpg |
| Eläkeläiset | Folk Metal | WAK20 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/e/d/csm_Elaekelaeiset-WOA26_0517340ca3.jpg |
| Dubioza Kolektiv | Folk Metal | WAK21 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/e/8/csm_dubioza_kollektiv26_190126a762.jpg |
| Faun | Folk Metal | WAK22 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/2/4/csm_Faun2-WOA26_dec165b202.jpg |

### Welcome to the Jungle Stage

> Welcome to the Jungle has not been published in the official running order yet — slot and band TBD.

| Name | Genre | Slot | Band Status | Image URL |
| ------ | ------ | ------ | ------------- | ----------- |
| TBD | Metal | JUN5 | TBD | PLACEHOLDER |

---

## Day 4 — Saturday, 1 August 2026

> **Source:** Band placements below mirror the official Wacken 2026 running order as of 2026-05-20. Note: the Farewell & Announcements ceremony moved from Faster (FAS17 previously) to Harder (HAR13). Sabaton headlines Harder, not Faster.

### Faster Stage

| Name | Genre | Slot | Band Status | Image URL |
| ------ | ------ | ------ | ------------- | ----------- |
| Kim Dracula | Metal | FAS13 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/3/4/csm_kim_dracula26_6085add158.jpg |
| Nevermore | Metal | FAS14 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/6/6/csm_nevermore_26b_55b9630985.jpg |
| Airbourne | Party Metal | FAS15 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/d/e/csm_Airborn-WOA26_24e9c1f588.jpg |
| Powerwolf | Power Metal | FAS16 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/9/f/csm_Powerwolf-WOA26_acf32b8b68.jpg |
| Alestorm | Party Metal | FAS17 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/6/d/csm_alestorm_26_9ddf45fa2e.jpg |

### Harder Stage

| Name | Genre | Slot | Band Status | Image URL |
| ------ | ------ | ------ | ------------- | ----------- |
| Heavysaurus | Metal | HAR9 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/3/0/csm_heavysaurus_26_9d1aa2a6db.jpg |
| Orbit Culture | Death Metal | HAR10 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/d/c/csm_Orbit_Culture-WOA26_e0ccb2b84a.jpg |
| Lamb of God | Metal | HAR11 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/7/4/csm_lamb_of_god_26b_d0cd004159.jpg |
| Arch Enemy | Death Metal | HAR12 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/c/c/csm_arch_enemy_26c_e1e9c04c76.jpg |
| Farewell & Announcements | Metal | HAR13 | CEREMONY | — |
| Sabaton | Power Metal | HAR14 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/a/4/csm_sabaton_26_143decf5a4.jpg |

### Louder Stage

| Name | Genre | Slot | Band Status | Image URL |
| ------ | ------ | ------ | ------------- | ----------- |
| TBD | Metal | LOU21 | TBD | PLACEHOLDER |
| Kittie | Heavy Metal | LOU22 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/d/6/csm_kittie_26_31697daab6.jpg |
| Thrown | Doom Metal | LOU23 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/4/9/csm_Thrown-WOA26_f70cc40622.jpg |
| Of Mice and Men | Metalcore | LOU24 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/5/2/csm_of_mice_and_men_26_26aab5f25c.jpg |
| Kärbholz | Punk | LOU25 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/7/4/csm_kaerbholz_26_85a563b793.jpg |
| Thy Art Is Murder | Death Metal | LOU26 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/8/0/csm_thy_art_is_murder_26_9e88fcd95e.jpg |
| Triptykon | Black Metal | LOU27 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/3/c/csm_Triptykon-WOA26_0599ad9698.jpg |

### W.E.T. Stage

| Name | Genre | Slot | Band Status | Image URL |
| ------ | ------ | ------ | ------------- | ----------- |
| TBD | Metal | WET30 | TBD | PLACEHOLDER |
| Blood Command | Punk | WET31 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/e/8/csm_Blood_Command-WOA26_f82b942e22.jpg |
| Our Promise | Metal | WET32 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/a/0/csm_our_promise_26_661c3c384d.jpg |
| Hardline | Hard Rock | WET33 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/c/5/csm_hardline_26_73180980cd.jpg |
| Lagwagon | Metalcore | WET34 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/a/e/csm_lagwagon26_9b4cccaa2b.jpg |
| Corrosion of Conformity | Doom Metal | WET35 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/0/b/csm_corrosion_of_conformity_26_8ba7dabe09.jpg |
| Fit For An Autopsy | Death Metal | WET36 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/b/7/csm_fit_for_an_autopsy_26_1695f9334e.jpg |

### Headbangers Stage

| Name | Genre | Slot | Band Status | Image URL |
| ------ | ------ | ------ | ------------- | ----------- |
| Focus. | Metal | HBA30 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/8/9/csm_focus_26_a98ab7e760.jpg |
| Crimson Glory | Metal | HBA31 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/8/2/csm_crimson_glory_26_59c22b790e.jpg |
| Angelus Apatrida | Thrash Metal | HBA32 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/d/0/csm_angelus_apatrida_26_0bf97316dd.jpg |
| Municipal Waste | Thrash Metal | HBA33 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/4/1/csm_municipal_waste26_b40cb13d64.jpg |
| Dritte Wahl | Punk | HBA34 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/f/8/csm_Dritte_Wahl_26_89eac3e241.jpg |
| Vended | Metal | HBA35 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/0/7/csm_vended_26_a96222e9bb.jpg |
| The Limit | Metal | HBA36 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/b/6/csm_the_limit_26_954965f6df.jpg |

### Wackinger Stage

| Name | Genre | Slot | Band Status | Image URL |
| ------ | ------ | ------ | ------------- | ----------- |
| Wacken Firefighters | Metal | WAK23 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/0/6/csm_wacken_firefighters_25_5f6d39317e.jpg |
| Minotaurus | Metal | WAK24 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/9/0/csm_minotaurus_26_1ab67a12ae.jpg |
| Dieter "Maschine" Birr | Metal | WAK25 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/e/5/csm_dieter_maschine_birr_26b_a569706c0c.jpg |
| Zeltinger Band | Metal | WAK26 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/1/0/csm_zeltinger_26_74420c1905.jpg |
| Ad Infinitum | Power Metal | WAK27 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/f/a/csm_ad_infinitum_26_cb9028b792.jpg |
| Finsterforst | Folk Metal | WAK28 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/b/8/csm_finsterforst_26_1eb394d15b.jpg |
| Einherjer | Black Metal | WAK29 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/c/2/csm_Einherjer-WOA26_9393fba15b.jpg |

### Wasteland Stage

| Name | Genre | Slot | Band Status | Image URL |
| ------ | ------ | ------ | ------------- | ----------- |
| TBD | Metal | WAS24 | TBD | PLACEHOLDER |
| Stonem | Metal | WAS25 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/4/9/csm_stonem_26_e1ff4b71dd.jpg |
| Asrock | Metal | WAS26 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/c/a/csm_asrock_26_85c4a23518.jpg |
| Allt | Black Metal | WAS27 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/a/f/csm_Allt-WOA26_20072966da.jpg |
| The Other | Punk | WAS28 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/4/8/csm_the_other_26_bb6a90d46d.jpg |
| Castle Rat | Heavy Metal | WAS29 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/f/3/csm_castle_Rat_26_29b54db683.jpg |
| Guilt Trip | Metal | WAS30 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/d/b/csm_guilt_trip_26_524191a47e.jpg |
| Hackneyed | Death Metal | WAS31 | CONFIRMED | https://www.wacken.com/fileadmin/_processed_/3/f/csm_hacknayed_26_2bf550c457.jpg |
| TBD | Metal | WAS32 | TBD | PLACEHOLDER |

### Welcome to the Jungle Stage

> Welcome to the Jungle has not been published in the official running order yet — slots and bands here are TBD.

| Name | Genre | Slot | Band Status | Image URL |
| ------ | ------ | ------ | ------------- | ----------- |
| TBD | Metal | JUN6 | TBD | PLACEHOLDER |
| TBD | Metal | JUN7 | TBD | PLACEHOLDER |
| TBD | Metal | JUN8 | TBD | PLACEHOLDER |

---

## Removed Placeholder Bands

The following bands were in the previous version of this file as fake/guessed placeholders and have been **removed** because they do not appear on any official Wacken 2026 poster. They must also be removed from `supabase/seed/bands.ts` and the database.

| Band | Reason |
|------|--------|
| AC/DC | Placeholder guess — not on any official poster |
| Accept | Placeholder guess — not on any official poster |
| Amon Amarth | Placeholder guess — not on any official poster |
| Angel Witch | Placeholder guess — not on any official poster |
| Apocalyptica | Placeholder guess — not on any official poster |
| Archgoat | Placeholder guess — not on any official poster |
| Archspore | Placeholder guess — not on any official poster |
| At the Gates | Placeholder guess — not on any official poster |
| Autopsy | Placeholder guess — not on any official poster |
| Avantasia | Placeholder guess — not on any official poster |
| Bathory (multiple fake entries) | Placeholder guess — not on any official poster |
| Behemoth | Placeholder guess — not on any official poster |
| Belphegor | Placeholder guess — not on any official poster |
| Blind Guardian | Placeholder guess — not on any official poster |
| Bloodbath | Placeholder guess — not on any official poster |
| Burzum | Placeholder guess — not on any official poster |
| Cannibal Corpse | Placeholder guess — not on any official poster |
| Carcass | Placeholder guess — not on any official poster |
| Carnage | Placeholder guess — not on any official poster |
| Celtic Frost | Placeholder guess — not on any official poster |
| Cradle of Filth | Placeholder guess — not on any official poster |
| Cynic | Placeholder guess — not on any official poster |
| Dark Funeral | Placeholder guess — not on any official poster |
| Darkthrone | Placeholder guess — not on any official poster |
| Deicide | Placeholder guess — not on any official poster |
| Delain | Placeholder guess — not on any official poster |
| Demilich | Placeholder guess — not on any official poster |
| Destruction | Placeholder guess — not on any official poster |
| Dimmu Borgir | Placeholder guess — not on any official poster |
| Dying Fetus | Placeholder guess — not on any official poster |
| Electric Callboy | Placeholder guess — not on any official poster |
| Enslaved | Placeholder guess — not on any official poster |
| Entombed | Placeholder guess — not on any official poster |
| Epica | Placeholder guess — not on any official poster |
| Evanescence | Placeholder guess — not on any official poster |
| Exhumed | Placeholder guess — not on any official poster |
| Exodus | Placeholder guess — not on any official poster |
| Goatmoon | Placeholder guess — not on any official poster |
| Gojira | Placeholder guess — not on any official poster |
| Grave | Placeholder guess — not on any official poster |
| Guns N' Roses | Placeholder guess — not on any official poster |
| Gwar | Placeholder guess — not on any official poster |
| Heilung | Placeholder guess — not on any official poster |
| Helloween | Placeholder guess — not on any official poster |
| Immortal | Placeholder guess — not on any official poster |
| Infected Rain | Placeholder guess — not on any official poster |
| Iron Maiden | Placeholder guess — not on any official poster |
| Kreator | Placeholder guess — not on any official poster |
| Manowar | Placeholder guess — not on any official poster |
| Mastodon | Placeholder guess — not on any official poster |
| Meshuggah | Placeholder guess — not on any official poster |
| Metallica | Placeholder guess — not on any official poster |
| Morbid Angel | Placeholder guess — not on any official poster |
| Motorhead | Placeholder guess — not on any official poster |
| Napalm Death | Placeholder guess — not on any official poster |
| Neurosis | Placeholder guess — not on any official poster |
| Nile | Placeholder guess — not on any official poster |
| Norsemen | Placeholder guess — not on any official poster |
| Nothing More | Had real image URL but does not appear on any official poster |
| Obituary | Placeholder guess — not on any official poster |
| Opeth | Placeholder guess — not on any official poster |
| Possessed | Placeholder guess — not on any official poster |
| Primal Fear | Placeholder guess — not on any official poster |
| Sarcófago | Placeholder guess — not on any official poster |
| Satyricon | Placeholder guess — not on any official poster |
| Skalds | Placeholder guess — not on any official poster |
| Slayer | Placeholder guess — not on any official poster |
| Sodom | Placeholder guess — not on any official poster |
| Spawn of Possession | Placeholder guess — not on any official poster |
| Stratovarius | Placeholder guess — not on any official poster |
| Suffocation | Placeholder guess — not on any official poster |
| Svartsot | Placeholder guess — not on any official poster |
| The Agonist | Placeholder guess — not on any official poster |
| Testament | Placeholder guess — not on any official poster |
| Týr | Placeholder guess — not on any official poster |
| Ulver | Placeholder guess — not on any official poster |
| Unleash | Placeholder guess — not on any official poster |
| Unleashed | Placeholder guess — not on any official poster |
| Venom | Placeholder guess — not on any official poster |
| Venom Inc | Placeholder guess — not on any official poster |
| Wardruna | Placeholder guess — not on any official poster |
| Watain | Placeholder guess — not on any official poster |
| Within Temptation | Placeholder guess — not on any official poster |

---

## Maintenance Guide

### How to add a new confirmed band image

1. In the Band Assignments section above, change `TBD` → `CONFIRMED` and replace `PLACEHOLDER` with the full image URL from wacken.com
2. In `supabase/seed/bands.ts`, find the entry by `slot_id` and update `image_url` with the same URL
3. Run `npm run seed:bands:sync` to preview, then `npm run seed:bands:sync -- --apply`

### How to move a band to a different stage or day

This file maps directly to `bands.ts`. See [stages.md](stages.md#how-stages-link-to-bands) for the field mapping table.

**Steps to move a band:**
1. Update the day section and stage section in this file
2. Update the stage schedule in [stages.md](stages.md) if the slot time changes
3. In `bands.ts`, update the `stage` constant and the date variable prefix in `start_time`/`end_time`
4. Run `npm run seed:bands:sync -- --apply`. If picks must follow a slot change, run `seed:bands:move` first — see [lineup-sync.md](lineup-sync.md).

### How to confirm a slot's official time

See [stages.md — How to Confirm a Slot's Official Time](stages.md#how-to-confirm-a-slots-official-time).

### How to add a new slot

See [stages.md — How to Add a New Slot](stages.md#how-to-add-a-new-slot). Once the slot exists in stages.md, add the band row here referencing the new Slot ID.
