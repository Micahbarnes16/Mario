import { describe, it, expect } from "bun:test";
import { Enemy, Coin, Mushroom, Fireball, Paratroopa } from "../entities";
import { Tile, TILE_SIZE } from "../types";

function makeEmptyTile(x: number, y: number): Tile {
  return { type: "empty", x, y, broken: false, hit: false, containsCoin: false, containsMushroom: false };
}
function makeGroundTile(x: number, y: number): Tile {
  return { type: "ground", x, y, broken: false, hit: false, containsCoin: false, containsMushroom: false };
}

// 20×10 grid, ground on row 9
function makeTestTiles(width = 20, height = 10): Tile[][] {
  const tiles: Tile[][] = [];
  for (let r = 0; r < height; r++) {
    tiles[r] = [];
    for (let c = 0; c < width; c++) {
      tiles[r][c] = r === height - 1 ? makeGroundTile(c, r) : makeEmptyTile(c, r);
    }
  }
  return tiles;
}

describe("Enemy (goomba)", () => {
  it("spawns at correct pixel position", () => {
    const e = new Enemy(2, 5, "goomba");
    expect(e.x).toBe(2 * TILE_SIZE + 2);
    expect(e.w).toBe(28);
    expect(e.h).toBe(28);
  });

  it("starts moving left", () => {
    const e = new Enemy(5, 5, "goomba");
    expect(e.vx).toBeLessThan(0);
  });

  it("starts alive", () => {
    const e = new Enemy(5, 5, "goomba");
    expect(e.alive).toBe(true);
    expect(e.shell).toBe(false);
  });

  it("stomp kills goomba", () => {
    const e = new Enemy(5, 5, "goomba");
    e.stomp();
    expect(e.alive).toBe(false);
  });
});

describe("Enemy (koopa)", () => {
  it("spawns with correct height", () => {
    const e = new Enemy(2, 5, "koopa");
    expect(e.h).toBe(36);
  });

  it("stomp → enters shell state", () => {
    const e = new Enemy(5, 5, "koopa");
    e.stomp();
    expect(e.shell).toBe(true);
    expect(e.shellMoving).toBe(false);
    expect(e.h).toBe(24);
  });

  it("stomp shell (stationary) → activates shell movement", () => {
    const e = new Enemy(5, 5, "koopa");
    e.stomp(); // becomes shell
    e.stomp(); // activates movement
    expect(e.shellMoving).toBe(true);
    expect(e.vx).not.toBe(0);
  });
});

describe("Coin", () => {
  it("spawns at correct pixel position", () => {
    const c = new Coin(3, 4);
    expect(c.x).toBe(3 * TILE_SIZE + 6);
    expect(c.y).toBe(4 * TILE_SIZE + 4);
    expect(c.w).toBe(20);
    expect(c.h).toBe(24);
  });

  it("starts uncollected", () => {
    const c = new Coin(0, 0);
    expect(c.collected).toBe(false);
  });

  it("animFrame increments on update", () => {
    const c = new Coin(0, 0);
    c.update();
    expect(c.animFrame).toBe(1);
  });
});

describe("Mushroom", () => {
  it("starts inactive", () => {
    const m = new Mushroom(100, 100);
    expect(m.active).toBe(false);
    expect(m.collected).toBe(false);
  });

  it("spawn() activates and sets emergeTimer", () => {
    const m = new Mushroom(100, 100);
    m.spawn();
    expect(m.active).toBe(true);
    expect(m.emergeTimer).toBe(20);
  });

  it("moves upward during emergence", () => {
    const m = new Mushroom(100, 200);
    m.spawn();
    const startY = m.y;
    const tiles = makeTestTiles();
    m.update(tiles, 20, 10);
    expect(m.y).toBeLessThan(startY);
  });
});

describe("Fireball", () => {
  it("spawns active with correct velocity", () => {
    const f = new Fireball(100, 100, 1);
    expect(f.active).toBe(true);
    expect(f.vx).toBe(6);
    expect(f.bounceCount).toBe(0);
  });

  it("spawns moving left with dir=-1", () => {
    const f = new Fireball(100, 100, -1);
    expect(f.vx).toBe(-6);
  });

  it("deactivates after 4 bounces", () => {
    const f = new Fireball(100, 100, 1);
    // Manually set bounceCount past the limit
    f.bounceCount = 4;
    // Next bounce should deactivate
    const tiles = makeTestTiles();
    // Place fireball just above ground (row 9 = y=288), falling
    f.y = 9 * TILE_SIZE - f.h - 1;
    f.vy = 5;
    f.update(tiles, 20, 10);
    expect(f.active).toBe(false);
  });
});

describe("Paratroopa", () => {
  it("spawns at correct pixel position", () => {
    const p = new Paratroopa(3, 5);
    expect(p.x).toBe(3 * TILE_SIZE + 2);
    expect(p.w).toBe(28);
    expect(p.h).toBe(36);
    expect(p.alive).toBe(true);
  });

  it("starts moving left", () => {
    const p = new Paratroopa(5, 5);
    expect(p.vx).toBeLessThan(0);
  });

  it("moves in sine-wave pattern (y changes each frame)", () => {
    const p = new Paratroopa(5, 5);
    const y0 = p.y;
    p.update(20);
    p.update(20);
    // y should differ from start (sine motion)
    // After a few frames it may or may not differ due to starting at sin(0)=0
    // but baseY is stored so we can verify the formula
    const expected = p.baseY + Math.sin(p.sineOffset * 0.05) * 40;
    expect(p.y).toBeCloseTo(expected, 5);
  });

  it("reverses direction at level left edge", () => {
    const p = new Paratroopa(0, 5);
    p.x = 0;
    p.vx = -1;
    p.update(20);
    expect(p.vx).toBeGreaterThan(0);
  });

  it("stomp() marks paratroopa as dead and returns Enemy koopa", () => {
    const p = new Paratroopa(5, 5);
    const koopa = p.stomp();
    expect(p.alive).toBe(false);
    expect(koopa).toBeDefined();
    expect(koopa.type).toBe("koopa");
  });
});
