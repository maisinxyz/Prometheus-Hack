import { gameEvents, GAME_EVENTS } from './GameEvents';

/**
 * PerfectStreakSystem
 * Tracks consecutive perfect ROUNDS globally across all venues.
 * This is a separate system from ComboSystem (which tracks consecutive drops mid-round).
 * 
 * Rules:
 * - 100% accuracy -> increments current streak, updates best.
 * - < 100% accuracy -> resets current streak to 0, best remains.
 * - Purely for visual/audio flair. NO gameplay/numeric bonuses.
 */
export class PerfectStreakSystem {
  private static instance: PerfectStreakSystem;
  private currentStreak: number = 0;
  private bestStreak: number = 0;

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): PerfectStreakSystem {
    if (!PerfectStreakSystem.instance) {
      PerfectStreakSystem.instance = new PerfectStreakSystem();
    }
    return PerfectStreakSystem.instance;
  }

  private loadFromStorage() {
    const currentStr = localStorage.getItem('trashdash_perfect_streak');
    const bestStr = localStorage.getItem('trashdash_best_streak');
    if (currentStr) this.currentStreak = parseInt(currentStr, 10);
    if (bestStr) this.bestStreak = parseInt(bestStr, 10);
  }

  private saveToStorage() {
    localStorage.setItem('trashdash_perfect_streak', this.currentStreak.toString());
    localStorage.setItem('trashdash_best_streak', this.bestStreak.toString());
  }

  public getCurrentStreak(): number {
    return this.currentStreak;
  }

  public getBestStreak(): number {
    return this.bestStreak;
  }

  private getTierForStreak(streak: number): number {
    if (streak >= 10) return 4;
    if (streak >= 5) return 3;
    if (streak >= 3) return 2;
    if (streak >= 1) return 1;
    return 0;
  }

  public registerRoundResult(accuracyPct: number): { current: number; best: number; tierChanged: boolean } {
    const previousTier = this.getTierForStreak(this.currentStreak);

    if (accuracyPct >= 100) {
      this.currentStreak += 1;
    } else {
      this.currentStreak = 0;
    }

    if (this.currentStreak > this.bestStreak) {
      this.bestStreak = this.currentStreak;
    }

    this.saveToStorage();

    const newTier = this.getTierForStreak(this.currentStreak);
    const tierChanged = newTier !== previousTier;

    gameEvents.emit(GAME_EVENTS.STREAK_CHANGED, {
      current: this.currentStreak,
      best: this.bestStreak,
      tierChanged
    });

    return {
      current: this.currentStreak,
      best: this.bestStreak,
      tierChanged
    };
  }
}

export const perfectStreakSystem = PerfectStreakSystem.getInstance();
