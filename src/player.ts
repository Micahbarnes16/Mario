import {
  PlayerPowerState,
  Direction,
  Rect,
  PLAYER_SPEED,
  PLAYER_JUMP,
  PLAYER_WIDTH,
  PLAYER_HEIGHT_SMALL,
  PLAYER_HEIGHT_BIG,
  TILE_SIZE,
  COYOTE_TIME,
} from "./types";
import { Input } from "./input";
import { applyGravity, resolveCollisions } from "./physics";
import { Tile } from "./types";

export class Player {
  x: number;
  y: number;
  vx = 0;
  vy = 0;
  power: PlayerPowerState = "small";
  facing: Direction = 1;
  grounded = false;
  lives = 3;
  score = 0;
  coins = 0;
  dead = false;
  deathTimer = 0;
  invincibleTimer = 0;
  coyoteTimer = 0;
  jumpHeld = false;
  jumpBuffered = false;
  private prevJump = false;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  get w(): number {
    return PLAYER_WIDTH;
  }

  get h(): number {
    return this.power === "small" ? PLAYER_HEIGHT_SMALL : PLAYER_HEIGHT_BIG;
  }

  get rect(): Rect {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  reset(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.grounded = false;
    this.dead = false;
    this.deathTimer = 0;
    this.coyoteTimer = 0;
    this.invincibleTimer = 0;
  }

  update(
    input: Input,
    tiles: Tile[][],
    levelWidth: number,
    levelHeight: number
  ): { hitTiles: Tile[] } {
    if (this.dead) {
      this.deathTimer++;
      this.vy = applyGravity(this.vy);
      this.y += this.vy;
      return { hitTiles: [] };
    }

    if (this.invincibleTimer > 0) this.invincibleTimer--;

    // Horizontal movement
    const accel = 0.4;
    const decel = 0.3;
    if (input.left) {
      this.vx = Math.max(this.vx - accel, -PLAYER_SPEED);
      this.facing = -1;
    } else if (input.right) {
      this.vx = Math.min(this.vx + accel, PLAYER_SPEED);
      this.facing = 1;
    } else {
      if (this.vx > 0) this.vx = Math.max(0, this.vx - decel);
      else if (this.vx < 0) this.vx = Math.min(0, this.vx + decel);
    }

    // Coyote time
    if (this.grounded) {
      this.coyoteTimer = COYOTE_TIME;
    } else {
      if (this.coyoteTimer > 0) this.coyoteTimer--;
    }

    // Jump
    const jumpPressed = input.jump && !this.prevJump;
    this.prevJump = input.jump;

    if (jumpPressed && this.coyoteTimer > 0) {
      this.vy = PLAYER_JUMP;
      this.coyoteTimer = 0;
      this.jumpHeld = true;
    }

    // Variable jump height
    if (!input.jump) {
      this.jumpHeld = false;
    }
    if (this.jumpHeld && this.vy < 0) {
      // Holding jump = keep going up
    } else if (this.vy < PLAYER_JUMP * 0.4) {
      this.vy = Math.max(this.vy, PLAYER_JUMP * 0.4);
    }

    // Gravity
    this.vy = applyGravity(this.vy);

    // Collision resolution
    const result = resolveCollisions(
      this.rect,
      this.vx,
      this.vy,
      tiles,
      levelWidth,
      levelHeight
    );
    this.x = result.x;
    this.y = result.y;
    this.vx = result.vx;
    this.vy = result.vy;
    this.grounded = result.grounded;

    // Clamp to level bounds
    if (this.x < 0) {
      this.x = 0;
      this.vx = 0;
    }
    const maxX = levelWidth * TILE_SIZE - this.w;
    if (this.x > maxX) {
      this.x = maxX;
      this.vx = 0;
    }

    return { hitTiles: result.hitTiles };
  }

  die() {
    if (this.dead) return;
    if (this.invincibleTimer > 0) return;
    if (this.power !== "small") {
      this.power = "small";
      this.invincibleTimer = 90;
      // Adjust Y so player doesn't clip into ground
      this.y += PLAYER_HEIGHT_BIG - PLAYER_HEIGHT_SMALL;
      return;
    }
    this.dead = true;
    this.vy = PLAYER_JUMP * 0.8;
    this.vx = 0;
    this.lives--;
    this.deathTimer = 0;
  }

  grow() {
    if (this.power === "small") {
      this.y -= PLAYER_HEIGHT_BIG - PLAYER_HEIGHT_SMALL;
      this.power = "big";
    } else if (this.power === "big") {
      this.power = "fire";
    }
  }

  addScore(points: number) {
    this.score += points;
  }

  addCoin() {
    this.coins++;
    this.score += 100;
    if (this.coins >= 100) {
      this.coins -= 100;
      this.lives++;
    }
  }
}
