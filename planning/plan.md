# Plan: Tests, Sound, Scoring, Levels & Extras

## Context

The game currently has no tests, no audio, and a basic scoring display. We want to:
1. Add `bun test` infrastructure and write tests for all non-UI code (TDD going forward)
2. Add procedural Web Audio API sounds with mute/unmute
3. Enhance scoring: lives, time bonus, combo multiplier, localStorage high score
4. Add 3–5 new levels with increasing difficulty
5. Add at least one new enemy type
6. Add a per-level countdown timer
7. Add a parallax scrolling background

---

## Implementation Phases

### Phase 1 — Test Infrastructure + CLAUDE.md TDD Update

**Goals:** Get `bun test` working, write tests for existing non-UI code.

Bun has a built-in Jest-compatible test runner — no extra packages needed.

**Changes:**
- `package.json`: Add `"test": "bun test"` to scripts
- Create `src/__tests__/` directory with test files:
  - `physics.test.ts` — test `applyGravity`, `rectsOverlap`, `isSolid`, `resolveCollisions`, `tileRect`
  - `level.test.ts` — test `parseLevel` (tile grid output, spawn positions, player start)
  - `camera.test.ts` — test tracking offset and clamping behavior
  - `input.test.ts` — test keyboard and touch input state toggling
  - `entities.test.ts` — test Enemy AI (edge-turning, stomp, shell kick), Coin, Mushroom, Fireball
  - `player.test.ts` — test power-up state transitions, coyote time, 100-coin life-up
- `CLAUDE.md`: Add TDD section — new code must have a failing test first; run `bun test` before any commit

**Testability notes:**
- `physics.ts`, `level.ts`, `camera.ts`: pure functions, no mocking needed
- `entities.ts`, `player.ts`: need a minimal `TileGrid` and `Tile[][]` fixture; no DOM/canvas
- Browser globals (`AudioContext`, `canvas`) only appear in `renderer.ts`, `main.ts`, `sound.ts` — keep them isolated

---

### Phase 2 — Sound System (`src/sound.ts`)

**Test first:** `src/__tests__/sound.test.ts` mocks `AudioContext` and asserts each sound function calls the right oscillator type, frequency, and duration. Tests also verify mute state suppresses calls.

**Implementation:**
- New file `src/sound.ts` — exports a `SoundManager` class with:
  - `play(sound: SoundEvent)` — creates an oscillator node for each sound
  - `muted: boolean` — toggled via `toggleMute()`
  - Sound events: `jump`, `coin`, `stomp`, `powerup`, `death`, `levelcomplete`
- Procedural recipes (Web Audio API, no files):
  - `jump` — short square wave glide up (~80ms)
  - `coin` — two-tone sine blip (high C then E, ~120ms each)
  - `stomp` — brief noise burst (~60ms)
  - `powerup` — ascending arpeggio (4 notes, ~100ms each)
  - `death` — descending chromatic sine (~600ms)
  - `levelcomplete` — 8-note fanfare (~800ms total)
- `src/game.ts`: import `SoundManager`, call `sound.play(...)` at each trigger point (coin collect, stomp, etc.)
- `index.html`: Add mute button (top-right corner, emoji 🔊/🔇); wire to `soundManager.toggleMute()`

**Files modified:** `src/sound.ts` (new), `src/game.ts`, `index.html`

---

### Phase 3 — Enhanced Scoring

**Test first:** `src/__tests__/scoring.test.ts` tests time-bonus calculation, combo multiplier accumulation, and lives-system transitions in isolation.

**New file `src/scoring.ts`** — pure scoring logic:
```
calcTimeBonus(timeRemaining: number): number  // 100 pts per second left, capped at 5000
incrementCombo(current: number): number        // returns multiplier (1x–4x with 4-stomp cap)
resetCombo(): number                           // returns 1
```

**Changes to `src/types.ts`:**
- Add `lives: number` to game state (starts at 3)
- Add `combo: number`, `highScore: number`, `timeRemaining: number` fields

