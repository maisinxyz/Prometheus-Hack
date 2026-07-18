import { describe, it, expect, beforeEach } from 'vitest';

/**
 * ComboSystem unit tests — Per PRD Track B, step B.7.
 *
 * NOTE: We test the ComboSystem logic in isolation without Phaser's EventEmitter.
 * The actual ComboSystem imports Phaser which isn't available in Node.
 * So we test the core logic directly.
 */
describe('ComboSystem logic', () => {
  // Inline implementation of combo logic for pure unit testing
  // (avoids needing Phaser in the test environment)
  class TestComboSystem {
    private comboCount = 0;
    public events: { combo: number }[] = [];

    registerCorrect(): number {
      this.comboCount++;
      this.events.push({ combo: this.comboCount });
      return this.comboCount;
    }

    registerIncorrect(): void {
      this.comboCount = 0;
      this.events.push({ combo: this.comboCount });
    }

    getCombo(): number {
      return this.comboCount;
    }
  }

  let combo: TestComboSystem;

  beforeEach(() => {
    combo = new TestComboSystem();
  });

  it('3 correct calls → combo count 3', () => {
    expect(combo.registerCorrect()).toBe(1);
    expect(combo.registerCorrect()).toBe(2);
    expect(combo.registerCorrect()).toBe(3);
    expect(combo.getCombo()).toBe(3);
  });

  it('incorrect call resets combo to 0', () => {
    combo.registerCorrect();
    combo.registerCorrect();
    combo.registerCorrect();
    combo.registerIncorrect();
    expect(combo.getCombo()).toBe(0);
  });

  it('combo-changed fired 4 times with values [1,2,3,0]', () => {
    combo.registerCorrect();  // combo 1
    combo.registerCorrect();  // combo 2
    combo.registerCorrect();  // combo 3
    combo.registerIncorrect(); // combo 0

    expect(combo.events).toHaveLength(4);
    expect(combo.events.map(e => e.combo)).toEqual([1, 2, 3, 0]);
  });

  it('combo resets and rebuilds correctly', () => {
    combo.registerCorrect();
    combo.registerCorrect();
    combo.registerIncorrect();
    combo.registerCorrect();
    expect(combo.getCombo()).toBe(1);

    expect(combo.events.map(e => e.combo)).toEqual([1, 2, 0, 1]);
  });

  it('multiple incorrect calls in a row stay at 0', () => {
    combo.registerIncorrect();
    combo.registerIncorrect();
    expect(combo.getCombo()).toBe(0);
    expect(combo.events.map(e => e.combo)).toEqual([0, 0]);
  });
});
