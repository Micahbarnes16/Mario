export class Input {
  private keys = new Map<string, boolean>();
  private touch = { left: false, right: false, jump: false, fire: false, enter: false };

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

  setTouch(action: keyof typeof this.touch, pressed: boolean) {
    this.touch[action] = pressed;
  }

  isDown(code: string): boolean {
    return this.keys.get(code) === true;
  }

  get left(): boolean {
    return this.isDown("ArrowLeft") || this.isDown("KeyA") || this.touch.left;
  }

  get right(): boolean {
    return this.isDown("ArrowRight") || this.isDown("KeyD") || this.touch.right;
  }

  get jump(): boolean {
    return this.isDown("Space") || this.isDown("ArrowUp") || this.isDown("KeyW") || this.touch.jump;
  }

  get fire(): boolean {
    return this.isDown("KeyX") || this.isDown("ShiftLeft") || this.touch.fire;
  }

  get enter(): boolean {
    return this.isDown("Enter") || this.touch.enter || this.touch.jump;
  }
}
