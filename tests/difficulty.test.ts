import { describe, it, expect } from 'vitest';
import { DifficultySystem } from '../src/systems/DifficultySystem';

describe('DifficultySystem', () => {
  const difficultySystem = new DifficultySystem();

  it('chi=0 returns beginner', () => {
    expect(difficultySystem.getTierForChi(0).tier).toBe('beginner');
  });

  it('chi=30 returns beginner', () => {
    expect(difficultySystem.getTierForChi(30).tier).toBe('beginner');
  });

  it('chi=31 returns intermediate', () => {
    expect(difficultySystem.getTierForChi(31).tier).toBe('intermediate');
  });

  it('chi=70 returns intermediate', () => {
    expect(difficultySystem.getTierForChi(70).tier).toBe('intermediate');
  });

  it('chi=71 returns expert', () => {
    expect(difficultySystem.getTierForChi(71).tier).toBe('expert');
  });

  it('chi=100 returns expert', () => {
    expect(difficultySystem.getTierForChi(100).tier).toBe('expert');
  });
});
