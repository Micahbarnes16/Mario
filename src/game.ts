import { GameState, TILE_SIZE } from "./types";
import { Input } from "./input";
import { Player } from "./player";
import { Camera } from "./camera";
import { Renderer } from "./renderer";
import { parseLevel, LevelData } from "./level";
import { Enemy, Coin, Mushroom, Fireball, PopupScore, Paratroopa } from "./entities";
import { rectsOverlap } from "./physics";
import { LEVELS } from "./levels/levels";
import { SoundManager } from "./sound";
import { calcTimeBonus, incrementCombo, resetCombo } from "./scoring";

const LEVEL_TIMES = [300, 300, 300, 240, 240, 240, 200, 200];

export class Game {
  state: GameState = "menu";
  input: Input;
  player: Player;
  camera: Camera;
  renderer: Renderer;
  sound: SoundManager;
  levelIndex = 0;
  levelData!: LevelData;
  enemies: Enemy[] = [];
  paratroopas: Paratroopa[] = [];
  coins: Coin[] = [];
  mushrooms: Mushroom[] = [];
  fireballs: Fireball[] = [];
  popups: PopupScore[] = [];
  transitionTimer = 0;
  fireTimer = 0;
  combo = 1;
  highScore = 0;
  timeRemaining = 300;
  private prevGrounded = false;

  constructor(canvas: HTMLCanvasElement) {
    this.input = new Input();
    this.player = new Player(0, 0);
    this.camera = new Camera();
    this.renderer = new Renderer(canvas);
    this.sound = new SoundManager();
    this.highScore = parseInt(localStorage.getItem("marioHighScore") ?? "0", 10);
    this.loadLevel(0);
  }

  loadLevel(index: number) {
    this.levelIndex = index;
    this.levelData = parseLevel(LEVELS[index]);
    this.player.reset(this.levelData.playerStart.x, this.levelData.playerStart.y);
    this.enemies = this.levelData.enemySpawns
      .filter((s) => s.type !== "paratroopa")
      .map((s) => new Enemy(s.x, s.y, s.type));
    this.paratroopas = this.levelData.enemySpawns
      .filter((s) => s.type === "paratroopa")
      .map((s) => new Paratroopa(s.x, s.y));
    this.coins = this.levelData.coinPositions.map((c) => new Coin(c.x, c.y));
    this.mushrooms = [];
    this.fireballs = [];
    this.popups = [];
    this.combo = 1;
    this.timeRemaining = LEVEL_TIMES[index] ?? 300;
    this.camera.update(this.player.x, this.player.y, this.levelData.width, this.levelData.height);
  }

  private saveHighScore() {
    if (this.player.score > this.highScore) {
      this.highScore = this.player.score;
      localStorage.setItem("marioHighScore", String(this.highScore));
    }
  }

  update() {
    switch (this.state) {
      case "menu":
        if (this.input.enter || this.input.jump) {
          this.state = "playing";
          this.player.lives = 3;
          this.player.score = 0;
          this.player.coins = 0;
          this.player.power = "small";
          this.loadLevel(0);
        }
        break;

      case "playing":
        this.updatePlaying();
        break;

      case "gameover":
        this.transitionTimer++;
        if (this.transitionTimer > 120 && (this.input.enter || this.input.jump)) {
          this.state = "menu";
        }
        break;

      case "levelcomplete":
        this.transitionTimer++;
        if (this.transitionTimer > 90) {
          if (this.levelIndex + 1 < LEVELS.length) {
            this.loadLevel(this.levelIndex + 1);
            this.state = "playing";
          } else {
            this.saveHighScore();
            this.state = "win";
            this.transitionTimer = 0;
          }
        }
        break;

      case "win":
        this.transitionTimer++;
        if (this.transitionTimer > 120 && (this.input.enter || this.input.jump)) {
          this.state = "menu";
        }
        break;
    }
  }

  private updatePlaying() {
    const { tiles, width, height } = this.levelData;

    // Countdown timer
    this.timeRemaining -= 1 / 60;
    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      if (!this.player.dead) {
        this.player.die();
        this.sound.play("death");
      }
    }

    const wasGrounded = this.prevGrounded;
    const prevVy = this.player.vy;

    // Player update
    const { hitTiles } = this.player.update(this.input, tiles, width, height);
    this.prevGrounded = this.player.grounded;

    // Reset combo when player lands after being airborne
    if (!wasGrounded && this.player.grounded) {
      this.combo = resetCombo();
    }

    // Jump sound — velocity went negative from near-zero
    if (prevVy >= -0.5 && this.player.vy < -5 && !this.player.dead) {
      this.sound.play("jump");
    }

