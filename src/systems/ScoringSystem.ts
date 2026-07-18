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
    errorPenaltyMultiplier: number = 1.0,
    isComposite: boolean = false
  ): DropResult {
    const now = dropTimeMs ?? Date.now();
    const correct = itemCorrectBinId === binId && !isComposite;
    const elapsed = now - dragStartTimeMs;

    let velocityMultiplier: number;
    if (elapsed <= SCORING.VELOCITY_FAST_THRESHOLD_MS) {
      velocityMultiplier = SCORING.VELOCITY_FAST_MULTIPLIER;
    } else if (elapsed >= SCORING.VELOCITY_SLOW_THRESHOLD_MS) {
      velocityMultiplier = SCORING.VELOCITY_SLOW_MULTIPLIER;
    } else {
      velocityMultiplier = 1.0;
    }

    let pointsAwarded = 0;
    if (correct) {
      pointsAwarded = SCORING.CORRECT_BIN_POINTS * velocityMultiplier;
    } else {
      pointsAwarded = SCORING.CONTAMINATION_PENALTY * errorPenaltyMultiplier;
      // Massive penalty for not separating composite items (Cluster B)
      if (isComposite) {
        pointsAwarded *= 3; // Triple the penalty!
      }
    }

    return { correct, pointsAwarded, velocityMultiplier };
  }
}
