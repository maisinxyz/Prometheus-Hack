import { z } from 'zod';

/**
 * DifficultyTier schema — validates entries in difficultyTiers.json.
 * Per PRD Track A, step A.6.
 */
export const DifficultyTierSchema = z.object({
  tier: z.string(),
  chiMin: z.number(),
  chiMax: z.number(),
  trayTimerSec: z.number(),
  errorPenaltyMultiplier: z.number(),
  visualCuesActive: z.boolean(),
  dualTargeting: z.boolean(),
});

export type DifficultyTierDef = z.infer<typeof DifficultyTierSchema>;

export const DifficultyTierArraySchema = z.array(DifficultyTierSchema);
