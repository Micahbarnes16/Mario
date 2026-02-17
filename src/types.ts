export const TILE_SIZE = 32;
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 512;
export const GRAVITY = 0.6;
export const MAX_FALL_SPEED = 12;
export const PLAYER_SPEED = 3.5;
export const PLAYER_JUMP = -11;
export const PLAYER_WIDTH = 24;
export const PLAYER_HEIGHT_SMALL = 30;
export const PLAYER_HEIGHT_BIG = 56;
export const COYOTE_TIME = 6; // frames
export const ENEMY_SPEED = 1;

export type GameState = "menu" | "playing" | "gameover" | "levelcomplete" | "win";
export type PlayerPowerState = "small" | "big" | "fire";
export type Direction = -1 | 0 | 1;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type TileType = "ground" | "brick" | "question" | "platform" | "flag" | "empty" | "mushroom_block";

export interface Tile {
  type: TileType;
  x: number;
  y: number;
  broken: boolean;
  hit: boolean;
  containsCoin: boolean;
  containsMushroom: boolean;
}
