import difficultyData from '../data/difficultyTiers.json';

export interface DifficultyTier {
  tier: string;
  chiMin: number;
  chiMax: number;
  trayTimerSec: number;
  errorPenaltyMultiplier: number;
  visualCuesActive: boolean;
  dualTargeting: boolean;
}

export class DifficultySystem {
  private tiers: DifficultyTier[];

  constructor() {
    this.tiers = difficultyData as DifficultyTier[];
  }

  /**
   * Retrieves the difficulty tier that matches the given CHI level.
   * If CHI falls outside all ranges, it returns the closest boundary tier.
   */
  public getTierForChi(chi: number): DifficultyTier {
    for (const tier of this.tiers) {
      if (chi >= tier.chiMin && chi <= tier.chiMax) {
        return tier;
      }
    }
    
    // Fallback: return highest or lowest if out of bounds
    if (chi > this.tiers[this.tiers.length - 1]!.chiMax) {
      return this.tiers[this.tiers.length - 1]!;
    }
    return this.tiers[0]!;
  }
}
