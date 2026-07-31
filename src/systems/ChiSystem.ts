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
 * Compute the CHI gain from a single round.
 * Formula per Step 1:
 * - 100% accuracy = 15 CHI
 * - 50%-99% accuracy = (accuracyPct - 50) * 0.15 CHI
 * - <= 50% accuracy = 0 CHI
 */
export function computeChiGain(accuracyPct: number): number {
  if (accuracyPct >= 100) {
    return CHI_GAIN_PERFECT;
  }
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

    // Check localStorage (and sessionStorage if in dev mode)
    if (typeof localStorage !== 'undefined') {
      const isDev = localStorage.getItem('trashdash_dev_mode') === 'true';
      let stored = isDev ? sessionStorage.getItem(ChiSystem.STORAGE_PREFIX + venueId) : localStorage.getItem(ChiSystem.STORAGE_PREFIX + venueId);
      
      // Fallback: If dev mode is active but they have no session data, initialize it with their actual save data so the garden/map loads properly
      if (isDev && !stored) {
        stored = localStorage.getItem(ChiSystem.STORAGE_PREFIX + venueId);
        if (stored !== null) sessionStorage.setItem(ChiSystem.STORAGE_PREFIX + venueId, stored);
      }

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
   */
  updateChi(venueId: string, accuracyPct: number): number {
    const currentChi = this.getChi(venueId);

    const gain = computeChiGain(accuracyPct);
    let newChi = currentChi + gain;

    this.chiMap.set(venueId, newChi);

    // Persist
    if (typeof localStorage !== 'undefined') {
      const isDev = localStorage.getItem('trashdash_dev_mode') === 'true';
      if (isDev) {
        sessionStorage.setItem(ChiSystem.STORAGE_PREFIX + venueId, newChi.toString());
      } else {
        localStorage.setItem(ChiSystem.STORAGE_PREFIX + venueId, newChi.toString());
      }
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
