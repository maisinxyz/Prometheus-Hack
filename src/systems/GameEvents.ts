import Phaser from 'phaser';

/**
 * GameEvents — Centralized typed event bus.
 * This is the contract Tracks C and D build against.
 * Do NOT change these event names or payload shapes without notifying both Tracks.
 *
 * Per PRD Track B, step B.9.
 *
 * Events:
 *   'item-locked-on': { item: TrashItem }
 *   'item-dropped':   { item: TrashItem; bin: Bin; result: DropResult }
 *   'combo-changed':  { combo: number }
 *   'round-ended':    { totalScore: number; accuracyPct: number; venueId: string }
 */

export interface DropResult {
  correct: boolean;
  pointsAwarded: number;
  velocityMultiplier: number;
}

/** Singleton event emitter shared across all game systems */
class GameEventBus extends Phaser.Events.EventEmitter {
  private static instance: GameEventBus;

  private constructor() {
    super();
  }

  public static getInstance(): GameEventBus {
    if (!GameEventBus.instance) {
      GameEventBus.instance = new GameEventBus();
    }
    return GameEventBus.instance;
  }
}

export const gameEvents = GameEventBus.getInstance();

// Event name constants to avoid string typos
export const GAME_EVENTS = {
  ITEM_LOCKED_ON: 'item-locked-on',
  ITEM_DROPPED: 'item-dropped',
  COMBO_CHANGED: 'combo-changed',
  ROUND_ENDED: 'round-ended',
} as const;
