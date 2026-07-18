import { SCORING } from '../config/ScoringConfig';
import { DropResult } from './GameEvents';

/**
 * ScoringSystem — Resolves drops and calculates points.
 * Per PRD Track B, step B.6.
 *
 * Logic:
 *   1. correct = item.correctBinId === bin.id
 *   2. elapsed = Date.now() - dragStartTimeMs
 *   3. velocityMultiplier based on thresholds
 *   4. pointsAwarded = correct ? base * multiplier : penalty
 */
export class ScoringSystem {
  /**
   * Resolve a drop and return the scoring result.
   * Pure function — no side effects, easy to unit test.
   */
  resolveDrop(
    itemCorrectBinId: string,
    binId: string,
    dragStartTimeMs: number,
    dropTimeMs?: number,
    errorPenaltyMultiplier: number = 1.0
  ): DropResult {
    const now = dropTimeMs ?? Date.now();
    const correct = itemCorrectBinId === binId;
    const elapsed = now - dragStartTimeMs;

    let velocityMultiplier: number;
    if (elapsed <= SCORING.VELOCITY_FAST_THRESHOLD_MS) {
      velocityMultiplier = SCORING.VELOCITY_FAST_MULTIPLIER;
    } else if (elapsed >= SCORING.VELOCITY_SLOW_THRESHOLD_MS) {
      velocityMultiplier = SCORING.VELOCITY_SLOW_MULTIPLIER;
    } else {
      velocityMultiplier = 1.0;
    }

    const pointsAwarded = correct
      ? SCORING.CORRECT_BIN_POINTS * velocityMultiplier
      : SCORING.CONTAMINATION_PENALTY * errorPenaltyMultiplier;

    return { correct, pointsAwarded, velocityMultiplier };
  }
}
