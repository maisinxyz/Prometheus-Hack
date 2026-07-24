# Premium Overhaul PRD — v2 (3D Level-Select)

> **What changed from v1:** Step 2 has been fully rewritten. The original plan removed the real MapLibre 3D map and replaced it with a flat, illustrated 2D Phaser path. This version keeps the real 3D map — it gets restyled into a "toy city" look, with a candy-crush-style glowing path and node markers layered on top, a camera that locks onto the current level but lets the player pan/rotate freely (with a recenter button), and an unlock moment that's noticeable but tasteful rather than fully restrained or maximally epic.
>
> Three small follow-on edits were made outside Step 2, only because they directly assumed the map had been deleted: Task 3.4 (Step 3), and two spots in Task 7.2 / 7.3 (Step 7). Everything else — Steps 1, 4, 5, 6, and the rest of Step 3 and Step 7 — is reproduced exactly as originally written.

---

## STEP 1 — Data & Progression Foundation

Read PRDfile.md, ToDoList.md, and everything in src/data/ and src/systems/ before making changes. This step establishes the data and math foundation every later step depends on — get it exactly right.

**TASK 1.1 — Reorder venues.json**
FILE: src/data/venues.json
ACTION: Reorder the array of 15 venue objects into this exact sequence (by id): construction_site, broadway_theater, ferry_docks, tech_startup, subway_station, empire_state_building, gym, public_library, art_studio, financial_district_office, central_park, times_square, nyc_hospital, hot_dog_stand, mackenzie_cafe.
Do not delete or rename any venue's existing fields (itemPoolIds, backgroundKeys, latitude, longitude, binPositions, spawnZones) — only reorder the array and update unlockChiThreshold per TASK 1.2.
DEFINITION OF DONE: venues.json contains all 15 original venues, zero data loss, in the exact order listed above (verify by printing venue.id in array order).

**TASK 1.2 — Set non-linear unlock thresholds**
FILE: src/data/venues.json
ACTION: Set each venue's unlockChiThreshold field (this represents the CHI required in the PRECEDING venue to unlock this one) to:
Position 1 (construction_site): 0
Position 2 (broadway_theater): 15
Position 3 (ferry_docks): 30
Position 4 (tech_startup): 45
Position 5 (subway_station): 45
Position 6 (empire_state_building): 60
Position 7 (gym): 60
Position 8 (public_library): 60
Position 9 (art_studio): 75
Position 10 (financial_district_office): 75
Position 11 (central_park): 75
Position 12 (times_square): 75
Position 13 (nyc_hospital): 90
Position 14 (hot_dog_stand): 90
Position 15 (mackenzie_cafe): 90
DEFINITION OF DONE: A Vitest test in tests/progression.test.ts asserts these exact 15 threshold values in array order.

**TASK 1.3 — Fix CHI initialization (currently a known bug)**
FILE: src/systems/ChiSystem.ts
ACTION: Ensure a venue's CHI defaults to 0 the first time it is visited (NOT 50). Confirm getChi(venueId) returns 0 for any venueId with no localStorage entry yet, not a neutral default.
DEFINITION OF DONE: Fresh browser profile (clear localStorage), calling chiSystem.getChi('any_venue_id') returns 0.

**TASK 1.4 — Rewrite the CHI gain formula**
FILE: src/systems/ChiSystem.ts (or ScoringConfig.ts if constants live there — check both, keep values in ONE place)
ACTION: Replace the existing updateChi formula with:
```
const CHI_GAIN_PERFECT = 15;
const CHI_PARTIAL_RATE = 0.15;
function computeChiGain(accuracyPct: number): number {
  if (accuracyPct >= 100) return CHI_GAIN_PERFECT;
  return Math.max(0, (accuracyPct - 50) * CHI_PARTIAL_RATE);
}
```
newChi = clamp(currentChi + computeChiGain(accuracyPct), 0, 100)
DEFINITION OF DONE: Vitest test asserts: accuracy=100 → gain=15; accuracy=90 → gain=6; accuracy=50 → gain=0; accuracy=20 → gain=0 (floored, not negative). Existing tests/chi.test.ts updated to match new formula, not deleted.

