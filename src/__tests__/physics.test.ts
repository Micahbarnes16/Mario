import { describe, it, expect } from "bun:test";
import { applyGravity, rectsOverlap, tileRect, isSolid, resolveCollisions } from "../physics";
import { Tile, TILE_SIZE, GRAVITY, MAX_FALL_SPEED } from "../types";

function makeTile(type: Tile["type"], x: number, y: number, overrides: Partial<Tile> = {}): Tile {
  return { type, x, y, broken: false, hit: false, containsCoin: false, containsMushroom: false, ...overrides };
}

describe("applyGravity", () => {
  it("adds GRAVITY to vy", () => {
    expect(applyGravity(0)).toBeCloseTo(GRAVITY);
    expect(applyGravity(5)).toBeCloseTo(5 + GRAVITY);
  });

  it("caps at MAX_FALL_SPEED", () => {
    expect(applyGravity(MAX_FALL_SPEED)).toBe(MAX_FALL_SPEED);
    expect(applyGravity(MAX_FALL_SPEED - 0.1)).toBe(MAX_FALL_SPEED);
  });
});

describe("rectsOverlap", () => {
  it("returns true for overlapping rects", () => {
    expect(rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 })).toBe(true);
  });

  it("returns false for non-overlapping rects", () => {
    expect(rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 20, y: 0, w: 10, h: 10 })).toBe(false);
    expect(rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 0, y: 20, w: 10, h: 10 })).toBe(false);
  });

  it("returns false for touching but not overlapping", () => {
    // Edge-to-edge (not overlapping)
    expect(rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 })).toBe(false);
  });
});

describe("tileRect", () => {
  it("converts tile grid coordinates to pixel rect", () => {
    const tile = makeTile("ground", 3, 5);
    const r = tileRect(tile);
    expect(r.x).toBe(3 * TILE_SIZE);
    expect(r.y).toBe(5 * TILE_SIZE);
    expect(r.w).toBe(TILE_SIZE);
    expect(r.h).toBe(TILE_SIZE);
  });
});

describe("isSolid", () => {
  it("returns true for solid tile types", () => {
    expect(isSolid(makeTile("ground", 0, 0))).toBe(true);
    expect(isSolid(makeTile("brick", 0, 0))).toBe(true);
    expect(isSolid(makeTile("platform", 0, 0))).toBe(true);
    expect(isSolid(makeTile("question", 0, 0))).toBe(true);
    expect(isSolid(makeTile("mushroom_block", 0, 0))).toBe(true);
  });

  it("returns false for non-solid types", () => {
    expect(isSolid(makeTile("empty", 0, 0))).toBe(false);
    expect(isSolid(makeTile("flag", 0, 0))).toBe(false);
  });

  it("returns false for broken bricks", () => {
    expect(isSolid(makeTile("brick", 0, 0, { broken: true }))).toBe(false);
  });
});

describe("resolveCollisions", () => {
  function makeTileGrid(width: number, height: number, solidRows: number[]): Tile[][] {
    const tiles: Tile[][] = [];
    for (let r = 0; r < height; r++) {
      tiles[r] = [];
      for (let c = 0; c < width; c++) {
        tiles[r][c] = makeTile(solidRows.includes(r) ? "ground" : "empty", c, r);
      }
    }
    return tiles;
  }

  it("stops entity at ground and sets grounded", () => {
    const tiles = makeTileGrid(10, 5, [4]); // ground at row 4
    const rect = { x: 64, y: 90, w: 24, h: 30 }; // falling into row 3, almost at row 4
    const result = resolveCollisions(rect, 0, 10, tiles, 10, 5);
    expect(result.grounded).toBe(true);
    expect(result.vy).toBe(0);
    expect(result.y).toBe(4 * TILE_SIZE - rect.h); // landed on top of ground
  });

  it("stops entity at ceiling and sets hitCeiling", () => {
    const tiles = makeTileGrid(10, 5, [0]); // ceiling at row 0
    const rect = { x: 64, y: 25, w: 24, h: 30 };
    const result = resolveCollisions(rect, 0, -10, tiles, 10, 5);
    expect(result.hitCeiling).toBe(true);
    expect(result.vy).toBe(0);
  });

  it("stops horizontal movement at wall", () => {
    const tiles = makeTileGrid(10, 5, []);
    // Put a single solid tile at col 5, row 2
    tiles[2][5] = makeTile("ground", 5, 2);
    const rect = { x: 4 * TILE_SIZE, y: 2 * TILE_SIZE, w: 24, h: 30 };
    const result = resolveCollisions(rect, 10, 0, tiles, 10, 5);
    expect(result.vx).toBe(0);
    expect(result.x).toBeLessThanOrEqual(5 * TILE_SIZE - rect.w);
  });
});
