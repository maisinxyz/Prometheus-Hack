import { describe, it, expect } from 'vitest';
import venuesData from '../src/data/venues.json';
import { computeChiGain } from '../src/systems/ChiSystem';

describe('Progression System', () => {
  it('has exactly 13 threshold values in the correct order', () => {
    expect(venuesData.length).toBe(13);
    
    const thresholds = venuesData.map(v => v.unlockChiThreshold);
    const expectedThresholds = [
      0,   // Position 1: construction_site
      30,  // Position 2: ferry_docks
      45,  // Position 3: tech_startup
      45,  // Position 4: subway_station
      60,  // Position 5: gym
      60,  // Position 6: public_library
      75,  // Position 7: art_studio
      75,  // Position 8: financial_district_office
      75,  // Position 9: central_park
      75,  // Position 10: times_square
      90,  // Position 11: nyc_hospital
      90,  // Position 12: hot_dog_stand
      90   // Position 13: mackenzie_cafe
    ];
    
    expect(thresholds).toEqual(expectedThresholds);
  });

  it('calculates CHI gain correctly according to Step 1 formula', () => {
    // 100% accuracy = 15 CHI
    expect(computeChiGain(100)).toBeCloseTo(15);
    
    // 90% accuracy -> (90-50) * 0.15 = 40 * 0.15 = 6
    expect(computeChiGain(90)).toBeCloseTo(6);
    
    // 50% accuracy -> (50-50) * 0.15 = 0
    expect(computeChiGain(50)).toBeCloseTo(0);
    
    // 20% accuracy -> floor at 0
    expect(computeChiGain(20)).toBe(0);
  });
});