**TASK 1.5 — Enforce strictly sequential unlock gating**
FILE: src/scenes/LevelSelectScene.ts
ACTION: A venue at position N is interactive only if position N-1's CHI >= venue[N].unlockChiThreshold. Position 1 is always unlocked. Fix any existing logic that lets multiple venues be unlocked simultaneously via a stale/shared CHI value.
DEFINITION OF DONE: Fresh save shows ONLY construction_site unlocked. Manually setting construction_site's stored CHI to 15 via localStorage and reloading unlocks ONLY broadway_theater, nothing further.

**TASK 1.6 — Root-cause and fix the scoring inconsistency bug (ToDoList item 9)**
FILES: src/systems/ScoringSystem.ts, src/scenes/TrayScene.ts
ACTION: ToDoList.md states "sometimes it removes points and adds points even though the item is properly thrown away." Investigate resolveDrop() and the drag/drop event pipeline for: (a) double-firing of drop resolution on a single drag, (b) stale itemDef/binDef references, (c) a race between velocity-multiplier timing and correctness check. Fix the root cause, do not paper over it with a debounce hack unless the actual duplicate-event source is identified and explained in a code comment.
DEFINITION OF DONE: Add a Vitest regression test in tests/scoring.test.ts that reproduces the bug's prior symptom and now passes. Manually perform 20 correct drops in the dev server; score only ever increases, never dips on a correct drop.

**TASK 1.7 — Commit**
ACTION: Run npm run build, npm run test, npm run lint — all must pass with zero errors before proceeding. Commit with message "Step 1: progression foundation, venue reorder, CHI formula, scoring bugfix".

---

## STEP 2 — Restyle the Level-Select as a Candy-Crush-Style 3D Map

Read src/scenes/LevelSelectScene.ts, src/services/MapLibreService.ts, and src/services/LandmarkOverlayService.ts in full before starting. This step **keeps the real MapLibre 3D map** — it does not get removed. The level order from Step 1 drives the path/node layout, laid on top of the existing 3D geography. Do not change any progression/CHI/scoring logic in this step.

**TASK 2.1 — Restyle the MapLibre map instead of removing it**
FILE: src/services/MapLibreService.ts, index.html
ACTION: Keep the MapLibre GL CDN `<script>`/`<link>` tags and the `#mapkit-container` div in index.html, and keep MapLibreService's map-initialization call in LevelSelectScene.create() — do not remove any of it. Swap the active map style for a higher-saturation, "toy city" look: brighter greens for parks, warmer building colors, a softened water color, richer contrast than the plain default style. Set a default camera pitch (roughly 55–65°) so the scene reads as a 3D diorama rather than a flat utility map. Keep 3D building extrusion enabled.
DEFINITION OF DONE: LevelSelectScene loads with the MapLibre 3D map visible, extruded buildings intact, and the new "toy city" style clearly applied (confirmed by a side-by-side screenshot against the old default style); a network request to the maplibre-gl asset still fires when the scene loads, since the map is intentionally still in use.

**TASK 2.2 — Build the winding path overlay on the real map**
FILE: src/services/PathOverlayService.ts (new)
ACTION: Using each venue's existing latitude/longitude (from venues.json, in Step 1's reordered sequence), build a GeoJSON LineString connecting all 15 venues in order, with interpolated bezier-curved intermediate points between each pair so the path doesn't cut straight through blocks — it should read as a deliberate, gently winding "game path" laid over the real streets, Candy-Crush style. Render it as a glowing, slightly elevated line (a duplicated soft glow layer beneath a solid core line), with a subtle animated dash-offset so it feels alive rather than static.
DEFINITION OF DONE: All 15 venues connect via one continuous curved, glowing path rendered on top of the 3D map in the correct Step-1 order, confirmed by visual inspection; the animated dash/flow is visible in the dev server.

