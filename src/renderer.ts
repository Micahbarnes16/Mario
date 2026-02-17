import { Camera } from "./camera";
import { Player } from "./player";
import { Enemy, Coin, Mushroom, Fireball, PopupScore } from "./entities";
import { Tile, TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, GameState } from "./types";

const COLORS: Record<string, string> = {
  ground: "#8B4513",
  brick: "#CD853F",
  question: "#FFD700",
  question_hit: "#8B7355",
  platform: "#8B4513",
  mushroom_block: "#FFD700",
  flag: "#00FF00",
  sky: "#6185F8",
  player_small: "#E82020",
  player_big: "#E82020",
  player_fire: "#FFFFFF",
  enemy_goomba: "#8B4513",
  enemy_koopa: "#228B22",
  shell: "#228B22",
  coin: "#FFD700",
  mushroom_item: "#FF4500",
  fireball: "#FF6600",
};

export class Renderer {
  private ctx: CanvasRenderingContext2D;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
  }

  clear() {
    this.ctx.fillStyle = COLORS.sky;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  drawTiles(tiles: Tile[][], camera: Camera) {
    const startCol = Math.max(0, Math.floor(camera.x / TILE_SIZE));
    const endCol = Math.min(tiles[0]?.length ?? 0, Math.ceil((camera.x + CANVAS_WIDTH) / TILE_SIZE) + 1);
    const startRow = Math.max(0, Math.floor(camera.y / TILE_SIZE));
    const endRow = Math.min(tiles.length, Math.ceil((camera.y + CANVAS_HEIGHT) / TILE_SIZE) + 1);

    for (let r = startRow; r < endRow; r++) {
      for (let c = startCol; c < endCol; c++) {
        const tile = tiles[r]?.[c];
        if (!tile || tile.type === "empty") continue;
        if (tile.type === "brick" && tile.broken) continue;

        const sx = tile.x * TILE_SIZE - camera.x;
        const sy = tile.y * TILE_SIZE - camera.y;

        if (tile.type === "question" || tile.type === "mushroom_block") {
          this.ctx.fillStyle = tile.hit ? COLORS.question_hit : COLORS.question;
          this.ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
          if (!tile.hit) {
            this.ctx.fillStyle = "#000";
            this.ctx.font = "bold 18px monospace";
            this.ctx.textAlign = "center";
            this.ctx.fillText("?", sx + TILE_SIZE / 2, sy + TILE_SIZE / 2 + 6);
          }
        } else if (tile.type === "flag") {
          // Flag pole
          this.ctx.fillStyle = "#666";
          this.ctx.fillRect(sx + 14, sy, 4, TILE_SIZE);
          this.ctx.fillStyle = COLORS.flag;
          this.ctx.fillRect(sx + 18, sy + 2, 12, 10);
        } else if (tile.type === "ground") {
          this.ctx.fillStyle = COLORS.ground;
          this.ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
          // Grass on top
          this.ctx.fillStyle = "#4CAF50";
          this.ctx.fillRect(sx, sy, TILE_SIZE, 4);
        } else {
          this.ctx.fillStyle = COLORS[tile.type] ?? "#888";
          this.ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        }

        // Brick lines
        if (tile.type === "brick" || tile.type === "platform") {
          this.ctx.strokeStyle = "#00000033";
          this.ctx.strokeRect(sx, sy, TILE_SIZE, TILE_SIZE);
          this.ctx.beginPath();
          this.ctx.moveTo(sx + TILE_SIZE / 2, sy);
          this.ctx.lineTo(sx + TILE_SIZE / 2, sy + TILE_SIZE);
          this.ctx.moveTo(sx, sy + TILE_SIZE / 2);
          this.ctx.lineTo(sx + TILE_SIZE, sy + TILE_SIZE / 2);
          this.ctx.stroke();
        }
      }
    }
  }

  drawPlayer(player: Player, camera: Camera) {
    if (player.dead && player.deathTimer > 60) return;
    if (player.invincibleTimer > 0 && Math.floor(player.invincibleTimer / 3) % 2 === 0) return;

    const sx = player.x - camera.x;
    const sy = player.y - camera.y;

    const color = player.power === "fire" ? COLORS.player_fire : COLORS.player_small;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(sx, sy, player.w, player.h);

    // Head
    this.ctx.fillStyle = "#FFB6C1";
    this.ctx.fillRect(sx + 4, sy + 2, player.w - 8, 12);

    // Eyes
    this.ctx.fillStyle = "#000";
    const eyeY = sy + 6;
    if (player.facing === 1) {
      this.ctx.fillRect(sx + player.w - 10, eyeY, 3, 3);
    } else {
      this.ctx.fillRect(sx + 7, eyeY, 3, 3);
    }

    // Fire hat
    if (player.power === "fire") {
      this.ctx.fillStyle = "#FF0000";
      this.ctx.fillRect(sx + 2, sy, player.w - 4, 4);
    }
  }

  drawEnemies(enemies: Enemy[], camera: Camera) {
    for (const e of enemies) {
      if (!e.alive && e.stompTimer > 20) continue;
      const sx = e.x - camera.x;
      const sy = e.y - camera.y;

      if (e.shell) {
        this.ctx.fillStyle = COLORS.shell;
        this.ctx.fillRect(sx, sy, e.w, e.h);
        this.ctx.fillStyle = "#000";
        this.ctx.fillRect(sx + 8, sy + 4, 12, 16);
      } else if (e.type === "koopa") {
        this.ctx.fillStyle = COLORS.enemy_koopa;
        this.ctx.fillRect(sx, sy, e.w, e.h);
        // Eyes
        this.ctx.fillStyle = "#FFF";
        this.ctx.fillRect(sx + 4, sy + 4, 8, 6);
        this.ctx.fillRect(sx + e.w - 12, sy + 4, 8, 6);
      } else {
        // Goomba
        if (!e.alive) {
          this.ctx.fillStyle = COLORS.enemy_goomba;
          this.ctx.fillRect(sx, sy + e.h - 8, e.w, 8);
        } else {
          this.ctx.fillStyle = COLORS.enemy_goomba;
          this.ctx.fillRect(sx, sy, e.w, e.h);
          // Eyes
          this.ctx.fillStyle = "#FFF";
          this.ctx.fillRect(sx + 4, sy + 6, 6, 6);
          this.ctx.fillRect(sx + e.w - 10, sy + 6, 6, 6);
          this.ctx.fillStyle = "#000";
          this.ctx.fillRect(sx + 6, sy + 8, 3, 3);
          this.ctx.fillRect(sx + e.w - 9, sy + 8, 3, 3);
        }
      }
    }
  }

  drawCoins(coins: Coin[], camera: Camera) {
    for (const c of coins) {
      if (c.collected) continue;
      const sx = c.x - camera.x;
      const sy = c.y - camera.y;
      const stretch = Math.abs(Math.sin(c.animFrame * 0.08));
      const w = c.w * stretch;
      this.ctx.fillStyle = COLORS.coin;
      this.ctx.fillRect(sx + (c.w - w) / 2, sy, w, c.h);
      this.ctx.fillStyle = "#DAA520";
      this.ctx.font = "bold 14px monospace";
      this.ctx.textAlign = "center";
      this.ctx.fillText("$", sx + c.w / 2, sy + c.h / 2 + 5);
    }
  }

  drawMushrooms(mushrooms: Mushroom[], camera: Camera) {
    for (const m of mushrooms) {
      if (!m.active || m.collected) continue;
      const sx = m.x - camera.x;
      const sy = m.y - camera.y;
      this.ctx.fillStyle = COLORS.mushroom_item;
      this.ctx.fillRect(sx, sy, m.w, m.h);
      // Cap
      this.ctx.fillStyle = "#FF0000";
      this.ctx.beginPath();
      this.ctx.arc(sx + m.w / 2, sy + 8, 12, Math.PI, 0);
      this.ctx.fill();
      // Spots
      this.ctx.fillStyle = "#FFF";
      this.ctx.fillRect(sx + 6, sy + 2, 5, 5);
      this.ctx.fillRect(sx + 17, sy + 2, 5, 5);
    }
  }

  drawFireballs(fireballs: Fireball[], camera: Camera) {
    for (const f of fireballs) {
      if (!f.active) continue;
      const sx = f.x - camera.x;
      const sy = f.y - camera.y;
      this.ctx.fillStyle = COLORS.fireball;
      this.ctx.beginPath();
      this.ctx.arc(sx + f.w / 2, sy + f.h / 2, f.w / 2, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = "#FFD700";
      this.ctx.beginPath();
      this.ctx.arc(sx + f.w / 2, sy + f.h / 2, f.w / 4, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  drawPopups(popups: PopupScore[], camera: Camera) {
    for (const p of popups) {
      const sx = p.x - camera.x;
      const sy = p.y - camera.y;
      const alpha = Math.max(0, 1 - p.timer / 40);
      this.ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      this.ctx.font = "bold 14px monospace";
      this.ctx.textAlign = "center";
      this.ctx.fillText(p.text, sx, sy);
    }
  }

  drawHUD(score: number, coins: number, lives: number, level: number) {
    this.ctx.fillStyle = "#FFF";
    this.ctx.font = "bold 16px monospace";
    this.ctx.textAlign = "left";
    this.ctx.fillText(`SCORE: ${String(score).padStart(6, "0")}`, 16, 28);
    this.ctx.fillText(`COINS: ${coins}`, 250, 28);
    this.ctx.fillText(`LIVES: ${lives}`, 450, 28);
    this.ctx.fillText(`WORLD: ${level + 1}`, 650, 28);
  }

  drawScreen(text: string, subtext: string) {
    this.ctx.fillStyle = "rgba(0,0,0,0.8)";
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.ctx.fillStyle = "#FFF";
    this.ctx.font = "bold 40px monospace";
    this.ctx.textAlign = "center";
    this.ctx.fillText(text, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

    this.ctx.font = "18px monospace";
    this.ctx.fillText(subtext, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  }
}
