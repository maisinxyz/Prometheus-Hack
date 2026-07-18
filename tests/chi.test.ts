import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChiSystem } from '../src/systems/ChiSystem';

describe('ChiSystem', () => {
  let chiSystem: ChiSystem;

  beforeEach(() => {
    // Clear mock localStorage before each test
    localStorage.clear();
    chiSystem = new ChiSystem();
  });

  it('defaults CHI to 0 on first visit', () => {
    expect(chiSystem.getChi('test_venue')).toBe(0);
  });

  it('updates CHI correctly: 100% accuracy', () => {
    // Current is 0. 100% accuracy -> 0 + (100 - 50) * 0.3 = 15
    const newChi = chiSystem.updateChi('test_venue', 100);
    expect(newChi).toBeCloseTo(15);
    expect(chiSystem.getChi('test_venue')).toBeCloseTo(15);
  });

  it('updates CHI correctly: 0% accuracy (clamps at 0)', () => {
    // Current is 0. 0% accuracy -> 0 + (0 - 50) * 0.3 = -15 -> clamps to 0
    const newChi = chiSystem.updateChi('test_venue', 0);
    expect(newChi).toBe(0);
  });

  it('updates CHI correctly: 0% accuracy from 50 (drops)', () => {
    // Seed at 50
    chiSystem.updateChi('test_venue', 100); // 15
    chiSystem.updateChi('test_venue', 100); // 30
    chiSystem.updateChi('test_venue', 100); // 45
    chiSystem.updateChi('test_venue', 100); // 60
    
    // Now drop
    const newChi = chiSystem.updateChi('test_venue', 0);
    // 60 + (0 - 50) * 0.3 = 60 - 15 = 45
    expect(newChi).toBeCloseTo(45);
  });

  it('persists CHI to localStorage', () => {
    chiSystem.updateChi('test_venue', 100); // gets 15
    
    // Simulate a fresh system
    const newSystem = new ChiSystem();
    expect(newSystem.getChi('test_venue')).toBeCloseTo(15);
  });
});
