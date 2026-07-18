# Deferred Mechanics (Track G)

This document contains notes on game mechanics that were explicitly deferred from the MVP implementation, as detailed in PRD Section 3 (Clusters B and C). 

## Cluster B: Multi-material Items & "Drag to Separate"
Currently, items are treated as single materials. In the future, items like a **Coffee Cup with a Plastic Lid** will be considered *composite items*.

### Implementation Notes:
- The `TrashItemDef` schema already includes a `componentIds: string[]` field to support this.
- `src/entities/TrashItem.ts` contains a stubbed `attemptSeparate()` method.
- **Redesign Vision:** Players will be able to perform a "drag-to-separate" gesture (or multi-touch pull) to split the composite item into its base components (e.g., separating the plastic lid from the paper cup) so they can be sorted into different bins. 

## Cluster C: Educational Correction Overlay
The MVP currently uses a simple HUD popup to show end-of-round stats. The original design called for a detailed educational overlay that forces players to acknowledge their specific sorting mistakes.

### Implementation Notes:
- `src/scenes/CorrectionOverlayScene.ts` has been stubbed out to accept a list of mistakes (`CorrectionData[]`).
- `src/data/explanations.json` contains the lookup table for the educational string to show the player.
- **Redesign Vision:** If the player drops a compostable item into the landfill bin, the post-round overlay will show:
  * "You put [Apple Core] in: Landfill | Should go in: Compost"
  * "Why: Organic matter like fruit cores belongs in the compost bin to reduce methane emissions."
- This scene is currently completely bypassed by `HUDScene.ts` ending the round and returning directly to `LevelSelectScene`, but can be easily wired back in by modifying the `pointerup` event on the Continue button in `HUDScene.ts`.
