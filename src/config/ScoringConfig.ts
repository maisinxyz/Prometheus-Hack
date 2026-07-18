/**
 * ScoringConfig — Point values and multiplier tables.
 * Matches PRD Section 3 table exactly.
 * Consumed by Track B's ScoringSystem.
 */
export const SCORING = {
  CORRECT_BIN_POINTS: 50,
  CONTAMINATION_PENALTY: -100,
  VELOCITY_FAST_THRESHOLD_MS: 1000,   // sort within 1s
  VELOCITY_FAST_MULTIPLIER: 2.0,
  VELOCITY_SLOW_THRESHOLD_MS: 5000,   // sort after 5s
  VELOCITY_SLOW_MULTIPLIER: 0.5,
} as const;