**Changes to `src/game.ts`:**
- Lives: on player death decrement lives; if 0 → gameover; add `+1 life` on every 100 coins (already in player.ts, wire to game state)
- Combo: on enemy stomp increment combo; reset combo on landing or taking damage
- Time bonus: on level complete, call `calcTimeBonus(timeRemaining)` and add to score
- High score: on game over or win, compare score to `localStorage.getItem('highScore')`, save if higher
- Load high score from localStorage on game init and show on menu

**Changes to `src/renderer.ts`:**
- HUD: show lives (hearts or "×N"), combo indicator when > 1×, timer countdown
- Menu: show "Best: XXXXX" below the title

**Files modified:** `src/scoring.ts` (new), `src/types.ts`, `src/game.ts`, `src/renderer.ts`

---

### Phase 4 — New Levels + New Enemy Type

**New enemy: `Paratroopa`** (flying Koopa)
- Flies in a vertical sine-wave pattern; when stomped, loses wings and becomes a normal Koopa on the ground
- Add to `src/entities.ts`, extend the `Enemy` class
- **Test first:** `src/__tests__/entities.test.ts` — add tests for `Paratroopa` vertical movement and stomp behavior

**New levels (`src/levels/levels.ts`):**
- Level 4: Underground theme — dense bricks, no platforms, more Goombas
- Level 5: Elevated sky theme — mostly platforms, Paratroopas, few ground tiles
- Level 6: Long speed run — wide open, minimal obstacles, tight timer
- Level 7: Boss gauntlet — dense enemies, many coin boxes, tricky jumps
- Level 8: Final challenge — combines all elements, hardest layout

Levels should use the existing ASCII format. New `T` tile for "Pipe top" (decorative/solid) can be added if desired, but use existing tile types for simplicity first.

**Files modified:** `src/entities.ts`, `src/levels/levels.ts`, `src/__tests__/entities.test.ts`

---

### Phase 5 — Countdown Timer + Parallax Background

**Countdown timer:**
- Per-level timer lives in `src/types.ts` as `timeRemaining: number` (seconds, initialized per level)
- `src/game.ts`: decrement `timeRemaining` each frame (`1/60` per frame); if reaches 0 → kill player (same as falling into pit)
- Starting time: Level 1–3: 300s, Level 4–6: 240s, Level 7–8: 200s
- HUD in `src/renderer.ts` shows timer in red when < 60s
- **Test:** timer decrement and death trigger are in `src/__tests__/game.test.ts`

**Parallax background:**
- Add `src/renderer.ts`: draw 2–3 background layers before tiles each frame
  - Layer 1 (sky): solid color or subtle gradient — no scroll
  - Layer 2 (distant hills/clouds): simple polygons or rectangles, scroll at 0.2× camera speed
  - Layer 3 (near hills): slightly larger shapes, scroll at 0.5× camera speed
- All done with Canvas 2D primitives — no image assets
- **Not unit tested** (pure rendering, no logic)

**Files modified:** `src/types.ts`, `src/game.ts`, `src/renderer.ts`

---

## Critical Files

| File | Role in this plan |
|------|------------------|
| `src/__tests__/*.test.ts` | New test files (one per module) |
| `src/sound.ts` | New — Web Audio procedural sound system |
| `src/scoring.ts` | New — pure scoring/combo/time-bonus logic |
| `src/entities.ts` | Add `Paratroopa` class |
| `src/game.ts` | Wire sounds, lives, combo, timer, high score |
| `src/types.ts` | Add lives, combo, timer, highScore fields |
| `src/renderer.ts` | HUD updates, parallax background layers |
| `src/levels/levels.ts` | Add 5 new levels |
| `package.json` | Add `"test": "bun test"` script |
| `CLAUDE.md` | Add TDD section |
| `index.html` | Add mute button |

---

## Verification

1. `bun test` — all tests pass, none skipped
2. `bun run dev` — game loads, no console errors
3. Play through levels 1–8, confirm sounds fire on: jump, coin, stomp, power-up, death, level complete
4. Mute button toggles audio — no sound when muted
5. Combo indicator appears on multi-stomp chains
6. Timer counts down, killing the player at 0
7. High score persists after page reload (check localStorage in DevTools)
8. Parallax layers scroll at different speeds visually
9. Paratroopa flies in sine pattern, becomes ground Koopa on stomp
10. `npx tsc --noEmit` — no type errors
