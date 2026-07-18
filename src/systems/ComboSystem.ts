import { gameEvents, GAME_EVENTS } from './GameEvents';

/**
 * ComboSystem — Tracks consecutive correct sorts.
 * Per PRD Track B, step B.7.
 *
 * Emits 'combo-changed' via the game event bus on every state change.
 */
export class ComboSystem {
  private comboCount: number = 0;

  /** Register a correct sort. Returns the new combo count. */
  registerCorrect(): number {
    this.comboCount++;
    gameEvents.emit(GAME_EVENTS.COMBO_CHANGED, { combo: this.comboCount });
    return this.comboCount;
  }

  /** Register an incorrect sort. Resets combo to 0. */
  registerIncorrect(): void {
    this.comboCount = 0;
    gameEvents.emit(GAME_EVENTS.COMBO_CHANGED, { combo: this.comboCount });
  }

  /** Get the current combo count (for display/testing). */
  getCombo(): number {
    return this.comboCount;
  }

  /** Reset combo (e.g., at round start). */
  reset(): void {
    this.comboCount = 0;
  }
}
