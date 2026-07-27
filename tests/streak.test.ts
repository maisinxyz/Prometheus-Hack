import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { perfectStreakSystem } from '../src/systems/PerfectStreakSystem';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    }
  };
})();

describe('PerfectStreakSystem', () => {
  beforeAll(() => {
    (global as any).localStorage = localStorageMock;
  });

  afterAll(() => {
    delete (global as any).localStorage;
  });

  beforeEach(() => {
    localStorage.clear();
    // Since it's a singleton, we need to manually reset its state for clean tests
    // Using a hacky way since it doesn't expose a reset method, but we can simulate accuracy to reset it
    perfectStreakSystem.registerRoundResult(0); 
    localStorage.setItem('trashdash_best_streak', '0');
    // Force reload state
    (perfectStreakSystem as any).loadFromStorage();
  });

  it('increments current streak on 100% accuracy', () => {
    const res1 = perfectStreakSystem.registerRoundResult(100);
    expect(res1.current).toBe(1);
    expect(res1.best).toBe(1);

    const res2 = perfectStreakSystem.registerRoundResult(100);
    expect(res2.current).toBe(2);
    expect(res2.best).toBe(2);
  });

  it('resets current streak to 0 on < 100% accuracy but keeps best streak', () => {
    perfectStreakSystem.registerRoundResult(100);
    perfectStreakSystem.registerRoundResult(100);
    perfectStreakSystem.registerRoundResult(100);

    expect(perfectStreakSystem.getCurrentStreak()).toBe(3);
    expect(perfectStreakSystem.getBestStreak()).toBe(3);

    const res = perfectStreakSystem.registerRoundResult(99);
    expect(res.current).toBe(0);
    expect(res.best).toBe(3);
  });

  it('survives simulated page reload', () => {
    perfectStreakSystem.registerRoundResult(100);
    perfectStreakSystem.registerRoundResult(100);

    // Simulate page reload by forcing it to load from storage
    (perfectStreakSystem as any).loadFromStorage();
    
    expect(perfectStreakSystem.getCurrentStreak()).toBe(2);
    expect(perfectStreakSystem.getBestStreak()).toBe(2);
  });

  it('detects tier changes', () => {
    // 0 -> 1 (Tier 1)
    const res1 = perfectStreakSystem.registerRoundResult(100);
    expect(res1.tierChanged).toBe(true);

    // 1 -> 2 (Still Tier 1)
    const res2 = perfectStreakSystem.registerRoundResult(100);
    expect(res2.tierChanged).toBe(false);

    // 2 -> 3 (Tier 2)
    const res3 = perfectStreakSystem.registerRoundResult(100);
    expect(res3.tierChanged).toBe(true);

    // 3 -> 4 (Still Tier 2)
    const res4 = perfectStreakSystem.registerRoundResult(100);
    expect(res4.tierChanged).toBe(false);

    // 4 -> 5 (Tier 3)
    const res5 = perfectStreakSystem.registerRoundResult(100);
    expect(res5.tierChanged).toBe(true);

    // 5 -> 9 (Still Tier 3)
    const res6 = perfectStreakSystem.registerRoundResult(100);
    expect(res6.tierChanged).toBe(false);
    const res7 = perfectStreakSystem.registerRoundResult(100);
    expect(res7.tierChanged).toBe(false);
    const res8 = perfectStreakSystem.registerRoundResult(100);
    expect(res8.tierChanged).toBe(false);
    const res9 = perfectStreakSystem.registerRoundResult(100);
    expect(res9.tierChanged).toBe(false);

    // 9 -> 10 (Tier 4)
    const res10 = perfectStreakSystem.registerRoundResult(100);
    expect(res10.tierChanged).toBe(true);

    // 10 -> 11 (Still Tier 4)
    const res11 = perfectStreakSystem.registerRoundResult(100);
    expect(res11.tierChanged).toBe(false);
  });
});
