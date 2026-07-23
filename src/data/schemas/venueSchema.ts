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
  binPositions: z.array(z.object({
    x: z.number(),
    y: z.number(),
    scale: z.number().optional()
  })).optional(),
  spawnZones: z.record(z.string(), z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number()
  })).optional(),
});

export type VenueDef = z.infer<typeof VenueSchema>;

export const VenueArraySchema = z.array(VenueSchema);
