import { z } from 'zod';

/**
 * Venue schema — validates entries in venues.json.
 * Per PRD Track A, step A.2/A.4.
 */
export const VenueSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  unlockChiThreshold: z.number(),
  itemPoolIds: z.array(z.string()),
  backgroundKeys: z.object({
    clean: z.string(),
    grimy: z.string(),
    ruined: z.string(),
  }),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type VenueDef = z.infer<typeof VenueSchema>;

export const VenueArraySchema = z.array(VenueSchema);
