import { describe, it, expect } from "bun:test";
import { parseLevel } from "../level";
import { TILE_SIZE } from "../types";

describe("parseLevel", () => {
  it("returns correct dimensions", () => {
    const grid = [
      "GGGG",
      "GGGG",
    ];
    const data = parseLevel(grid);
    expect(data.width).toBe(4);
    expect(data.height).toBe(2);
  });

  it("creates a tile grid matching the grid dimensions", () => {
    const grid = ["GG", "GG", "GG"];
    const data = parseLevel(grid);
    expect(data.tiles.length).toBe(3);
    expect(data.tiles[0].length).toBe(2);
  });

  it("parses ground tiles correctly", () => {
    const data = parseLevel(["GG"]);
    expect(data.tiles[0][0].type).toBe("ground");
    expect(data.tiles[0][1].type).toBe("ground");
  });

  it("parses empty spaces correctly", () => {
    const data = parseLevel(["  "]);
    expect(data.tiles[0][0].type).toBe("empty");
  });

  it("parses player start (S) and sets playerStart correctly", () => {
    const data = parseLevel(["  S "]);
    expect(data.playerStart.x).toBe(2 * TILE_SIZE);
    expect(data.playerStart.y).toBe(0 * TILE_SIZE - 30);
  });

  it("replaces S tile with empty", () => {
    const data = parseLevel(["S"]);
    expect(data.tiles[0][0].type).toBe("empty");
  });

  it("extracts enemy spawns for E (goomba)", () => {
    const data = parseLevel(["GEG"]);
    expect(data.enemySpawns.length).toBe(1);
    expect(data.enemySpawns[0].type).toBe("goomba");
    expect(data.enemySpawns[0].x).toBe(1);
  });

  it("extracts enemy spawns for K (koopa)", () => {
    const data = parseLevel(["GKG"]);
    expect(data.enemySpawns.length).toBe(1);
    expect(data.enemySpawns[0].type).toBe("koopa");
  });

  it("replaces E and K with empty tiles", () => {
    const data = parseLevel(["EK"]);
    expect(data.tiles[0][0].type).toBe("empty");
    expect(data.tiles[0][1].type).toBe("empty");
  });

  it("extracts coin positions for C", () => {
    const data = parseLevel(["GCG"]);
    expect(data.coinPositions.length).toBe(1);
    expect(data.coinPositions[0].x).toBe(1);
  });

  it("parses question block with containsCoin", () => {
    const data = parseLevel(["?"]);
    expect(data.tiles[0][0].type).toBe("question");
    expect(data.tiles[0][0].containsCoin).toBe(true);
  });

  it("parses mushroom block with containsMushroom", () => {
    const data = parseLevel(["M"]);
    expect(data.tiles[0][0].type).toBe("mushroom_block");
    expect(data.tiles[0][0].containsMushroom).toBe(true);
  });

  it("parses brick tiles", () => {
    const data = parseLevel(["B"]);
    expect(data.tiles[0][0].type).toBe("brick");
  });

  it("parses platform tiles", () => {
    const data = parseLevel(["P"]);
    expect(data.tiles[0][0].type).toBe("platform");
  });

  it("parses Paratroopa (W) as enemySpawn", () => {
    const data = parseLevel(["W"]);
    expect(data.enemySpawns.length).toBe(1);
    expect(data.enemySpawns[0].type).toBe("paratroopa");
    expect(data.tiles[0][0].type).toBe("empty");
  });
});
