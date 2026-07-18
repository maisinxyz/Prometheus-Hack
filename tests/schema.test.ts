import { describe, it, expect } from 'vitest';
import { BinArraySchema } from '../src/data/schemas/binSchema';
import { ItemArraySchema } from '../src/data/schemas/itemSchema';
import { VenueArraySchema } from '../src/data/schemas/venueSchema';
import { DifficultyTierArraySchema } from '../src/data/schemas/difficultyTierSchema';

import binsData from '../src/data/bins.json';
import itemsData from '../src/data/items.json';
import venuesData from '../src/data/venues.json';
import difficultyTiersData from '../src/data/difficultyTiers.json';

/**
 * Schema validation tests — Per PRD Track A, step A.2.
 * Ensures all JSON data files conform to their Zod schemas.
 */
describe('Data Schema Validation', () => {
  it('bins.json validates against BinSchema', () => {
    expect(() => BinArraySchema.parse(binsData)).not.toThrow();
  });

  it('items.json validates against ItemSchema', () => {
    expect(() => ItemArraySchema.parse(itemsData)).not.toThrow();
  });

  it('venues.json validates against VenueSchema', () => {
    expect(() => VenueArraySchema.parse(venuesData)).not.toThrow();
  });

  it('difficultyTiers.json validates against DifficultyTierSchema', () => {
    expect(() => DifficultyTierArraySchema.parse(difficultyTiersData)).not.toThrow();
  });

  it('every item.correctBinId exists in bins.json', () => {
    const binIds = new Set(binsData.map((b) => b.id));
    for (const item of itemsData) {
      expect(binIds.has(item.correctBinId), `Item "${item.id}" has correctBinId "${item.correctBinId}" not found in bins.json`).toBe(true);
    }
  });

  it('every venue.itemPoolIds entry exists in items.json', () => {
    const itemIds = new Set(itemsData.map((i) => i.id));
    for (const venue of venuesData) {
      for (const poolId of venue.itemPoolIds) {
        expect(itemIds.has(poolId), `Venue "${venue.id}" references item "${poolId}" not found in items.json`).toBe(true);
      }
    }
  });

  it('difficulty tier ranges are contiguous with no gaps or overlaps (0-30, 31-70, 71-100)', () => {
    const tiers = DifficultyTierArraySchema.parse(difficultyTiersData);
    // Sort by chiMin
    const sorted = [...tiers].sort((a, b) => a.chiMin - b.chiMin);

    // First tier starts at 0
    expect(sorted[0]!.chiMin).toBe(0);

    // Last tier ends at 100
    expect(sorted[sorted.length - 1]!.chiMax).toBe(100);

    // Each tier's chiMin is exactly 1 more than the previous tier's chiMax
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i]!.chiMin).toBe(sorted[i - 1]!.chiMax + 1);
    }
  });
});
