/**
 * VenueDecayState — Tracks consecutive failed rounds and determines environmental decay.
 * Per PRD Track D, step D.4.
 */

export enum DecayState {
  CLEAN = 'CLEAN',
  DECLINING = 'DECLINING',
  RUINED = 'RUINED',
}

export class VenueDecayState {
  private failStreaks: Map<string, number> = new Map();

  /**
   * Registers a round result for a venue and updates its fail streak.
   * A "fail" is defined as accuracyPct < 50.
   */
  registerRound(venueId: string, accuracyPct: number): void {
    const currentStreak = this.failStreaks.get(venueId) || 0;

    if (accuracyPct < 50) {
      this.failStreaks.set(venueId, currentStreak + 1);
    } else {
      this.failStreaks.set(venueId, 0); // Reset on success
    }
  }

  /**
   * Gets the current visual decay state for a venue.
   */
  getState(venueId: string): DecayState {
    const streak = this.failStreaks.get(venueId) || 0;

    if (streak >= 4) {
      return DecayState.RUINED;
    } else if (streak >= 2) {
      return DecayState.DECLINING;
    } else {
      return DecayState.CLEAN;
    }
  }
}
