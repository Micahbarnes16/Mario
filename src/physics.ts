import { Rect, Tile, TILE_SIZE, GRAVITY, MAX_FALL_SPEED } from "./types";

export function applyGravity(vy: number): number {
  return Math.min(vy + GRAVITY, MAX_FALL_SPEED);
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function tileRect(tile: Tile): Rect {
  return { x: tile.x * TILE_SIZE, y: tile.y * TILE_SIZE, w: TILE_SIZE, h: TILE_SIZE };
}

export function isSolid(tile: Tile): boolean {
  if (tile.type === "empty" || tile.type === "flag") return false;
  if (tile.type === "brick" && tile.broken) return false;
  return true;
}

/** Resolve collisions between an entity rect and solid tiles. Returns adjusted position and whether grounded. */
export function resolveCollisions(
  rect: Rect,
  vx: number,
  vy: number,
  tiles: Tile[][],
  levelWidth: number,
  levelHeight: number
): { x: number; y: number; vx: number; vy: number; grounded: boolean; hitCeiling: boolean; hitTiles: Tile[] } {
  let { x, y, w, h } = rect;
  let grounded = false;
  let hitCeiling = false;
  const hitTiles: Tile[] = [];

  // Move X first
  x += vx;
  // Check tile collisions for X
  const txStart = Math.max(0, Math.floor(x / TILE_SIZE));
  const txEnd = Math.min(levelWidth - 1, Math.floor((x + w - 1) / TILE_SIZE));
  const tyStart = Math.max(0, Math.floor(y / TILE_SIZE));
  const tyEnd = Math.min(levelHeight - 1, Math.floor((y + h - 1) / TILE_SIZE));

  for (let ty = tyStart; ty <= tyEnd; ty++) {
    for (let tx = txStart; tx <= txEnd; tx++) {
      const tile = tiles[ty]?.[tx];
      if (!tile || !isSolid(tile)) continue;
      const tr = tileRect(tile);
      if (rectsOverlap({ x, y, w, h }, tr)) {
        if (vx > 0) {
          x = tr.x - w;
          vx = 0;
        } else if (vx < 0) {
          x = tr.x + TILE_SIZE;
          vx = 0;
        }
      }
    }
  }

  // Move Y
  y += vy;
  const txStart2 = Math.max(0, Math.floor(x / TILE_SIZE));
  const txEnd2 = Math.min(levelWidth - 1, Math.floor((x + w - 1) / TILE_SIZE));
  const tyStart2 = Math.max(0, Math.floor(y / TILE_SIZE));
  const tyEnd2 = Math.min(levelHeight - 1, Math.floor((y + h - 1) / TILE_SIZE));

  for (let ty = tyStart2; ty <= tyEnd2; ty++) {
    for (let tx = txStart2; tx <= txEnd2; tx++) {
      const tile = tiles[ty]?.[tx];
      if (!tile || !isSolid(tile)) continue;
      const tr = tileRect(tile);
      if (rectsOverlap({ x, y, w, h }, tr)) {
        if (vy > 0) {
          y = tr.y - h;
          vy = 0;
          grounded = true;
        } else if (vy < 0) {
          y = tr.y + TILE_SIZE;
          vy = 0;
          hitCeiling = true;
          hitTiles.push(tile);
        }
      }
    }
  }

  return { x, y, vx, vy, grounded, hitCeiling, hitTiles };
}
