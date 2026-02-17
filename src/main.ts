import { Game } from "./game";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const container = document.getElementById("container") as HTMLDivElement;
const fsBtn = document.getElementById("fs-btn") as HTMLButtonElement;
const game = new Game(canvas);

// ── Fullscreen ─────────────────────────────────────────
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    container.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen();
  }
}

document.addEventListener("fullscreenchange", () => {
  fsBtn.textContent = document.fullscreenElement ? "✕ Exit Fullscreen" : "⛶ Fullscreen";
});

fsBtn.addEventListener("click", toggleFullscreen);

window.addEventListener("keydown", (e) => {
  if (e.code === "KeyF") toggleFullscreen();
});

// ── Virtual controls ────────────────────────────────────
// Uses Pointer Events so it works for both touch and mouse.
// setPointerCapture keeps the button active even if the finger
// drifts slightly off-edge; pointerup/cancel releases it.
type TouchAction = "left" | "right" | "jump" | "fire";

function wireButton(id: string, action: TouchAction) {
  const btn = document.getElementById(id);
  if (!btn) return;

  btn.addEventListener("pointerdown", (e: Event) => {
    const pe = e as PointerEvent;
    pe.preventDefault();
    (pe.target as HTMLElement).setPointerCapture(pe.pointerId);
    btn.classList.add("pressed");
    game.input.setTouch(action, true);
  });

  const release = (e: Event) => {
    const pe = e as PointerEvent;
    pe.preventDefault();
    btn.classList.remove("pressed");
    game.input.setTouch(action, false);
  };

  btn.addEventListener("pointerup", release);
  btn.addEventListener("pointercancel", release);
}

wireButton("btn-left",  "left");
wireButton("btn-right", "right");
wireButton("btn-jump",  "jump");
wireButton("btn-fire",  "fire");

// ── Game loop ───────────────────────────────────────────
let lastTime = 0;
const FRAME_TIME = 1000 / 60;

function gameLoop(timestamp: number) {
  const delta = timestamp - lastTime;

  if (delta >= FRAME_TIME) {
    lastTime = timestamp - (delta % FRAME_TIME);
    game.update();
    game.draw();
  }

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