    // Handle blocks hit from below
    for (const tile of hitTiles) {
      if ((tile.type === "question" || tile.type === "mushroom_block") && !tile.hit) {
        tile.hit = true;
        if (tile.containsCoin) {
          this.player.addCoin();
          this.popups.push(new PopupScore(tile.x * TILE_SIZE + 16, tile.y * TILE_SIZE - 10, "100"));
          this.sound.play("coin");
        }
        if (tile.containsMushroom) {
          const m = new Mushroom(tile.x * TILE_SIZE + 2, tile.y * TILE_SIZE);
          m.spawn();
          this.mushrooms.push(m);
        }
      }
      if (tile.type === "brick" && !tile.broken) {
        if (this.player.power !== "small") {
          tile.broken = true;
          this.player.addScore(50);
        }
      }
    }

    // Fireballs
    if (this.player.power === "fire" && this.input.fire && this.fireTimer <= 0 && this.fireballs.filter(f => f.active).length < 2) {
      this.fireballs.push(new Fireball(
        this.player.x + (this.player.facing === 1 ? this.player.w : -12),
        this.player.y + this.player.h / 2,
        this.player.facing
      ));
      this.fireTimer = 15;
    }
    if (this.fireTimer > 0) this.fireTimer--;

    // Update enemies
    for (const e of this.enemies) {
      e.update(tiles, width, height);
    }

    // Update paratroopas
    for (const pt of this.paratroopas) {
      pt.update(width);
    }

    // Update coins, mushrooms, fireballs, popups
    for (const c of this.coins) c.update();
    for (const m of this.mushrooms) m.update(tiles, width, height);
    for (const f of this.fireballs) f.update(tiles, width, height);
    for (const p of this.popups) p.update();
    this.popups = this.popups.filter((p) => !p.done);

