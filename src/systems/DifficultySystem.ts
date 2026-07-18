import difficultyTiersData from '../data/difficultyTiers.json';
import { DifficultyTierDef } from '../data/schemas/difficultyTierSchema';

/**
 * DifficultySystem — Scales game parameters based on CHI.
 * Per PRD Track E, step E.1.
 */
export class DifficultySystem {
  private tiers: DifficultyTierDef[];

  constructor() {
    this.tiers = difficultyTiersData as DifficultyTierDef[];
  }

  /**
   * Returns the DifficultyTier for a given CHI value.
   */
  getTierForChi(chi: number): DifficultyTierDef {
    // Clamp CHI just in case
    const clampedChi = Math.max(0, Math.min(100, chi));

    for (const tier of this.tiers) {
      if (clampedChi >= tier.chiMin && clampedChi <= tier.chiMax) {
        return tier;
      }
    }

    // Fallback to beginner if something is wrong with the data ranges
    return this.tiers[0]!;
  }
}
