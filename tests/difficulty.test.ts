import { describe, it, expect } from 'vitest';
import { DifficultySystem } from '../src/systems/DifficultySystem';

describe('DifficultySystem', () => {
  const difficultySystem = new DifficultySystem();

  it('returns beginner for CHI 0-30', () => {
    expect(difficultySystem.getTierForChi(0).tier).toBe('beginner');
    expect(difficultySystem.getTierForChi(15).tier).toBe('beginner');
    expect(difficultySystem.getTierForChi(30).tier).toBe('beginner');
  });

  it('returns intermediate for CHI 31-70', () => {
    expect(difficultySystem.getTierForChi(31).tier).toBe('intermediate');
    expect(difficultySystem.getTierForChi(50).tier).toBe('intermediate');
    expect(difficultySystem.getTierForChi(70).tier).toBe('intermediate');
  });

  it('returns expert for CHI 71-100', () => {
    expect(difficultySystem.getTierForChi(71).tier).toBe('expert');
    expect(difficultySystem.getTierForChi(85).tier).toBe('expert');
    expect(difficultySystem.getTierForChi(100).tier).toBe('expert');
  });

  it('clamps out of bounds CHI values', () => {
    expect(difficultySystem.getTierForChi(-10).tier).toBe('beginner');
    expect(difficultySystem.getTierForChi(150).tier).toBe('expert');
  });
});
