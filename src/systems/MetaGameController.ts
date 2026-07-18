import { gameEvents, GAME_EVENTS } from './GameEvents';
import { ChiSystem } from './ChiSystem';
import { VenueDecayState } from './VenueDecayState';

/**
 * MetaGameController — Wires round-ended events to meta-game systems.
 * Connects Track B (core loop) to Track D (CHI/Decay).
 */
class MetaGameController {
  private static instance: MetaGameController;
  public chiSystem: ChiSystem;
  public venueDecayState: VenueDecayState;

  private constructor() {
    this.chiSystem = new ChiSystem();
    this.venueDecayState = new VenueDecayState();
    
    // Subscribe to events
    gameEvents.on(GAME_EVENTS.ROUND_ENDED, this.onRoundEnded, this);
  }

  public static getInstance(): MetaGameController {
    if (!MetaGameController.instance) {
      MetaGameController.instance = new MetaGameController();
    }
    return MetaGameController.instance;
  }

  private onRoundEnded(payload: { totalScore: number; accuracyPct: number; venueId: string }): void {
    // D.2: Update CHI
    this.chiSystem.updateChi(payload.venueId, payload.accuracyPct);
    
    // D.4: Update decay state
    this.venueDecayState.recordRound(payload.venueId, payload.accuracyPct);
  }
}

export const metaGameController = MetaGameController.getInstance();
