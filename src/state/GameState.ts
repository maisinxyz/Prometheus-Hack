/**
 * GameState — Singleton holding global game state.
 * Per PRD Section 1.1: plain TypeScript classes + a single GameState singleton
 * (no Redux/MobX) — game state is not complex enough to justify a state library.
 */
export class GameState {
  private static instance: GameState;

  /** Current total score across all rounds in this session */
  public totalScore: number = 0;

  /** Current combo count (reset on incorrect drop) */
  public comboCount: number = 0;

  /** Active venue ID */
  public activeVenueId: string = 'mackenzie_cafe';

  private constructor() {
    // Private constructor enforces singleton pattern
  }

  public static getInstance(): GameState {
    if (!GameState.instance) {
      GameState.instance = new GameState();
    }
    return GameState.instance;
  }

  /** Reset state for a new round */
  public resetRound(): void {
    this.totalScore = 0;
    this.comboCount = 0;
  }
}
