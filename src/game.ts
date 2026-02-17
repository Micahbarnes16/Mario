import { GameState, TILE_SIZE } from "./types";
import { Input } from "./input";
import { Player } from "./player";
import { Camera } from "./camera";
import { Renderer } from "./renderer";
import { parseLevel, LevelData } from "./level";
import { Enemy, Coin, Mushroom, Fireball, PopupScore } from "./entities";
import { rectsOverlap } from "./physics";
import { LEVELS } from "./levels/levels";

export class Game {
  state: GameState = "menu";
  input: Input;
  player: Player;
  camera: Camera;
  renderer: Renderer;
  levelIndex = 0;
  levelData!: LevelData;
  enemies: Enemy[] = [];
  coins: Coin[] = [];
  mushrooms: Mushroom[] = [];
  fireballs: Fireball[] = [];
  popups: PopupScore[] = [];
  transitionTimer = 0;
  fireTimer = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.input = new Input();
    this.player = new Player(0, 0);
    this.camera = new Camera();
    this.renderer = new Renderer(canvas);
    this.loadLevel(0);
  }

  loadLevel(index: number) {
    this.levelIndex = index;
    this.levelData = parseLevel(LEVELS[index]);
    this.player.reset(this.levelData.playerStart.x, this.levelData.playerStart.y);
    this.enemies = this.levelData.enemySpawns.map(
      (s) => new Enemy(s.x, s.y, s.type)
    );
    this.coins = this.levelData.coinPositions.map((c) => new Coin(c.x, c.y));
    this.mushrooms = [];
    this.fireballs = [];
    this.popups = [];
    this.camera.update(this.player.x, this.player.y, this.levelData.width, this.levelData.height);
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

    // Player update
    const { hitTiles } = this.player.update(this.input, tiles, width, height);

    // Handle blocks hit from below
    for (const tile of hitTiles) {
      if ((tile.type === "question" || tile.type === "mushroom_block") && !tile.hit) {
        tile.hit = true;
        if (tile.containsCoin) {
          this.player.addCoin();
          this.popups.push(new PopupScore(tile.x * TILE_SIZE + 16, tile.y * TILE_SIZE - 10, "100"));
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

    // Update coins
    for (const c of this.coins) {
      c.update();
    }

    // Update mushrooms
    for (const m of this.mushrooms) {
      m.update(tiles, width, height);
    }

    // Update fireballs
    for (const f of this.fireballs) {
      f.update(tiles, width, height);
    }

    // Update popups
    for (const p of this.popups) {
      p.update();
    }
    this.popups = this.popups.filter((p) => !p.done);

    // Player-enemy collisions
    if (!this.player.dead) {
      for (const e of this.enemies) {
        if (!e.alive && !e.shell) continue;
        if (e.shell && !e.shellMoving) continue;
        if (!rectsOverlap(this.player.rect, e.rect)) continue;

        const playerBottom = this.player.y + this.player.h;
        const enemyTop = e.y;
        const playerFalling = this.player.vy > 0;

        if (playerFalling && playerBottom - this.player.vy <= enemyTop + 10) {
          // Stomp
          e.stomp();
          this.player.vy = -7;
          this.player.addScore(200);
          this.popups.push(new PopupScore(e.x + e.w / 2, e.y - 10, "200"));
        } else {
          // Hurt
          this.player.die();
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
          if (e === shell) continue;
          if (!e.alive) continue;
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
            if (e.shell) {
              e.alive = false;
              e.shell = false;
            } else {
              e.alive = false;
            }
            f.active = false;
            this.player.addScore(200);
            this.popups.push(new PopupScore(e.x, e.y - 10, "200"));
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
        }
      }

      // Mushroom collection
      for (const m of this.mushrooms) {
        if (!m.active || m.collected) continue;
        if (m.emergeTimer > 0) continue;
        if (rectsOverlap(this.player.rect, m.rect)) {
          m.collected = true;
          this.player.grow();
          this.player.addScore(1000);
          this.popups.push(new PopupScore(m.x + m.w / 2, m.y - 10, "1UP"));
        }
      }

      // Flag check
      for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
          const tile = tiles[r]?.[c];
          if (tile?.type === "flag") {
            const flagRect = { x: c * TILE_SIZE, y: r * TILE_SIZE, w: TILE_SIZE, h: TILE_SIZE };
            if (rectsOverlap(this.player.rect, flagRect)) {
              this.state = "levelcomplete";
              this.transitionTimer = 0;
              this.player.addScore(2000);
              return;
            }
          }
        }
      }

      // Fall death
      if (this.player.y > height * TILE_SIZE + 50) {
        this.player.die();
      }
    }

    // Handle player death
    if (this.player.dead && this.player.deathTimer > 90) {
      if (this.player.lives <= 0) {
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
  }

  draw() {
    this.renderer.clear();

    switch (this.state) {
      case "menu":
        this.renderer.drawScreen("MARIO PLATFORMER", "Press ENTER or SPACE to Start");
        break;

      case "playing":
        this.renderer.drawTiles(this.levelData.tiles, this.camera);
        this.renderer.drawCoins(this.coins, this.camera);
        this.renderer.drawMushrooms(this.mushrooms, this.camera);
        this.renderer.drawEnemies(this.enemies, this.camera);
        this.renderer.drawFireballs(this.fireballs, this.camera);
        this.renderer.drawPlayer(this.player, this.camera);
        this.renderer.drawPopups(this.popups, this.camera);
        this.renderer.drawHUD(this.player.score, this.player.coins, this.player.lives, this.levelIndex);
        break;

      case "gameover":
        this.renderer.drawScreen("GAME OVER", "Press ENTER to return to menu");
        break;

      case "levelcomplete":
        this.renderer.drawTiles(this.levelData.tiles, this.camera);
        this.renderer.drawPlayer(this.player, this.camera);
        this.renderer.drawHUD(this.player.score, this.player.coins, this.player.lives, this.levelIndex);
        this.renderer.drawScreen("LEVEL COMPLETE!", `Score: ${this.player.score}`);
        break;

      case "win":
        this.renderer.drawScreen("YOU WIN!", `Final Score: ${this.player.score} - Press ENTER`);
        break;
    }
  }
}
