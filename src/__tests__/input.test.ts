import { describe, it, expect } from "bun:test";
import { Input } from "../input";

// Input constructor adds window event listeners, which need a global window.
// Bun doesn't provide a browser DOM, so we stub window minimally.
(globalThis as unknown as Record<string, unknown>).window = {
  addEventListener: () => {},
};

describe("Input", () => {
  it("all getters default to false", () => {
    const input = new Input();
    expect(input.left).toBe(false);
    expect(input.right).toBe(false);
    expect(input.jump).toBe(false);
    expect(input.fire).toBe(false);
    expect(input.enter).toBe(false);
  });

  it("setTouch('left', true) makes left return true", () => {
    const input = new Input();
    input.setTouch("left", true);
    expect(input.left).toBe(true);
  });

  it("setTouch('right', true) makes right return true", () => {
    const input = new Input();
    input.setTouch("right", true);
    expect(input.right).toBe(true);
  });

  it("setTouch('jump', true) makes jump and enter return true", () => {
    const input = new Input();
    input.setTouch("jump", true);
    expect(input.jump).toBe(true);
    expect(input.enter).toBe(true);
  });

  it("setTouch('fire', true) makes fire return true", () => {
    const input = new Input();
    input.setTouch("fire", true);
    expect(input.fire).toBe(true);
  });

  it("setTouch releases correctly", () => {
    const input = new Input();
    input.setTouch("left", true);
    input.setTouch("left", false);
    expect(input.left).toBe(false);
  });

  it("isDown returns false for unknown key", () => {
    const input = new Input();
    expect(input.isDown("RandomKey")).toBe(false);
  });
});
