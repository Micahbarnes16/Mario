import { Game } from "./game";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const container = document.getElementById("container") as HTMLDivElement;
const fsBtn = document.getElementById("fs-btn") as HTMLButtonElement;
const game = new Game(canvas);

// Fullscreen toggle
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

// Game loop
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
