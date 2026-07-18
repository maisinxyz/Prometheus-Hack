import { z } from 'zod';

/**
 * TrashItemDef schema — validates entries in items.json.
 * Per PRD Track A, step A.2/A.3.
 */
export const ItemSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  spriteKey: z.string(),
  correctBinId: z.string(),
  isComposite: z.boolean(),
  componentIds: z.array(z.string()),
  venueIds: z.array(z.string()),
});

export type TrashItemDef = z.infer<typeof ItemSchema>;

export const ItemArraySchema = z.array(ItemSchema);
