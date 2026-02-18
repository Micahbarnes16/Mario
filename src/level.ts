import { Tile, TileType, TILE_SIZE } from "./types";

const CHAR_MAP: Record<string, { type: TileType; containsCoin?: boolean; containsMushroom?: boolean }> = {
  G: { type: "ground" },
  P: { type: "platform" },
  B: { type: "brick" },
  "?": { type: "question", containsCoin: true },
  M: { type: "mushroom_block", containsMushroom: true },
  F: { type: "flag" },
  " ": { type: "empty" },
};

export interface LevelData {
  tiles: Tile[][];
  width: number;
  height: number;
  playerStart: { x: number; y: number };
  enemySpawns: { x: number; y: number; type: string }[];
  coinPositions: { x: number; y: number }[];
}

export function parseLevel(grid: string[]): LevelData {
  const height = grid.length;
  const width = Math.max(...grid.map((r) => r.length));
  const tiles: Tile[][] = [];
  const enemySpawns: { x: number; y: number; type: string }[] = [];
  const coinPositions: { x: number; y: number }[] = [];
  let playerStart = { x: 2 * TILE_SIZE, y: 0 };

  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    for (let x = 0; x < width; x++) {
      const ch = grid[y]?.[x] ?? " ";

      if (ch === "E") {
        enemySpawns.push({ x, y, type: "goomba" });
        tiles[y][x] = { type: "empty", x, y, broken: false, hit: false, containsCoin: false, containsMushroom: false };
        continue;
      }
      if (ch === "K") {
        enemySpawns.push({ x, y, type: "koopa" });
        tiles[y][x] = { type: "empty", x, y, broken: false, hit: false, containsCoin: false, containsMushroom: false };
        continue;
      }
      if (ch === "W") {
        enemySpawns.push({ x, y, type: "paratroopa" });
        tiles[y][x] = { type: "empty", x, y, broken: false, hit: false, containsCoin: false, containsMushroom: false };
        continue;
      }
      if (ch === "C") {
        coinPositions.push({ x, y });
        tiles[y][x] = { type: "empty", x, y, broken: false, hit: false, containsCoin: false, containsMushroom: false };
        continue;
      }
      if (ch === "S") {
        playerStart = { x: x * TILE_SIZE, y: y * TILE_SIZE - 30 };
        tiles[y][x] = { type: "empty", x, y, broken: false, hit: false, containsCoin: false, containsMushroom: false };
        continue;
      }

      const mapped = CHAR_MAP[ch] ?? { type: "empty" as TileType };
      tiles[y][x] = {
        type: mapped.type,
        x,
        y,
        broken: false,
        hit: false,
        containsCoin: mapped.containsCoin ?? false,
        containsMushroom: mapped.containsMushroom ?? false,
      };
    }
  }

  return { tiles, width, height, playerStart, enemySpawns, coinPositions };
}
