import { describe, it, expect, beforeEach } from 'vitest';
import { VenueDecayState, DecayState } from '../src/systems/VenueDecayState';

describe('VenueDecayState', () => {
  let decayState: VenueDecayState;

  beforeEach(() => {
    decayState = new VenueDecayState();
  });

  it('starts CLEAN with 0 fails', () => {
    expect(decayState.getState('test_venue')).toBe(DecayState.CLEAN);
  });

  it('stays CLEAN after 1 fail', () => {
    decayState.recordRound('test_venue', 30);
    expect(decayState.getState('test_venue')).toBe(DecayState.CLEAN);
  });

  it('transitions to DECLINING after 2 fails', () => {
    decayState.recordRound('test_venue', 30);
    decayState.recordRound('test_venue', 20);
    expect(decayState.getState('test_venue')).toBe(DecayState.DECLINING);
  });

  it('stays DECLINING after 3 fails', () => {
    decayState.recordRound('test_venue', 30);
    decayState.recordRound('test_venue', 30);
    decayState.recordRound('test_venue', 30);
    expect(decayState.getState('test_venue')).toBe(DecayState.DECLINING);
  });

  it('transitions to RUINED after 4 fails', () => {
    decayState.recordRound('test_venue', 10);
    decayState.recordRound('test_venue', 10);
    decayState.recordRound('test_venue', 10);
    decayState.recordRound('test_venue', 10);
    expect(decayState.getState('test_venue')).toBe(DecayState.RUINED);
  });

  it('stays RUINED after 5 fails', () => {
    for (let i = 0; i < 5; i++) {
      decayState.recordRound('test_venue', 10);
    }
    expect(decayState.getState('test_venue')).toBe(DecayState.RUINED);
  });

  it('resets to CLEAN on any success', () => {
    for (let i = 0; i < 4; i++) {
      decayState.recordRound('test_venue', 10);
    }
    expect(decayState.getState('test_venue')).toBe(DecayState.RUINED);

    // Any success >= 50 resets to 0 (CLEAN)
    decayState.recordRound('test_venue', 50);
    expect(decayState.getState('test_venue')).toBe(DecayState.CLEAN);
  });
});
