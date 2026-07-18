/**
 * ChiSystem — Tracks Community Health Index per venue.
 * Per PRD Track D, step D.1.
 */
export class ChiSystem {
  private chiByVenue: Map<string, number> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Gets current CHI for a venue. Defaults to 0 if not played yet.
   */
  public getChi(venueId: string): number {
    if (!this.chiByVenue.has(venueId)) {
      return 0; // Default CHI is 0 per D.3 correction
    }
    return this.chiByVenue.get(venueId)!;
  }

  /**
   * Updates CHI based on round accuracy percentage (0-100).
   * Formula: newChi = clamp(currentChi + (roundAccuracyPct - 50) * 0.3, 0, 100)
   */
  public updateChi(venueId: string, roundAccuracyPct: number): number {
    const currentChi = this.getChi(venueId);
    const delta = (roundAccuracyPct - 50) * 0.3;
    const newChi = Math.max(0, Math.min(100, currentChi + delta));
    
    this.chiByVenue.set(venueId, newChi);
    this.saveToStorage(venueId, newChi);
    
    return newChi;
  }

  private loadFromStorage(): void {
    if (typeof localStorage === 'undefined') return;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('trashdash_chi_')) {
        const venueId = key.substring('trashdash_chi_'.length);
        const value = parseFloat(localStorage.getItem(key) || '0');
        if (!isNaN(value)) {
          this.chiByVenue.set(venueId, value);
        }
      }
    }
  }

  private saveToStorage(venueId: string, value: number): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(`trashdash_chi_${venueId}`, value.toString());
  }
}