    if (!this.player.dead) {
      // Player-enemy collisions
      for (const e of this.enemies) {
        if (!e.alive && !e.shell) continue;
        if (e.shell && !e.shellMoving) continue;
        if (!rectsOverlap(this.player.rect, e.rect)) continue;

        const playerBottom = this.player.y + this.player.h;
        const enemyTop = e.y;
        const playerFalling = this.player.vy > 0;

        if (playerFalling && playerBottom - this.player.vy <= enemyTop + 10) {
          e.stomp();
          this.player.vy = -7;
          this.combo = incrementCombo(this.combo);
          const points = this.combo * 200;
          this.player.addScore(points);
          this.popups.push(new PopupScore(e.x + e.w / 2, e.y - 10, String(points)));
          this.sound.play("stomp");
        } else {
          this.player.die();
          this.combo = resetCombo();
          this.sound.play("death");
        }
      }

      // Paratroopa collisions
      for (let i = this.paratroopas.length - 1; i >= 0; i--) {
        const pt = this.paratroopas[i];
        if (!pt.alive) continue;
        if (!rectsOverlap(this.player.rect, pt.rect)) continue;

        const playerBottom = this.player.y + this.player.h;
        const ptTop = pt.y;
        const playerFalling = this.player.vy > 0;

        if (playerFalling && playerBottom - this.player.vy <= ptTop + 10) {
          const koopa = pt.stomp();
          this.paratroopas.splice(i, 1);
          this.enemies.push(koopa);
          this.player.vy = -7;
          this.combo = incrementCombo(this.combo);
          const points = this.combo * 200;
          this.player.addScore(points);
          this.popups.push(new PopupScore(pt.x + pt.w / 2, pt.y - 10, String(points)));
          this.sound.play("stomp");
        } else {
          this.player.die();
          this.combo = resetCombo();
          this.sound.play("death");
        }
      }

      // Kick shell
      for (const e of this.enemies) {
        if (!e.shell || e.shellMoving) continue;
        if (!rectsOverlap(this.player.rect, e.rect)) continue;
        e.shellMoving = true;
        e.vx = this.player.x < e.x ? 5 : -5;
      }

      // Shell-enemy collisions
      for (const shell of this.enemies) {
        if (!shell.shell || !shell.shellMoving) continue;
        for (const e of this.enemies) {
          if (e === shell || !e.alive) continue;
          if (rectsOverlap(shell.rect, e.rect)) {
            e.alive = false;
            this.player.addScore(200);
          }
        }
      }

      // Fireball-enemy collisions
      for (const f of this.fireballs) {
        if (!f.active) continue;
        for (const e of this.enemies) {
          if (!e.alive && !e.shell) continue;
          if (rectsOverlap(f.rect, e.rect)) {
            if (e.shell) { e.alive = false; e.shell = false; }
            else { e.alive = false; }
            f.active = false;
            this.player.addScore(200);
            this.popups.push(new PopupScore(e.x, e.y - 10, "200"));
            this.sound.play("stomp");
          }
        }
        // Fireball hits paratroopas
        if (!f.active) continue;
        for (let i = this.paratroopas.length - 1; i >= 0; i--) {
          const pt = this.paratroopas[i];
          if (!pt.alive) continue;
          if (rectsOverlap(f.rect, pt.rect)) {
            pt.alive = false;
            this.paratroopas.splice(i, 1);
            f.active = false;
            this.player.addScore(200);
            this.popups.push(new PopupScore(pt.x, pt.y - 10, "200"));
            this.sound.play("stomp");
            break;
          }
        }
      }

      // Coin collection
      for (const c of this.coins) {
        if (c.collected) continue;
        if (rectsOverlap(this.player.rect, c.rect)) {
          c.collected = true;
          this.player.addCoin();
          this.popups.push(new PopupScore(c.x + c.w / 2, c.y - 10, "100"));
          this.sound.play("coin");
        }
      }

      // Mushroom collection
      for (const m of this.mushrooms) {
        if (!m.active || m.collected || m.emergeTimer > 0) continue;
        if (rectsOverlap(this.player.rect, m.rect)) {
          m.collected = true;
          this.player.grow();
          this.player.addScore(1000);
          this.popups.push(new PopupScore(m.x + m.w / 2, m.y - 10, "1UP"));
          this.sound.play("powerup");
        }
      }

      // Flag check
      for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
          const tile = tiles[r]?.[c];
          if (tile?.type === "flag") {
            const flagRect = { x: c * TILE_SIZE, y: r * TILE_SIZE, w: TILE_SIZE, h: TILE_SIZE };
            if (rectsOverlap(this.player.rect, flagRect)) {
              const bonus = calcTimeBonus(this.timeRemaining);
              this.player.addScore(2000 + bonus);
              this.state = "levelcomplete";
              this.transitionTimer = 0;
              this.sound.play("levelcomplete");
              return;
            }
          }
        }
      }

      // Fall death
      if (this.player.y > height * TILE_SIZE + 50) {
        this.player.die();
        this.sound.play("death");
      }
    }

    // Handle player death
    if (this.player.dead && this.player.deathTimer > 90) {
      if (this.player.lives <= 0) {
        this.saveHighScore();
        this.state = "gameover";
        this.transitionTimer = 0;
      } else {
        this.player.power = "small";
        this.loadLevel(this.levelIndex);
      }
    }

    // Camera
    this.camera.update(this.player.x, this.player.y, width, height);

    // Clean up
    this.fireballs = this.fireballs.filter((f) => f.active);
    this.paratroopas = this.paratroopas.filter((pt) => pt.alive);
  }

  draw() {
    this.renderer.clear();

    switch (this.state) {
      case "menu":
        this.renderer.drawScreen("MARIO PLATFORMER", "Press ENTER or SPACE to Start");
        this.renderer.drawHighScore(this.highScore);
        break;

      case "playing":
        this.renderer.drawBackground(this.camera.x);
        this.renderer.drawTiles(this.levelData.tiles, this.camera);
        this.renderer.drawCoins(this.coins, this.camera);
        this.renderer.drawMushrooms(this.mushrooms, this.camera);
        this.renderer.drawEnemies(this.enemies, this.camera);
        this.renderer.drawParatroopas(this.paratroopas, this.camera);
        this.renderer.drawFireballs(this.fireballs, this.camera);
        this.renderer.drawPlayer(this.player, this.camera);
        this.renderer.drawPopups(this.popups, this.camera);
        this.renderer.drawHUD(this.player.score, this.player.coins, this.player.lives, this.levelIndex, this.timeRemaining, this.combo);
        break;

      case "gameover":
        this.renderer.drawScreen("GAME OVER", "Press ENTER to return to menu");
        break;

      case "levelcomplete":
        this.renderer.drawBackground(this.camera.x);
        this.renderer.drawTiles(this.levelData.tiles, this.camera);
        this.renderer.drawPlayer(this.player, this.camera);
        this.renderer.drawHUD(this.player.score, this.player.coins, this.player.lives, this.levelIndex, this.timeRemaining, this.combo);
        this.renderer.drawScreen("LEVEL COMPLETE!", `Score: ${this.player.score}`);
        break;

      case "win":
        this.renderer.drawScreen("YOU WIN!", `Final Score: ${this.player.score} - Press ENTER`);
        break;
    }
  }
}
