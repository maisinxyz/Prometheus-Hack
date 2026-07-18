import { describe, it, expect } from 'vitest';

/**
 * Trivial test to confirm the Vitest runner works.
 * Per PRD Track 0, step 0.9.
 */
describe('Vitest setup', () => {
  it('should confirm the test runner works', () => {
    expect(1 + 1).toBe(2);
  });
});
