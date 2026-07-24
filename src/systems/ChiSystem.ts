/**
 * ChiSystem — Manages per-venue Meta-game CHI tracking.
 * Per PRD Track D, steps D.1 and D.3.
 *
 * TASK 1.3: CHI defaults to 0 on first visit (NOT 50).
 * TASK 1.4: CHI gain formula rewritten per UPDATESPRD Step 1.
 */

/** CHI gain constants — single source of truth */
const CHI_GAIN_PERFECT = 15;
const CHI_PARTIAL_RATE = 0.15;

/**
 * Compute the CHI gain from a single round's accuracy.
 * - 100% accuracy → flat gain of CHI_GAIN_PERFECT (15)
 * - 50-99% accuracy → proportional gain: (accuracy - 50) * CHI_PARTIAL_RATE
 * - <50% accuracy → 0 (floored, never negative)
 */
export function computeChiGain(accuracyPct: number): number {
  if (accuracyPct >= 100) return CHI_GAIN_PERFECT;
  return Math.max(0, (accuracyPct - 50) * CHI_PARTIAL_RATE);
}

export class ChiSystem {
  private chiMap: Map<string, number> = new Map();
  private static readonly STORAGE_PREFIX = 'trashdash_chi_';

  /**
   * Retrieves the current CHI for a given venue.
   * TASK 1.3: defaults to 0 on first visit (NOT 50).
   */
  getChi(venueId: string): number {
    if (this.chiMap.has(venueId)) {
      return this.chiMap.get(venueId)!;
    }

    // Check localStorage
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(ChiSystem.STORAGE_PREFIX + venueId);
      if (stored !== null) {
        const val = parseFloat(stored);
        if (!isNaN(val)) {
          this.chiMap.set(venueId, val);
          return val;
        }
      }
    }

    // Default to 0
    this.chiMap.set(venueId, 0);
    return 0;
  }

  /**
   * Updates CHI based on round accuracy percentage.
   * TASK 1.4: New formula — gain is always non-negative (no CHI loss).
   * Formula: newChi = clamp(currentChi + computeChiGain(accuracyPct), 0, 100)
   */
  updateChi(venueId: string, roundAccuracyPct: number): number {
    const currentChi = this.getChi(venueId);

    const gain = computeChiGain(roundAccuracyPct);
    let newChi = currentChi + gain;
    newChi = Math.max(0, Math.min(100, newChi)); // clamp 0-100

    this.chiMap.set(venueId, newChi);

    // Persist
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ChiSystem.STORAGE_PREFIX + venueId, newChi.toString());
    }

    return newChi;
  }

  /**
   * Retrieves the total CHI for a given list of venue IDs.
   */
  getTotalChi(venueIds: string[]): number {
    let total = 0;
    for (const id of venueIds) {
      total += this.getChi(id);
    }
    return total;
  }
}
