import { z } from 'zod';

/**
 * Bin schema — validates entries in bins.json.
 * Per PRD Track A, step A.2.
 */
export const BinSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  color: z.string(),
  logo: z.string().optional(),
});

export type BinDef = z.infer<typeof BinSchema>;

export const BinArraySchema = z.array(BinSchema);
