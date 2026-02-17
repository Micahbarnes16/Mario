export class Input {
  private keys = new Map<string, boolean>();

  constructor() {
    window.addEventListener("keydown", (e) => {
      this.keys.set(e.code, true);
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener("keyup", (e) => {
      this.keys.set(e.code, false);
    });
  }

  isDown(code: string): boolean {
    return this.keys.get(code) === true;
  }

  get left(): boolean {
    return this.isDown("ArrowLeft") || this.isDown("KeyA");
  }

  get right(): boolean {
    return this.isDown("ArrowRight") || this.isDown("KeyD");
  }

  get jump(): boolean {
    return this.isDown("Space") || this.isDown("ArrowUp") || this.isDown("KeyW");
  }

  get fire(): boolean {
    return this.isDown("KeyX") || this.isDown("ShiftLeft");
  }

  get enter(): boolean {
    return this.isDown("Enter");
  }
}
