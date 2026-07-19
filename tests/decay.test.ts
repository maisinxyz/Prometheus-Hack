import { describe, it, expect, beforeEach } from 'vitest';
import { VenueDecayState, DecayState } from '../src/systems/VenueDecayState';

describe('VenueDecayState', () => {
  let decayState: VenueDecayState;

  beforeEach(() => {
    decayState = new VenueDecayState();
  });

  it('starts at CLEAN (0 fails)', () => {
    expect(decayState.getState('test_venue')).toBe(DecayState.CLEAN);
  });

  it('stays CLEAN at 1 fail', () => {
    decayState.registerRound('test_venue', 40); // 1 fail
    expect(decayState.getState('test_venue')).toBe(DecayState.CLEAN);
  });

  it('transitions to DECLINING at 2-3 fails', () => {
    decayState.registerRound('test_venue', 40); // 1
    decayState.registerRound('test_venue', 40); // 2
    expect(decayState.getState('test_venue')).toBe(DecayState.DECLINING);

    decayState.registerRound('test_venue', 40); // 3
    expect(decayState.getState('test_venue')).toBe(DecayState.DECLINING);
  });

  it('transitions to RUINED at 4+ fails', () => {
    decayState.registerRound('test_venue', 40); // 1
    decayState.registerRound('test_venue', 40); // 2
    decayState.registerRound('test_venue', 40); // 3
    decayState.registerRound('test_venue', 40); // 4
    expect(decayState.getState('test_venue')).toBe(DecayState.RUINED);

    decayState.registerRound('test_venue', 40); // 5
    expect(decayState.getState('test_venue')).toBe(DecayState.RUINED);
  });

  it('resets to CLEAN on a successful round', () => {
    // Force to RUINED
    for (let i = 0; i < 4; i++) {
      decayState.registerRound('test_venue', 40);
    }
    expect(decayState.getState('test_venue')).toBe(DecayState.RUINED);

    // One success
    decayState.registerRound('test_venue', 60);
    expect(decayState.getState('test_venue')).toBe(DecayState.CLEAN);
  });
});
