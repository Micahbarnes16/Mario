# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run dev      # Start Vite dev server (http://localhost:5173)
bun run build    # Build to /dist
npx tsc --noEmit # Type-check without emitting
```

No test runner or linter is configured.

## Architecture

A browser-based 2D Mario-style platformer (~2000 lines of TypeScript) using the Canvas 2D API. No external game engine or runtime dependencies — just Vite for bundling.

### Game Loop

`main.ts` bootstraps a 60 FPS `requestAnimationFrame` loop that calls `game.update()` then `game.draw()` each frame.

### Module Responsibilities

| Module | Role |
|--------|------|
| `game.ts` | State machine (menu / playing / levelcomplete / gameover / win); orchestrates all subsystems |
| `player.ts` | Player physics, movement, power-up state (small → big → fire), scoring |
| `entities.ts` | Enemy AI (Goomba, Koopa), coins, mushrooms, fireballs, score popups |
| `physics.ts` | AABB collision detection; X and Y axes resolved separately to prevent tunneling |
| `renderer.ts` | All canvas 2D drawing: tiles, sprites, HUD, menus |
| `camera.ts` | Viewport tracking — follows player with offset, clamped to level bounds |
| `level.ts` | Parses ASCII level maps into tile grids |
| `input.ts` | Keyboard (arrows, WASD, Space/X/Shift) + touch virtual controls |
| `types.ts` | Shared constants (gravity = 0.6, tile size = 32, max fall speed = 12) and type definitions |
| `levels/levels.ts` | ASCII level data |

### Level Format

Levels are ASCII strings where each character is a tile:

| Char | Tile |
|------|------|
| `G` | Ground |
| `P` | Platform |
| `B` | Brick |
| `?` | Coin box |
| `M` | Mushroom box |
| `C` | Coin |
| `S` | Player start |
| `E` | Goomba |
| `K` | Koopa |
| `F` | Goal flag |

### Physics Notes

- Gravity: 0.6 units/frame, capped at 12
- Coyote time: 6 frames for forgiving jumps
- Player speed: 3.5 units/frame (6 when running)
- Max 2 active fireballs at once

### Canvas & Responsive Layout

The canvas is fixed at 800×512 px (25×16 tiles at 32 px each). `index.html` scales it to the viewport via CSS while preserving aspect ratio. Mobile virtual controls (d-pad + action buttons) are shown via `@media (pointer: coarse)` and hidden on desktop.
