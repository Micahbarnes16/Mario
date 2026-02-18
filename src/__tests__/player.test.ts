import { describe, it, expect } from "bun:test";
import { Player } from "../player";
import { Tile, PLAYER_HEIGHT_SMALL, PLAYER_HEIGHT_BIG } from "../types";

// Stub window for Input constructor used inside Player
(globalThis as unknown as Record<string, unknown>).window = {
  addEventListener: () => {},
};

function makeEmptyTile(x: number, y: number): Tile {
  return { type: "empty", x, y, broken: false, hit: false, containsCoin: false, containsMushroom: false };
}

function makeGroundTile(x: number, y: number): Tile {
  return { type: "ground", x, y, broken: false, hit: false, containsCoin: false, containsMushroom: false };
}

// 10×10 grid, ground on row 9
function makeTestTiles(): Tile[][] {
  const tiles: Tile[][] = [];
  for (let r = 0; r < 10; r++) {
    tiles[r] = [];
    for (let c = 0; c < 10; c++) {
      tiles[r][c] = r === 9 ? makeGroundTile(c, r) : makeEmptyTile(c, r);
    }
  }
  return tiles;
}

describe("Player", () => {
  describe("initial state", () => {
    it("starts small with 3 lives", () => {
      const p = new Player(0, 0);
      expect(p.power).toBe("small");
      expect(p.lives).toBe(3);
      expect(p.score).toBe(0);
      expect(p.coins).toBe(0);
    });
  });

  describe("grow()", () => {
    it("small → big", () => {
      const p = new Player(0, 200);
      p.grow();
      expect(p.power).toBe("big");
    });

    it("big → fire", () => {
      const p = new Player(0, 200);
      p.grow();
      p.grow();
      expect(p.power).toBe("fire");
    });

    it("adjusts y position when growing to big", () => {
      const p = new Player(0, 200);
      const origY = p.y;
      p.grow();
      expect(p.y).toBe(origY - (PLAYER_HEIGHT_BIG - PLAYER_HEIGHT_SMALL));
    });
  });

  describe("die()", () => {
    it("big player shrinks to small on first death", () => {
      const p = new Player(0, 200);
      p.grow(); // now big
      p.die();
      expect(p.power).toBe("small");
      expect(p.dead).toBe(false);
      expect(p.invincibleTimer).toBeGreaterThan(0);
    });

    it("small player becomes dead and loses a life", () => {
      const p = new Player(0, 200);
      const livesBefore = p.lives;
      p.die();
      expect(p.dead).toBe(true);
      expect(p.lives).toBe(livesBefore - 1);
    });

    it("does not kill again while invincible", () => {
      const p = new Player(0, 200);
      p.grow();
      p.die(); // shrinks to small
      const livesBefore = p.lives;
      p.die(); // should be ignored (invincible)
      expect(p.lives).toBe(livesBefore);
      expect(p.dead).toBe(false);
    });

    it("does not re-kill already dead player", () => {
      const p = new Player(0, 200);
      p.die();
      const livesBefore = p.lives;
      p.die(); // already dead
      expect(p.lives).toBe(livesBefore);
    });
  });

  describe("addScore()", () => {
    it("adds points to score", () => {
      const p = new Player(0, 0);
      p.addScore(200);
      expect(p.score).toBe(200);
      p.addScore(100);
      expect(p.score).toBe(300);
    });
  });

  describe("addCoin()", () => {
    it("adds 100 to score per coin", () => {
      const p = new Player(0, 0);
      p.addCoin();
      expect(p.score).toBe(100);
      expect(p.coins).toBe(1);
    });

    it("grants extra life at 100 coins", () => {
      const p = new Player(0, 0);
      const livesBefore = p.lives;
      for (let i = 0; i < 100; i++) p.addCoin();
      expect(p.lives).toBe(livesBefore + 1);
      expect(p.coins).toBe(0); // coins reset to 0
    });
  });

  describe("reset()", () => {
    it("resets position and movement state without changing score/lives", () => {
      const p = new Player(100, 200);
      p.addScore(500);
      p.lives = 2;
      p.reset(50, 100);
      expect(p.x).toBe(50);
      expect(p.y).toBe(100);
      expect(p.vx).toBe(0);
      expect(p.vy).toBe(0);
      expect(p.dead).toBe(false);
      expect(p.score).toBe(500); // preserved
      expect(p.lives).toBe(2);   // preserved
    });
  });
});
