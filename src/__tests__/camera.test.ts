import { describe, it, expect } from "bun:test";
import { Camera } from "../camera";
import { CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE } from "../types";

describe("Camera", () => {
  it("starts at (0,0)", () => {
    const cam = new Camera();
    expect(cam.x).toBe(0);
    expect(cam.y).toBe(0);
  });

  it("follows target with offset", () => {
    const cam = new Camera();
    const levelW = 50; // tiles
    const levelH = 16;
    cam.update(400, 256, levelW, levelH);
    // Expected: targetX - CANVAS_WIDTH/3 = 400 - 800/3 ≈ 133
    expect(cam.x).toBeCloseTo(400 - CANVAS_WIDTH / 3, 0);
    // Expected: targetY - CANVAS_HEIGHT*0.6 = 256 - 307 ≈ clamped to 0
    // (256 - 307 = -51 → clamped to 0)
    expect(cam.y).toBe(0);
  });

  it("clamps x to 0 when target is near left edge", () => {
    const cam = new Camera();
    cam.update(0, 256, 50, 16);
    expect(cam.x).toBe(0);
  });

  it("clamps x to max when target is near right edge", () => {
    const cam = new Camera();
    const levelW = 50;
    cam.update(99999, 0, levelW, 16);
    const maxX = levelW * TILE_SIZE - CANVAS_WIDTH;
    expect(cam.x).toBe(maxX);
  });

  it("clamps y to 0 when result would be negative", () => {
    const cam = new Camera();
    cam.update(100, 0, 50, 16);
    expect(cam.y).toBe(0);
  });

  it("clamps y to max when result exceeds level bounds", () => {
    const cam = new Camera();
    const levelH = 16;
    cam.update(100, 99999, 50, levelH);
    const maxY = levelH * TILE_SIZE - CANVAS_HEIGHT;
    expect(cam.y).toBe(Math.max(0, maxY));
  });
});
