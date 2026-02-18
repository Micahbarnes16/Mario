import { describe, it, expect, mock, beforeEach } from "bun:test";
import { SoundManager } from "../sound";

// Minimal AudioContext mock
function makeMockCtx() {
  const nodes: { type: string; frequency?: number }[] = [];
  const gains: object[] = [];

  const gainNode = {
    connect: mock(() => {}),
    gain: {
      setValueAtTime: mock(() => {}),
      linearRampToValueAtTime: mock(() => {}),
    },
  };

  const oscNode = {
    connect: mock(() => {}),
    start: mock(() => {}),
    stop: mock(() => {}),
    frequency: {
      setValueAtTime: mock((f: number) => { nodes.push({ type: "osc", frequency: f }); }),
      linearRampToValueAtTime: mock(() => {}),
    },
    type: "sine" as OscillatorType,
  };

  const bufSrc = {
    connect: mock(() => {}),
    start: mock(() => {}),
    buffer: null as AudioBuffer | null,
  };

  const mockCtx = {
    state: "running" as AudioContextState,
    currentTime: 0,
    sampleRate: 44100,
    destination: {},
    resume: mock(async () => {}),
    createOscillator: mock(() => oscNode),
    createGain: mock(() => gainNode),
    createBuffer: mock((_: number, size: number, rate: number) => ({
      getChannelData: mock(() => new Float32Array(size)),
    })),
    createBufferSource: mock(() => bufSrc),
    _oscNode: oscNode,
    _gainNode: gainNode,
    _bufSrc: bufSrc,
    _nodes: nodes,
  };
  return mockCtx;
}

type MockCtx = ReturnType<typeof makeMockCtx>;

describe("SoundManager", () => {
  let manager: SoundManager;
  let mockCtx: MockCtx;

  beforeEach(() => {
    manager = new SoundManager();
    mockCtx = makeMockCtx();
    // Inject mock context
    (manager as unknown as { ctx: MockCtx }).ctx = mockCtx;
  });

  it("starts unmuted", () => {
    expect(manager.muted).toBe(false);
  });

  it("toggleMute flips muted state", () => {
    manager.toggleMute();
    expect(manager.muted).toBe(true);
    manager.toggleMute();
    expect(manager.muted).toBe(false);
  });

  it("does not create oscillator when muted", () => {
    manager.toggleMute();
    manager.play("jump");
    expect(mockCtx.createOscillator.mock.calls.length).toBe(0);
  });

  it("play('jump') creates an oscillator", () => {
    manager.play("jump");
    expect(mockCtx.createOscillator.mock.calls.length).toBeGreaterThan(0);
  });

  it("play('coin') creates two oscillators", () => {
    manager.play("coin");
    expect(mockCtx.createOscillator.mock.calls.length).toBe(2);
  });

  it("play('stomp') creates a buffer source", () => {
    manager.play("stomp");
    expect(mockCtx.createBufferSource.mock.calls.length).toBe(1);
  });

  it("play('powerup') creates four oscillators", () => {
    manager.play("powerup");
    expect(mockCtx.createOscillator.mock.calls.length).toBe(4);
  });

  it("play('death') creates oscillators", () => {
    manager.play("death");
    expect(mockCtx.createOscillator.mock.calls.length).toBeGreaterThan(0);
  });

  it("play('levelcomplete') creates oscillators", () => {
    manager.play("levelcomplete");
    expect(mockCtx.createOscillator.mock.calls.length).toBeGreaterThan(0);
  });

  it("resumes suspended context", () => {
    mockCtx.state = "suspended";
    manager.play("jump");
    expect(mockCtx.resume.mock.calls.length).toBe(1);
  });
});
