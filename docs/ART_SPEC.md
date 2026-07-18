# TrashDash: NYC Echo — Art Specification

This document outlines the exact specifications for all art deliverables in the game. To ensure a seamless, zero-code-change integration process, please adhere strictly to these formats and naming conventions.

## General Requirements
- **Format**: `.png`
- **Transparency**: Straight Alpha (not pre-multiplied)
- **Color Profile**: sRGB
- **Style**: Hand-drawn, clean outlines, vibrant colors. Note that the game engine applies a procedural drop-shadow and a subtle top-left highlight pass to items and bins automatically. You do not need to bake drop-shadows into the sprites.

## 1. Items (`assets/sprites/items/`)
All draggable trash items.
- **Dimensions**: 256 × 256 pixels
- **Alignment**: Centered in the canvas, occupying roughly 70-80% of the bounds.
- **Naming Convention**: `item_<id>.png` where `<id>` EXACTLY matches the `id` field in `items.json`.
  - Example: `item_paper_plate.png`
  - Example: `item_coffee_cup_lid.png`

## 2. Bins (`assets/sprites/bins/`)
The static drop targets at the bottom of the screen.
- **Dimensions**: 384 × 512 pixels
- **Alignment**: Centered.
- **Naming Convention**: `bin_<id>.png` where `<id>` EXACTLY matches the `id` field in `bins.json`.
  - Example: `bin_paper.png`
  - Example: `bin_compost.png`

## 3. Venues / Backgrounds (`assets/sprites/venues/`)
The environmental backdrops for the levels. Each venue state requires 3 separate layers to support our parallax depth system.
- **Dimensions**: 1920 × 1080 pixels (Full HD)
- **Layers Needed Per State**: Foreground (`fg`), Midground (`mid`), Background (`bg`).
- **States Needed Per Venue**: `clean`, `grimy`, `ruined`.
- **Naming Convention**: `venue_<venueId>_bg_<state>_<layer>.png` where `<venueId>` EXACTLY matches the `id` field in `venues.json`.
  - Example: `venue_mackenzie_cafe_bg_clean_bg.png`
  - Example: `venue_mackenzie_cafe_bg_clean_mid.png`
  - Example: `venue_mackenzie_cafe_bg_clean_fg.png`

> **Note**: For the current prototype phase, we are simply using the `nyc_map_bg.png` as a placeholder for the backgrounds. When the 3-layer parallax art is ready, the `venues.json` data will be updated to point to the 3 distinct keys per state, and the engine will automatically load them.

## 4. UI Elements (`assets/sprites/ui/`)
- `nyc_map_bg.png` (2500x2500 pixels minimum, used for Level Select)

---
*If an expected file is missing, the game's `BootScene` will automatically generate a labeled colored box in its place. To replace a placeholder, simply drop the correctly named `.png` file into the appropriate directory and refresh the game.*
