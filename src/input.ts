export class Input {
  private keys = new Map<string, boolean>();
  private touch = { left: false, right: false, jump: false, fire: false, enter: false };
  private gamepad = { left: false, right: false, jump: false, fire: false, enter: false };

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

  /** Call once per frame (before update) to snapshot the first connected gamepad. */
  pollGamepad(): void {
    if (typeof navigator === "undefined" || typeof navigator.getGamepads !== "function") return;
    const pads = navigator.getGamepads();
    const pad = pads[0] ?? pads[1] ?? pads[2] ?? pads[3] ?? null;
    if (!pad) {
      this.gamepad = { left: false, right: false, jump: false, fire: false, enter: false };
      return;
    }
    const axisX = pad.axes[0] ?? 0;
    const DEAD = 0.3;
    const btn = (i: number) => pad.buttons[i]?.pressed ?? false;
    this.gamepad.left  = axisX < -DEAD || btn(14);          // left stick or D-Pad left
    this.gamepad.right = axisX >  DEAD || btn(15);          // left stick or D-Pad right
    this.gamepad.jump  = btn(0) || btn(12);                 // A or D-Pad up
    this.gamepad.fire  = btn(1) || btn(2) || btn(4) || btn(5); // B, X, LB, RB
    this.gamepad.enter = btn(9) || btn(0);                  // Start or A
  }

  setTouch(action: keyof typeof this.touch, pressed: boolean) {
    this.touch[action] = pressed;
  }

  isDown(code: string): boolean {
    return this.keys.get(code) === true;
  }

  get left(): boolean {
    return this.isDown("ArrowLeft") || this.isDown("KeyA") || this.touch.left || this.gamepad.left;
  }

  get right(): boolean {
    return this.isDown("ArrowRight") || this.isDown("KeyD") || this.touch.right || this.gamepad.right;
  }

  get jump(): boolean {
    return this.isDown("Space") || this.isDown("ArrowUp") || this.isDown("KeyW") || this.touch.jump || this.gamepad.jump;
  }

  get fire(): boolean {
    return this.isDown("KeyX") || this.isDown("ShiftLeft") || this.touch.fire || this.gamepad.fire;
  }

  get enter(): boolean {
    return this.isDown("Enter") || this.touch.enter || this.touch.jump || this.gamepad.enter;
  }
}