**TASK 2.3 — Build the 3D-aware node marker component**
FILE: src/entities/LevelNode.ts (rewritten — wraps a MapLibre Marker instead of a Phaser Container)
ACTION: class LevelNode wraps a MapLibre Marker anchored at its venue's real lat/lng. Each node is a numbered circular badge (1–15, matching venue position from Step 1), themed per venue accent color (add a per-venue color field if none exists yet, e.g. construction_site='#F59E0B', broadway_theater='#DC2626', etc. — pick colors that read as premium and distinct). Use a billboard-style DOM element (always faces the camera regardless of map pitch/rotation) sized generously for reliable tapping even when the map is tilted or rotated.
States: LOCKED (greyscale, 50% opacity, padlock icon overlay, non-interactive), UNLOCKED (full color, idle pulsing glow tween, tappable), CURRENT (unlocked styling + a small "you are here" marker bobbing above it).
DEFINITION OF DONE: All 15 nodes render at their correct real-world locations in the 3 visual states, confirmed by rendering mixed states in dev server; tapping an unlocked node registers reliably after panning/rotating/tilting the map.

**TASK 2.4 — Wire landmark icons onto nodes**
FILE: src/services/LandmarkOverlayService.ts
ACTION: Keep LandmarkOverlayService's existing icon-rendering logic (it already supplies per-venue landmark icons for map pins) and wire it into the new LevelNode markers from TASK 2.3, so each node shows its themed icon (construction cone, theater masks, ferry boat, etc.) layered with the numbered badge and state styling.
DEFINITION OF DONE: Each of the 15 nodes shows a distinct landmark icon matching its venue theme, not a generic numbered badge alone.

