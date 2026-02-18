import { describe, it, expect } from "bun:test";
import { calcTimeBonus, incrementCombo, resetCombo } from "../scoring";

describe("calcTimeBonus", () => {
  it("returns 100 points per second", () => {
    expect(calcTimeBonus(30)).toBe(3000);
  });

  it("caps at 5000", () => {
    expect(calcTimeBonus(60)).toBe(5000);
    expect(calcTimeBonus(300)).toBe(5000);
  });

  it("returns 0 when no time remains", () => {
    expect(calcTimeBonus(0)).toBe(0);
  });

  it("floors fractional seconds", () => {
    expect(calcTimeBonus(10.9)).toBe(1000);
  });
});

describe("incrementCombo", () => {
  it("increments combo by 1", () => {
    expect(incrementCombo(1)).toBe(2);
    expect(incrementCombo(2)).toBe(3);
    expect(incrementCombo(3)).toBe(4);
  });

  it("caps at 4", () => {
    expect(incrementCombo(4)).toBe(4);
  });
});

describe("resetCombo", () => {
  it("returns 1", () => {
    expect(resetCombo()).toBe(1);
  });
});
