import { describe, it, expect } from 'vitest';
import { ScoringSystem } from '../src/systems/ScoringSystem';
import { SCORING } from '../src/config/ScoringConfig';

/**
 * Scoring unit tests — Per PRD Track B, step B.6.
 * Covers all 3 velocity buckets × both correctness states (6 cases).
 */
describe('ScoringSystem.resolveDrop', () => {
  const system = new ScoringSystem();
  const startTime = 10000; // arbitrary start timestamp

  // --- CORRECT drops ---
  describe('correct drop', () => {
    it('fast sort (≤1s) gives 2x points', () => {
      const dropTime = startTime + 500; // 500ms = fast
      const result = system.resolveDrop('paper', 'paper', startTime, dropTime);

      expect(result.correct).toBe(true);
      expect(result.velocityMultiplier).toBe(SCORING.VELOCITY_FAST_MULTIPLIER); // 2.0
      expect(result.pointsAwarded).toBe(SCORING.CORRECT_BIN_POINTS * SCORING.VELOCITY_FAST_MULTIPLIER); // 100
    });

    it('normal sort (1s < t < 5s) gives 1x points', () => {
      const dropTime = startTime + 3000; // 3s = normal
      const result = system.resolveDrop('compost', 'compost', startTime, dropTime);

      expect(result.correct).toBe(true);
      expect(result.velocityMultiplier).toBe(1.0);
      expect(result.pointsAwarded).toBe(SCORING.CORRECT_BIN_POINTS * 1.0); // 50
    });

    it('slow sort (≥5s) gives 0.5x points', () => {
      const dropTime = startTime + 6000; // 6s = slow
      const result = system.resolveDrop('plastic', 'plastic', startTime, dropTime);

      expect(result.correct).toBe(true);
      expect(result.velocityMultiplier).toBe(SCORING.VELOCITY_SLOW_MULTIPLIER); // 0.5
      expect(result.pointsAwarded).toBe(SCORING.CORRECT_BIN_POINTS * SCORING.VELOCITY_SLOW_MULTIPLIER); // 25
    });
  });

  // --- INCORRECT drops ---
  describe('incorrect drop', () => {
    it('fast incorrect gives contamination penalty', () => {
      const dropTime = startTime + 500;
      const result = system.resolveDrop('paper', 'landfill', startTime, dropTime);

      expect(result.correct).toBe(false);
      expect(result.pointsAwarded).toBe(SCORING.CONTAMINATION_PENALTY); // -100
    });

    it('normal incorrect gives contamination penalty', () => {
      const dropTime = startTime + 3000;
      const result = system.resolveDrop('compost', 'plastic', startTime, dropTime);

      expect(result.correct).toBe(false);
      expect(result.pointsAwarded).toBe(SCORING.CONTAMINATION_PENALTY); // -100
    });

    it('slow incorrect gives contamination penalty', () => {
      const dropTime = startTime + 6000;
      const result = system.resolveDrop('plastic', 'paper', startTime, dropTime);

      expect(result.correct).toBe(false);
      expect(result.pointsAwarded).toBe(SCORING.CONTAMINATION_PENALTY); // -100
    });
  });

  // --- Boundary conditions ---
  describe('velocity boundary cases', () => {
    it('exactly at fast threshold (1000ms) is fast', () => {
      const dropTime = startTime + 1000;
      const result = system.resolveDrop('paper', 'paper', startTime, dropTime);
      expect(result.velocityMultiplier).toBe(SCORING.VELOCITY_FAST_MULTIPLIER);
    });

    it('1ms over fast threshold (1001ms) is normal', () => {
      const dropTime = startTime + 1001;
      const result = system.resolveDrop('paper', 'paper', startTime, dropTime);
      expect(result.velocityMultiplier).toBe(1.0);
    });

    it('exactly at slow threshold (5000ms) is slow', () => {
      const dropTime = startTime + 5000;
      const result = system.resolveDrop('paper', 'paper', startTime, dropTime);
      expect(result.velocityMultiplier).toBe(SCORING.VELOCITY_SLOW_MULTIPLIER);
    });

    it('1ms under slow threshold (4999ms) is normal', () => {
      const dropTime = startTime + 4999;
      const result = system.resolveDrop('paper', 'paper', startTime, dropTime);
      expect(result.velocityMultiplier).toBe(1.0);
    });
  });
});
