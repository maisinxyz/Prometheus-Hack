import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ChiSystem } from '../src/systems/ChiSystem';

describe('ChiSystem', () => {
  let chiSystem: ChiSystem;

  beforeEach(() => {
    // Mock localStorage
    const store: Record<string, string> = {};
    const localStorageMock = {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value.toString();
      }),
      clear: vi.fn(() => {
        for (const key in store) delete store[key];
      }),
      get length() {
        return Object.keys(store).length;
      },
      key: vi.fn((index: number) => Object.keys(store)[index] || null),
    };
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true
    });

    chiSystem = new ChiSystem();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes CHI to 0 for a new venue', () => {
    expect(chiSystem.getChi('new_venue')).toBe(0);
  });

  it('updates CHI correctly from 0 with 100% accuracy', () => {
    // 0 + (100 - 50) * 0.3 = 15
    expect(chiSystem.updateChi('venue1', 100)).toBe(15);
  });

  it('clamps CHI update from 0 with 0% accuracy to 0', () => {
    // 0 + (0 - 50) * 0.3 = -15, clamped to 0
    expect(chiSystem.updateChi('venue1', 0)).toBe(0);
  });

  it('updates CHI correctly from 50 with 100% accuracy', () => {
    // First set to 50
    global.localStorage.setItem('trashdash_chi_venue2', '50');
    const system = new ChiSystem();
    
    // 50 + (100 - 50) * 0.3 = 65
    expect(system.updateChi('venue2', 100)).toBe(65);
  });

  it('updates CHI correctly from 50 with 0% accuracy', () => {
    global.localStorage.setItem('trashdash_chi_venue3', '50');
    const system = new ChiSystem();
    
    // 50 + (0 - 50) * 0.3 = 35
    expect(system.updateChi('venue3', 0)).toBe(35);
  });

  it('clamps CHI to 100', () => {
    global.localStorage.setItem('trashdash_chi_venue4', '95');
    const system = new ChiSystem();
    
    // 95 + (100 - 50) * 0.3 = 110, clamped to 100
    expect(system.updateChi('venue4', 100)).toBe(100);
  });
});
