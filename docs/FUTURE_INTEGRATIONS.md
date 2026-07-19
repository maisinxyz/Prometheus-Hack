# Future Integrations (Track H)

This document outlines the planned paths for integrating the game with real-world databases and external systems, as defined in PRD Section 7.

## Idea A: Municipal API Integration
Currently, the game uses `src/services/MunicipalPolicyService.ts` to load mock policy updates from a local JSON file (`mockPolicyUpdates.json`). This proves that the architecture successfully allows for dynamic rule changes without requiring a client update.

**Real Integration Path:**
1. Identify a real city API (e.g., NYC OpenData or a Recyclopedia API) that broadcasts rule changes.
2. Replace `fetchPolicyUpdates()` with an actual `fetch()` call to the live endpoint.
3. Implement a daily cron-like "overnight sync" checking `localStorage` for the last synced date to prevent spamming the API on every boot.

## Idea B: Smart Grid / Life Cycle Assessment (LCA)
Not currently implemented. 

**Vision:** Integrate with real-time energy grid APIs (like WattTime) or LCA databases to dynamically calculate the carbon offset score based on the current time of day or regional energy mix where the player is located.

## Idea C: Global Expansion
Not currently implemented.

**Vision:** Allow players to select different global cities (e.g., Tokyo, Berlin) from the map screen, which would completely swap out the `items.json` and `bins.json` schemas to reflect those regions' specific (and often much stricter) sorting laws.
