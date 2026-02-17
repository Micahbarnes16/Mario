import { Rect, TILE_SIZE, ENEMY_SPEED } from "./types";
import { applyGravity, rectsOverlap, isSolid, tileRect } from "./physics";
import { Tile } from "./types";

export class Enemy {
  x: number;
  y: number;
  vx: number;
  vy = 0;
  w = 28;
  h = 28;
  alive = true;
  type: string;
  shell = false;
  shellMoving = false;
  stompTimer = 0;

  constructor(x: number, y: number, type: string) {
    this.x = x * TILE_SIZE + 2;
    this.y = y * TILE_SIZE + (TILE_SIZE - 28);
    this.type = type;
    this.vx = -ENEMY_SPEED;
    if (type === "koopa") {
      this.h = 36;
      this.y = y * TILE_SIZE + (TILE_SIZE - 36);
    }
  }

  get rect(): Rect {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  update(tiles: Tile[][], levelWidth: number, levelHeight: number) {
    if (!this.alive && !this.shell) {
      this.stompTimer++;
      return;
    }

    if (this.shell && !this.shellMoving) return;

    this.vy = applyGravity(this.vy);

    // Move X
    this.x += this.vx;
    // Tile collision X
    const txStart = Math.max(0, Math.floor(this.x / TILE_SIZE));
    const txEnd = Math.min(levelWidth - 1, Math.floor((this.x + this.w - 1) / TILE_SIZE));
    const tyStart = Math.max(0, Math.floor(this.y / TILE_SIZE));
    const tyEnd = Math.min(levelHeight - 1, Math.floor((this.y + this.h - 1) / TILE_SIZE));

    for (let ty = tyStart; ty <= tyEnd; ty++) {
      for (let tx = txStart; tx <= txEnd; tx++) {
        const tile = tiles[ty]?.[tx];
        if (!tile || !isSolid(tile)) continue;
        const tr = tileRect(tile);
        if (rectsOverlap(this.rect, tr)) {
          if (this.vx > 0) {
            this.x = tr.x - this.w;
          } else {
            this.x = tr.x + TILE_SIZE;
          }
          this.vx = -this.vx;
        }
      }
    }

    // Move Y
    this.y += this.vy;
    const txStart2 = Math.max(0, Math.floor(this.x / TILE_SIZE));
    const txEnd2 = Math.min(levelWidth - 1, Math.floor((this.x + this.w - 1) / TILE_SIZE));
    const tyStart2 = Math.max(0, Math.floor(this.y / TILE_SIZE));
    const tyEnd2 = Math.min(levelHeight - 1, Math.floor((this.y + this.h - 1) / TILE_SIZE));

    let onGround = false;
    for (let ty = tyStart2; ty <= tyEnd2; ty++) {
      for (let tx = txStart2; tx <= txEnd2; tx++) {
        const tile = tiles[ty]?.[tx];
        if (!tile || !isSolid(tile)) continue;
        const tr = tileRect(tile);
        if (rectsOverlap(this.rect, tr)) {
          if (this.vy > 0) {
            this.y = tr.y - this.h;
            this.vy = 0;
            onGround = true;
          } else if (this.vy < 0) {
            this.y = tr.y + TILE_SIZE;
            this.vy = 0;
          }
        }
      }
    }

    // Turn at platform edges (only for non-shell enemies)
    if (onGround && !this.shell) {
      const checkX = this.vx > 0 ? this.x + this.w : this.x - 1;
      const belowTileX = Math.floor(checkX / TILE_SIZE);
      const belowTileY = Math.floor((this.y + this.h + 2) / TILE_SIZE);
      const belowTile = tiles[belowTileY]?.[belowTileX];
      if (!belowTile || !isSolid(belowTile)) {
        this.vx = -this.vx;
      }
    }

    // Remove if fallen
    if (this.y > levelHeight * TILE_SIZE + 100) {
      this.alive = false;
    }
  }

  stomp() {
    if (this.type === "koopa" && !this.shell) {
      this.shell = true;
      this.shellMoving = false;
      this.vx = 0;
      this.h = 24;
      this.y += 12;
    } else if (this.shell && !this.shellMoving) {
      this.shellMoving = true;
      this.vx = 5;
    } else {
      this.alive = false;
      this.stompTimer = 0;
    }
  }
}

export class Coin {
  x: number;
  y: number;
  w = 20;
  h = 24;
  collected = false;
  animFrame = 0;

  constructor(x: number, y: number) {
    this.x = x * TILE_SIZE + 6;
    this.y = y * TILE_SIZE + 4;
  }

  get rect(): Rect {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  update() {
    this.animFrame++;
  }
}

export class Mushroom {
  x: number;
  y: number;
  vx = 2;
  vy = 0;
  w = 28;
  h = 28;
  active = false;
  collected = false;
  emergeTimer = 0;
  startY: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.startY = y;
  }

