export type SoundEvent = "jump" | "coin" | "stomp" | "powerup" | "death" | "levelcomplete";

export class SoundManager {
  private ctx: AudioContext | null = null;
  muted = false;

  private getCtx(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    return this.ctx;
  }

  toggleMute() {
    this.muted = !this.muted;
  }

  play(sound: SoundEvent) {
    if (this.muted) return;
    const ctx = this.getCtx();
    if (ctx.state === "suspended") ctx.resume();
    switch (sound) {
      case "jump":          this.playJump(ctx); break;
      case "coin":          this.playCoin(ctx); break;
      case "stomp":         this.playStomp(ctx); break;
      case "powerup":       this.playPowerup(ctx); break;
      case "death":         this.playDeath(ctx); break;
      case "levelcomplete": this.playLevelComplete(ctx); break;
    }
  }

  private note(ctx: AudioContext, type: OscillatorType, freq: number, start: number, dur: number, gain = 0.3) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g);
    g.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
    g.gain.setValueAtTime(gain, ctx.currentTime + start);
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + start + dur);
    osc.start(ctx.currentTime + start);
    osc.stop(ctx.currentTime + start + dur);
  }

  private playJump(ctx: AudioContext) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g);
    g.connect(ctx.destination);
    osc.type = "square";
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(500, ctx.currentTime + 0.08);
    g.gain.setValueAtTime(0.25, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.08);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }

  private playCoin(ctx: AudioContext) {
    // High C then E
    this.note(ctx, "sine", 1046, 0,    0.12, 0.3);
    this.note(ctx, "sine", 1318, 0.12, 0.12, 0.3);
  }

  private playStomp(ctx: AudioContext) {
    const bufSize = ctx.sampleRate * 0.06;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.4, ctx.currentTime);
    src.connect(g);
    g.connect(ctx.destination);
    src.start();
  }

  private playPowerup(ctx: AudioContext) {
    const freqs = [330, 415, 494, 659];
    freqs.forEach((f, i) => this.note(ctx, "sine", f, i * 0.1, 0.1, 0.35));
  }

  private playDeath(ctx: AudioContext) {
    const freqs = [494, 466, 440, 415, 392, 370, 349, 330, 294, 262];
    freqs.forEach((f, i) => this.note(ctx, "sine", f, i * 0.06, 0.07, 0.3));
  }

  private playLevelComplete(ctx: AudioContext) {
    const melody = [330, 330, 330, 262, 330, 392, 196];
    const times  = [0, 0.18, 0.36, 0.54, 0.63, 0.72, 1.0];
    melody.forEach((f, i) => this.note(ctx, "square", f, times[i], 0.15, 0.3));
  }
}
