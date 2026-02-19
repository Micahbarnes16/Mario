import { describe, it, expect } from "bun:test";
import { Input } from "../input";

// Input constructor adds window event listeners, which need a global window.
// Bun doesn't provide a browser DOM, so we stub window minimally.
(globalThis as unknown as Record<string, unknown>).window = {
  addEventListener: () => {},
};

// Helper: build a minimal GamepadButton
function btn(pressed: boolean): GamepadButton {
  return { pressed, touched: pressed, value: pressed ? 1 : 0 };
}

// Helper: build a fake Gamepad with all buttons unpressed by default
function fakeGamepad(overrides: Partial<{ axes: number[]; buttons: GamepadButton[] }> = {}): Gamepad {
  const defaultButtons: GamepadButton[] = Array.from({ length: 16 }, () => btn(false));
  return {
    id: "Fake Controller",
    index: 0,
    connected: true,
    timestamp: 0,
    mapping: "standard",
    axes: overrides.axes ?? [0, 0, 0, 0],
    buttons: overrides.buttons ?? defaultButtons,
    hapticActuators: [],
    vibrationActuator: null,
  } as unknown as Gamepad;
}

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

describe("Input.pollGamepad", () => {
  it("does not throw when navigator is absent", () => {
    delete (globalThis as unknown as Record<string, unknown>).navigator;
    const input = new Input();
    expect(() => input.pollGamepad()).not.toThrow();
  });

  it("does not throw when no gamepad is connected", () => {
    (globalThis as unknown as Record<string, unknown>).navigator = {
      getGamepads: () => [null, null, null, null],
    };
    const input = new Input();
    expect(() => input.pollGamepad()).not.toThrow();
    expect(input.left).toBe(false);
  });

  it("left stick left activates left", () => {
    (globalThis as unknown as Record<string, unknown>).navigator = {
      getGamepads: () => [fakeGamepad({ axes: [-1, 0, 0, 0] })],
    };
    const input = new Input();
    input.pollGamepad();
    expect(input.left).toBe(true);
    expect(input.right).toBe(false);
  });

  it("left stick right activates right", () => {
    (globalThis as unknown as Record<string, unknown>).navigator = {
      getGamepads: () => [fakeGamepad({ axes: [1, 0, 0, 0] })],
    };
    const input = new Input();
    input.pollGamepad();
    expect(input.right).toBe(true);
    expect(input.left).toBe(false);
  });

  it("stick within dead zone does not activate", () => {
    (globalThis as unknown as Record<string, unknown>).navigator = {
      getGamepads: () => [fakeGamepad({ axes: [0.1, 0, 0, 0] })],
    };
    const input = new Input();
    input.pollGamepad();
    expect(input.left).toBe(false);
    expect(input.right).toBe(false);
  });

  it("D-Pad left (button 14) activates left", () => {
    const buttons: GamepadButton[] = Array.from({ length: 16 }, () => btn(false));
    buttons[14] = btn(true);
    (globalThis as unknown as Record<string, unknown>).navigator = {
      getGamepads: () => [fakeGamepad({ buttons })],
    };
    const input = new Input();
    input.pollGamepad();
    expect(input.left).toBe(true);
  });

  it("D-Pad right (button 15) activates right", () => {
    const buttons: GamepadButton[] = Array.from({ length: 16 }, () => btn(false));
    buttons[15] = btn(true);
    (globalThis as unknown as Record<string, unknown>).navigator = {
      getGamepads: () => [fakeGamepad({ buttons })],
    };
    const input = new Input();
    input.pollGamepad();
    expect(input.right).toBe(true);
  });

  it("A button (button 0) activates jump and enter", () => {
    const buttons: GamepadButton[] = Array.from({ length: 16 }, () => btn(false));
    buttons[0] = btn(true);
    (globalThis as unknown as Record<string, unknown>).navigator = {
      getGamepads: () => [fakeGamepad({ buttons })],
    };
    const input = new Input();
    input.pollGamepad();
    expect(input.jump).toBe(true);
    expect(input.enter).toBe(true);
  });

  it("D-Pad up (button 12) activates jump", () => {
    const buttons: GamepadButton[] = Array.from({ length: 16 }, () => btn(false));
    buttons[12] = btn(true);
    (globalThis as unknown as Record<string, unknown>).navigator = {
      getGamepads: () => [fakeGamepad({ buttons })],
    };
    const input = new Input();
    input.pollGamepad();
    expect(input.jump).toBe(true);
  });

  it("B button (button 1) activates fire", () => {
    const buttons: GamepadButton[] = Array.from({ length: 16 }, () => btn(false));
    buttons[1] = btn(true);
    (globalThis as unknown as Record<string, unknown>).navigator = {
      getGamepads: () => [fakeGamepad({ buttons })],
    };
    const input = new Input();
    input.pollGamepad();
    expect(input.fire).toBe(true);
  });

  it("Start button (button 9) activates enter", () => {
    const buttons: GamepadButton[] = Array.from({ length: 16 }, () => btn(false));
    buttons[9] = btn(true);
    (globalThis as unknown as Record<string, unknown>).navigator = {
      getGamepads: () => [fakeGamepad({ buttons })],
    };
    const input = new Input();
    input.pollGamepad();
    expect(input.enter).toBe(true);
  });

  it("gamepad state clears after no pad connected", () => {
    const buttons: GamepadButton[] = Array.from({ length: 16 }, () => btn(false));
    buttons[0] = btn(true);
    (globalThis as unknown as Record<string, unknown>).navigator = {
      getGamepads: () => [fakeGamepad({ buttons })],
    };
    const input = new Input();
    input.pollGamepad();
    expect(input.jump).toBe(true);

    // Disconnect
    (globalThis as unknown as Record<string, unknown>).navigator = {
      getGamepads: () => [null, null, null, null],
    };
    input.pollGamepad();
    expect(input.jump).toBe(false);
  });
});
