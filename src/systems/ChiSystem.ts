/**
 * ChiSystem — Manages per-venue Meta-game CHI tracking.
 * Per PRD Track D, steps D.1 and D.3.
 */
export class ChiSystem {
  private chiMap: Map<string, number> = new Map();
  private static readonly STORAGE_PREFIX = 'trashdash_chi_';

  /**
   * Retrieves the current CHI for a given venue.
   * Per D.3 corrected rule: defaults to 0 on first visit.
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
   * Formula: newChi = clamp(currentChi + (accuracyPct - 50) * 0.3, 0, 100)
   */
  updateChi(venueId: string, roundAccuracyPct: number): number {
    const currentChi = this.getChi(venueId);
    
    let newChi = currentChi + (roundAccuracyPct - 50) * 0.3;
    newChi = Math.max(0, Math.min(100, newChi)); // clamp 0-100

    this.chiMap.set(venueId, newChi);

    // Persist
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ChiSystem.STORAGE_PREFIX + venueId, newChi.toString());
    }

    return newChi;
  }
}
