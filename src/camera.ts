import { CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE } from "./types";

export class Camera {
  x = 0;
  y = 0;

  update(
    targetX: number,
    targetY: number,
    levelWidth: number,
    levelHeight: number
  ) {
    // Center on target, clamped to level bounds
    const levelPixelW = levelWidth * TILE_SIZE;
    const levelPixelH = levelHeight * TILE_SIZE;

    this.x = targetX - CANVAS_WIDTH / 3;
    this.y = targetY - CANVAS_HEIGHT * 0.6;

    // Clamp
    this.x = Math.max(0, Math.min(this.x, levelPixelW - CANVAS_WIDTH));
    this.y = Math.max(0, Math.min(this.y, levelPixelH - CANVAS_HEIGHT));
  }
}