  get rect(): Rect {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  spawn() {
    this.active = true;
    this.emergeTimer = 20;
  }

  update(tiles: Tile[][], levelWidth: number, levelHeight: number) {
    if (!this.active || this.collected) return;

    if (this.emergeTimer > 0) {
      this.y -= 1.5;
      this.emergeTimer--;
      return;
    }

    this.vy = applyGravity(this.vy);
    this.x += this.vx;

    // Tile collision X
    const txStart = Math.max(0, Math.floor(this.x / TILE_SIZE));
    const txEnd = Math.min(levelWidth - 1, Math.floor((this.x + this.w - 1) / TILE_SIZE));
    const tyStart = Math.max(0, Math.floor(this.y / TILE_SIZE));
    const tyEnd = Math.min(levelHeight - 1, Math.floor((this.y + this.h - 1) / TILE_SIZE));

    for (let ty = tyStart; ty <= tyEnd; ty++) {
      for (let tx = txStart; tx <= txEnd; tx++) {
        const tile = tiles[ty]?.[tx];
        if (!tile || !isSolid(tile)) continue;
        const tr = tileRect(tile);
        if (rectsOverlap(this.rect, tr)) {
          if (this.vx > 0) this.x = tr.x - this.w;
          else this.x = tr.x + TILE_SIZE;
          this.vx = -this.vx;
        }
      }
    }

    this.y += this.vy;
    const txStart2 = Math.max(0, Math.floor(this.x / TILE_SIZE));
    const txEnd2 = Math.min(levelWidth - 1, Math.floor((this.x + this.w - 1) / TILE_SIZE));
    const tyStart2 = Math.max(0, Math.floor(this.y / TILE_SIZE));
    const tyEnd2 = Math.min(levelHeight - 1, Math.floor((this.y + this.h - 1) / TILE_SIZE));

    for (let ty = tyStart2; ty <= tyEnd2; ty++) {
      for (let tx = txStart2; tx <= txEnd2; tx++) {
        const tile = tiles[ty]?.[tx];
        if (!tile || !isSolid(tile)) continue;
        const tr = tileRect(tile);
        if (rectsOverlap(this.rect, tr)) {
          if (this.vy > 0) {
            this.y = tr.y - this.h;
            this.vy = 0;
          } else {
            this.y = tr.y + TILE_SIZE;
            this.vy = 0;
          }
        }
      }
    }
  }
}

export class Fireball {
  x: number;
  y: number;
  vx: number;
  vy = 0;
  w = 12;
  h = 12;
  active = true;
  bounceCount = 0;

  constructor(x: number, y: number, dir: number) {
    this.x = x;
    this.y = y;
    this.vx = dir * 6;
  }

  get rect(): Rect {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  update(tiles: Tile[][], levelWidth: number, levelHeight: number) {
    if (!this.active) return;

    this.vy = applyGravity(this.vy);
    this.x += this.vx;

    // Tile X
    const txS = Math.max(0, Math.floor(this.x / TILE_SIZE));
    const txE = Math.min(levelWidth - 1, Math.floor((this.x + this.w - 1) / TILE_SIZE));
    const tyS = Math.max(0, Math.floor(this.y / TILE_SIZE));
    const tyE = Math.min(levelHeight - 1, Math.floor((this.y + this.h - 1) / TILE_SIZE));
    for (let ty = tyS; ty <= tyE; ty++) {
      for (let tx = txS; tx <= txE; tx++) {
        const tile = tiles[ty]?.[tx];
        if (!tile || !isSolid(tile)) continue;
        const tr = tileRect(tile);
        if (rectsOverlap(this.rect, tr)) {
          this.active = false;
          return;
        }
      }
    }

    this.y += this.vy;
    const txS2 = Math.max(0, Math.floor(this.x / TILE_SIZE));
    const txE2 = Math.min(levelWidth - 1, Math.floor((this.x + this.w - 1) / TILE_SIZE));
    const tyS2 = Math.max(0, Math.floor(this.y / TILE_SIZE));
    const tyE2 = Math.min(levelHeight - 1, Math.floor((this.y + this.h - 1) / TILE_SIZE));
    for (let ty = tyS2; ty <= tyE2; ty++) {
      for (let tx = txS2; tx <= txE2; tx++) {
        const tile = tiles[ty]?.[tx];
        if (!tile || !isSolid(tile)) continue;
        const tr = tileRect(tile);
        if (rectsOverlap(this.rect, tr)) {
          if (this.vy > 0) {
            this.y = tr.y - this.h;
            this.vy = -8;
            this.bounceCount++;
            if (this.bounceCount > 3) this.active = false;
          } else {
            this.active = false;
          }
        }
      }
    }

    if (this.y > levelHeight * TILE_SIZE + 50) this.active = false;
  }
}

export class PopupScore {
  x: number;
  y: number;
  text: string;
  timer = 0;

  constructor(x: number, y: number, text: string) {
    this.x = x;
    this.y = y;
    this.text = text;
  }

  update() {
    this.y -= 1;
    this.timer++;
  }

  get done(): boolean {
    return this.timer > 40;
  }
}
