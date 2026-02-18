export function calcTimeBonus(timeRemaining: number): number {
  return Math.min(Math.floor(timeRemaining) * 100, 5000);
}

export function incrementCombo(current: number): number {
  return Math.min(current + 1, 4);
}

export function resetCombo(): number {
  return 1;
}
