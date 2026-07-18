/**
 * VenueDecayState — Tracks environmental decay based on performance.
 * Per PRD Track D, step D.4.
 */

export enum DecayState {
  CLEAN = 'CLEAN',
  DECLINING = 'DECLINING',
  RUINED = 'RUINED',
}

export class VenueDecayState {
  private failStreakByVenue: Map<string, number> = new Map();

  /**
   * Updates the fail streak based on round performance.
   * A "fail" is < 50% accuracy.
   */
  public recordRound(venueId: string, accuracyPct: number): void {
    if (accuracyPct >= 50) {
      // Any success resets the streak to 0
      this.failStreakByVenue.set(venueId, 0);
    } else {
      // Failure increments the streak
      const currentStreak = this.failStreakByVenue.get(venueId) || 0;
      this.failStreakByVenue.set(venueId, currentStreak + 1);
    }
  }

  /**
   * Returns the current DecayState for a venue.
   * Transition logic: 0-1 fails = CLEAN, 2-3 fails = DECLINING, 4+ fails = RUINED.
   */
  public getState(venueId: string): DecayState {
    const fails = this.failStreakByVenue.get(venueId) || 0;
    if (fails >= 4) {
      return DecayState.RUINED;
    } else if (fails >= 2) {
      return DecayState.DECLINING;
    } else {
      return DecayState.CLEAN;
    }
  }
}