**TASK 2.5 — Camera lock-on, free exploration, and a recenter control**
FILE: src/services/MapCameraController.ts (new), src/scenes/LevelSelectScene.ts
ACTION: On scene load, fly the camera to center on and lock onto the CURRENT node (pitch/bearing/zoom set to clearly present it as "you are here"). After that, hand full control to the player — standard MapLibre pan/zoom/rotate gestures stay enabled so they can freely explore the rest of the city. Add a small round icon button fixed in a corner (simple styled button for now — Step 3's GlossyButton will reskin it, see Task 3.4) that, when tapped, flies the camera back to the current node's locked-on view.
DEFINITION OF DONE: Loading the scene centers/locks onto the current node; the player can freely pan/zoom/rotate away from it; tapping the recenter button flies the camera back to the locked-on view on the current node.

**TASK 2.6 — CHI progress bar and the unlock moment (noticeable but tasteful)**
FILE: src/scenes/LevelSelectScene.ts
ACTION: Show a thin CHI progress bar near the CURRENT node (fill % = current venue CHI / next threshold), rendered as a screen-space HUD element (not tied to map projection) so it stays legible at any camera angle. When a node transitions from locked to unlocked since last visit (compare stored "lastSeenUnlockedCount" in localStorage against current unlocked count), play: a single chime SFX, the padlock fading out as the node's icon fades from grey to full color, a text banner ("New Level Unlocked: <Display Name>") that appears for ~2 seconds and fades, a soft expanding glow ring around the node, AND a brief (~1–1.5s) camera drift/zoom toward the newly unlocked node before settling back. Keep it to that single flourish — no confetti, no multi-second cinematic sequence; this should read as noticeable, not maximal.
DEFINITION OF DONE: Manually raising a venue's CHI past its threshold, then returning to LevelSelectScene, triggers exactly this sequence (chime + fade + banner + glow ring + brief camera drift) once, not on every subsequent visit.

**TASK 2.7 — Clicking a node starts the round**
FILE: src/scenes/LevelSelectScene.ts
ACTION: Tapping an UNLOCKED or CURRENT node's marker calls scene.start('TrayScene', { venueId }). Tapping a LOCKED node does nothing (optionally shows a brief "Reach X CHI in <previous venue> to unlock" tooltip — nice-to-have, not required).
DEFINITION OF DONE: Click-through confirms correct venueId is passed and TrayScene loads that venue's data.

**TASK 2.8 — Commit**
ACTION: npm run build / test / lint all pass. Commit: "Step 2: restyled 3D MapLibre level-select with candy-crush-style path, lock-on camera, and tasteful unlock moment".

---

## STEP 3 — Candy-Crush Glossy Visual Reskin

Read src/scenes/HUDScene.ts, src/scenes/TrayScene.ts, src/entities/Bin.ts, and src/entities/TrashItem.ts before starting. This step is purely visual/polish — do not change any scoring, CHI, or event logic in this step.

**TASK 3.1 — Define the design token file**
FILE: src/config/UITheme.ts (new)
ACTION: Export a single source-of-truth theme object:
```
export const UI_THEME = {
  primaryGradient: ['#0F9D74', '#34D399'],   // eco-premium emerald/teal
  goldAccent: ['#FBBF24', '#F59E0B'],        // CHI, streak, currency-style elements
  dangerAccent: '#EF4444',                    // contamination / mistake flashes
  cornerRadius: 24,
  glossHighlightAlpha: 0.35,
  pressedScale: 0.95,
  popInDuration: 220,
} as const;
```
Every button/panel built in this step must import and use these values — no hardcoded hex colors or radii scattered across files.
DEFINITION OF DONE: grep confirms UITheme.ts is imported by HUDScene, LevelSelectScene, and any new button component; zero new hardcoded color hex strings introduced elsewhere in this step's diff.

**TASK 3.2 — Build a reusable GlossyButton component**
FILE: src/entities/GlossyButton.ts (new)
ACTION: class GlossyButton extends Phaser.GameObjects.Container — rounded-rect gradient background (use UI_THEME.primaryGradient or an override color), a semi-transparent white gloss strip across the top third, a soft drop shadow, label text. On pointerdown: tween scale to UI_THEME.pressedScale over 60ms; on pointerup: spring back with an 'Back.easeOut' tween. On scene-add: pop-in scale from 0→1 over UI_THEME.popInDuration with a slight overshoot.
DEFINITION OF DONE: Instantiating one GlossyButton and clicking it visibly squashes on press and springs back on release; adding it to a scene shows a pop-in animation.

**TASK 3.3 — Reskin the bins as "glossy jars"**
FILE: src/entities/Bin.ts
ACTION: Add a glossy overlay pass to each bin sprite: a colored glow ring (using that bin's existing category color) behind the sprite, and a diagonal light-streak highlight graphic layered on top. Keep the existing squash-and-stretch drop animation from the original build — this is additive polish, not a replacement.
DEFINITION OF DONE: All 4 bin types visibly show a colored glow + gloss highlight in dev server, distinct per category color.

**TASK 3.4 — Reskin the HUD**
FILE: src/scenes/HUDScene.ts
ACTION: Rebuild the score/combo/timer display as glossy pill-shaped chrome using UI_THEME. Score changes animate via a count-up tween (Phaser tweens.addCounter or manual lerp) instead of an instant text swap — never let the number jump silently. Also reskin the LevelSelectScene recenter button (Step 2, Task 2.5) and the unlock banner (Task 2.6) using GlossyButton/UI_THEME so they match this pass.
DEFINITION OF DONE: Manual play shows the score visibly counting up/down over ~300ms on each change, inside a glossy pill container; the level-select recenter button and unlock banner now use the same glossy chrome as the HUD.

**TASK 3.5 — Apply pop-in/juice to tray items on spawn**
FILE: src/entities/TrashItem.ts
ACTION: On instantiation, items should scale in from 0→1 with a slight bounce (Back.easeOut, ~200ms) rather than appearing instantly.
DEFINITION OF DONE: New trays visibly "pop" each item into place rather than instant-appearing.

**TASK 3.6 — Commit**
ACTION: npm run build / test / lint pass. Commit: "Step 3: Candy Crush-style glossy visual reskin".

---

## STEP 4 — Perfect-Streak System (Visual/Audio Flair, No Numeric Bonus)

This is a NEW, separate system from the existing in-round ComboSystem — do not confuse or merge them. ComboSystem tracks consecutive correct DROPS within one round. PerfectStreakSystem tracks consecutive perfect ROUNDS across the player's whole play history, globally, across all venues.

**TASK 4.1 — Build PerfectStreakSystem**
FILE: src/systems/PerfectStreakSystem.ts (new)
ACTION:
```
class PerfectStreakSystem {
  getCurrentStreak(): number   // reads from localStorage key 'trashdash_perfect_streak'
  getBestStreak(): number      // reads 'trashdash_best_streak'
  registerRoundResult(accuracyPct: number): { current: number; best: number; tierChanged: boolean }
    // accuracyPct === 100 → increment current, else reset current to 0
    // update best if current > best
    // persist both to localStorage
    // emit 'streak-changed' event with { current, best }
}
```
DEFINITION OF DONE: Vitest test: 3 perfect rounds in a row → current=3; 1 imperfect round → current resets to 0, best stays at 3. Value survives simulated page reload (re-read from localStorage).

**TASK 4.2 — Subscribe to 'round-ended'**
FILE: src/scenes/TrayScene.ts or your existing MetaGameController
ACTION: On 'round-ended', call perfectStreakSystem.registerRoundResult(payload.accuracyPct).
DEFINITION OF DONE: Manual play confirms the stored streak value updates correctly after each round per Task 4.1's rules.

**TASK 4.3 — Build StreakFXManager (visual/audio tiers only — NO numeric gameplay effect)**
FILE: src/systems/StreakFXManager.ts (new)
ACTION: Subscribes to 'streak-changed'. Defines 4 tiers by streak count:
Tier 0 (0): no flair, baseline HUD.
Tier 1 (1–2): subtle gold glow (UI_THEME.goldAccent) around the score readout.
Tier 2 (3–4): glow intensifies + a short ascending audio stinger plays on the round summary screen.
Tier 3 (5–9): HUD border pulses gold continuously; summary screen shows an animated spark icon next to the streak count; distinct fanfare stinger.
Tier 4 (10+): full "on fire" treatment — animated flame icon, richer fanfare, a brief particle sparkle burst on the summary screen only (not mid-round — keep mid-round FX limited to the existing ComboSystem's territory to avoid visual clutter).
Explicitly: no CHI multiplier, no score multiplier, no gameplay-affecting change of any kind is triggered by this system — confirm this in code comments so a future contributor doesn't "fix" it into a numeric bonus by mistake.
DEFINITION OF DONE: Manually forcing streak values 0, 2, 4, 8, 12 (via localStorage edit + reload) shows 4 visibly distinct escalating flair tiers with zero change to score/CHI math confirmed by unchanged scoring test suite.

**TASK 4.4 — Commit**
ACTION: npm run build / test / lint pass. Commit: "Step 4: global perfect-streak system with tiered visual/audio flair, no gameplay bonus".

---

## STEP 5 — Tutorial System (Contextual Walkthrough + Persistent Help)

**TASK 5.1 — Build the contextual Level 1 walkthrough**
FILE: src/systems/TutorialController.ts (new), src/scenes/TrayScene.ts
ACTION: On entering TrayScene for the FIRST venue in venues.json (position 1 — read dynamically, do NOT hardcode 'mackenzie_cafe' or any specific venue id, since Step 1 reordered venues and construction_site is now first), check localStorage key 'trashdash_tutorial_complete'. If unset, run this sequence before the normal round timer starts:
1. Dim the background (semi-transparent black overlay), spotlight ONE trash item with a pulsing highlight ring (reuse the existing lock-on reticle visual style).
2. Show an animated hand/cursor icon tracing a drag path from that item to its correct bin.
3. Show a text callout: "Drag trash to the matching bin!"
4. Gate input so only that spotlighted item is draggable until the player completes one correct drop themselves.
5. On their first correct drop: brief "Nice!" callout, remove the dim overlay, then proceed into a normal (but shortened, ~4-item) first round using beginner-tier settings.
6. On that round's completion, set 'trashdash_tutorial_complete' = true. Never auto-trigger again afterward, including on other venues.
DEFINITION OF DONE: Fresh browser profile playing the first unlocked venue shows this full walkthrough exactly once; replaying that same venue afterward, or playing any other venue, never shows it again.

**TASK 5.2 — Build the persistent Help button + How-to-Play overlay**
FILE: src/entities/GlossyButton.ts (reuse from Step 3), src/scenes/HowToPlayOverlay.ts (new)
ACTION: Add a small "?" GlossyButton fixed in a corner of both HUDScene and LevelSelectScene, always visible and clickable regardless of tutorial-completion state. Clicking it opens HowToPlayOverlay, a scene/overlay covering: (a) drag-and-drop basics, (b) a legend of all 4 bin categories with their colors/icons, (c) a plain-language explanation of how CHI and level unlocking works, (d) a plain-language explanation of the perfect-streak flair system. If opened mid-round, pause the round timer while it's open and resume on close.
DEFINITION OF DONE: Clicking "?" from either scene opens the overlay; opening it mid-round visibly pauses the countdown timer (confirmed by the timer not decrementing while the overlay is open); closing it resumes the timer from where it paused.

**TASK 5.3 — Commit**
ACTION: npm run build / test / lint pass. Commit: "Step 5: contextual tutorial + persistent how-to-play help".

---

## STEP 6 — Round Summary Screen + Meta-System Cutover

**TASK 6.1 — Rebuild the round-summary screen**
FILE: src/scenes/HUDScene.ts (or extract to src/scenes/RoundSummaryScene.ts if cleaner)
ACTION: On 'round-ended', show a glossy premium summary panel (using UI_THEME + GlossyButton from Step 3) displaying: CHI gained this round (as an animated fill on a progress bar, not just a static number), final accuracy %, and current streak count with its Step 4 flair tier visibly applied. Do NOT show star ratings anywhere — none exist in this design. Include a "Continue" GlossyButton returning to LevelSelectScene.
DEFINITION OF DONE: Ending a round shows exactly these three data points with the correct streak flair tier, no star iconography anywhere in the summary.

**TASK 6.2 — Remove the Separation mini-game**
FILES: src/scenes/SeparationMinigameScene.ts, src/main.ts (or wherever scenes are registered), any TrayScene transitions into it
ACTION: Remove SeparationMinigameScene from the Phaser scene registry and delete any code path that transitions into it. Do NOT touch TrashItem.ts's existing dormant componentIds/attemptSeparate() stub — leave it exactly as-is (inert, matches "Cluster B not implemented" pattern already documented in docs/DEFERRED_MECHANICS.md).
DEFINITION OF DONE: npm run build has zero errors after removal; grep for 'SeparationMinigameScene' returns zero references anywhere in src/; game boots and plays a full round with no dangling scene-transition errors in console.

**TASK 6.3 — Polish the Garden/Compost meta-game into the premium theme**
FILE: wherever GardenScene.ts / CommunityGardenScene.ts render UI
ACTION: Apply UI_THEME (Step 3) to these scenes' buttons/panels/progress bars so they visually match the rest of the game rather than looking like a separate, older-style UI. Do not change their underlying compost/garden game logic in this step — visual pass only.
DEFINITION OF DONE: Side-by-side visual comparison shows Garden/Compost UI chrome now matches HUD/LevelSelect chrome (same button style, corner radius, gradient language).

**TASK 6.4 — Polish the Weather/city-state display**
FILE: src/scenes/LevelSelectScene.ts (weather display block)
ACTION: Reskin the existing weather status card (Smog Day / Flash Flood / Clear Skies / Eco-Festival) using UI_THEME glossy chrome instead of its current plain styling. Keep the underlying logic (thresholds, effect text) unchanged.
DEFINITION OF DONE: Weather card visually matches the new premium chrome, logic/thresholds unchanged (confirm existing behavior still triggers at the same total-CHI breakpoints).

**TASK 6.5 — Commit**
ACTION: npm run build / test / lint pass. Commit: "Step 6: premium round summary, cut separation mini-game, reskin garden + weather".

---

## STEP 7 — Full Regression, New Tests, and QA Pass

**TASK 7.1 — Add missing test coverage**
FILE: tests/progression.test.ts, tests/streak.test.ts (new)
ACTION: Cover: all 14 unlock threshold boundary values from Step 1 (exact match, no off-by-one); the CHI gain formula at accuracy 100/90/50/20; the 4 streak tier boundaries from Step 4 (0, 1-2, 3-4, 5-9, 10+) with tier-changed flag firing correctly at each transition.
DEFINITION OF DONE: npm run test shows these new suites passing alongside all pre-existing suites (chi, combo, decay, difficulty, policy, schema, scoring, venueDecay) — nothing pre-existing should have been broken by Steps 1-6.

**TASK 7.2 — Full manual QA checklist**
ACTION: Walk through and confirm each of the following in the dev server:
- [ ] Fresh browser profile (no localStorage): only Construction Site unlocked, tutorial walkthrough triggers automatically.
- [ ] Completing a perfect round (100% accuracy) in Construction Site adds exactly 15 CHI and increments the perfect-streak counter.
- [ ] One imperfect round afterward resets the streak to 0 but still adds partial CHI per the formula.
- [ ] Manually raising Construction Site's CHI to 15 via localStorage and reloading unlocks ONLY Broadway Theater, with the unlock banner + chime + glow ring + brief camera drift playing exactly once.
- [ ] Clicking "?" opens How-to-Play from both LevelSelectScene and mid-round (and correctly pauses/resumes the timer).
- [ ] Garden/Compost and Weather cards visually match the new premium chrome.
- [ ] No console errors referencing SeparationMinigameScene.
- [ ] The MapLibre 3D map loads with the restyled "toy city" style, 3D building extrusion intact; the camera locks onto the current node on load, free pan/zoom/rotate works, and the recenter button flies back to the locked-on view.
- [ ] Node tap targets remain reliable after panning/rotating/tilting the map (billboard hit-boxes).
- [ ] Colorblindness simulation (Chrome DevTools → Rendering → Emulate vision deficiencies → Deuteranopia) — correct/incorrect drop feedback remains distinguishable via shape/icon, not color alone.
- [ ] Chrome DevTools Performance panel shows steady 60fps during a 9-item round with particles + screen shake active, and while panning/rotating the MapLibre 3D map with the path + 15 node markers rendered.

**TASK 7.3 — Update project docs**
FILE: README.md, ToDoList.md
ACTION: Update ToDoList.md to check off items now resolved (levelling-up mechanic, points-system bug). Update README.md's tech stack table to reflect that MapLibre remains in active use (now restyled for the 3D level-select, not removed); note the status of three.js separately if it's no longer used. Briefly document the new progression curve, the 3D level-select's path/camera behavior, and the streak system for future contributors.
DEFINITION OF DONE: Both docs accurately reflect the post-overhaul state — no stale references to systems that were removed (SeparationMinigameScene) and no incorrect claim that MapLibre was removed.

**TASK 7.4 — Final commit and tag**
ACTION: npm run build / test / lint all pass with zero errors. Commit: "Step 7: full regression, new test coverage, QA pass, docs update". Tag this commit as premium-overhaul-v1-complete.

To do (AI should ignore this):
1. Improve placements and orintations of trash bins. also maybe personalize bins for each level.
2. Ensure trash placements are good. 
3. add sprites for trash.
4. ensure all garbage items work for each level. 