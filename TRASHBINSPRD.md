# TRASHBINSPRD — 3D Trash Bin Overhaul

## 1. Problem Statement

The trash bins in TrayScene are currently rendered as flat 2D Phaser sprites (`Bin.ts`) that consist of:
- A `backSprite` (the rear rim / hole graphic)
- A `frontSprite` (the front body)
- Procedural Phaser `Graphics` for shadows, glow, and gloss highlights

These 2D sprites are positioned in Phaser's 2D screen-space coordinate system (1920×1080). When the player right-click-drags to orbit the 360° camera in `ThreeJSService`, the bins "slide" because they are not anchored to a fixed 3D world position — they are re-projected each frame using `unprojectPhaserToWorld` / `projectWorldToPhaser`, but their visual appearance remains flat, does not rotate with the camera, and does not match the depth or perspective of the 3D environment.

### Current Rendering Stack

```
Layer            Z-Index    Rendering Engine   Notes
─────────────────────────────────────────────────────────────────────
ThreeJS Canvas   -1 (CSS)   Three.js WebGL     360° sphere / procedural 3D scene
Phaser Canvas    10 (CSS)   Phaser WebGL       TRANSPARENT canvas — bins, items, HUD
MapLibre Map     0 (CSS)    WebGL              Only visible on LevelSelectScene
```

The Phaser canvas is set to `transparent: true` in `GameConfig.ts`, so the Three.js background shows through. All game objects (bins, items, HUD) live in Phaser's flat 2D layer on top.

### What We Want

Bins that:
1. Are rendered as 3D objects **inside the Three.js scene**, not as 2D Phaser sprites
2. Rotate and foreshorten correctly when the camera orbits
3. Match the visual style and material palette of each venue (e.g., dark cast-iron green in Central Park, sterile stainless steel in the Hospital)
4. Are placed at realistic positions within each venue's layout (near walls, beside counters, in open floor areas)
5. Maintain functional drop-target hit boxes in Phaser's 2D coordinate system so drag-and-drop still works
6. Have proper lighting, shadows, and ambient occlusion from the Three.js lighting rig

---

## 2. Architecture Overview

### 2.1 Hybrid Rendering Approach (Three.js Visuals + Phaser Hit Zones)

The bins will be split into two layers:

| Layer | Responsibility | Engine |
|-------|---------------|--------|
| **Visual 3D Mesh** | The visible bin geometry, materials, lighting, shadows, and category-color indicators | Three.js (inside `ThreeJSService`) |
| **Invisible Hit Zone** | The Phaser `Zone` that acts as the drag-and-drop target, projected from the 3D mesh's screen position each frame | Phaser (invisible `Zone` only — no sprites) |

This means:
- `Bin.ts` will **no longer create `backSprite`, `frontSprite`, `shadowGraphics`, `glowGraphics`, or `glossGraphics`**
- Instead, `Bin.ts` will hold a reference to a Three.js `Object3D` (the 3D bin mesh) and sync its Phaser `Zone` position every frame by projecting the mesh's world position to screen coordinates
- The 3D bin meshes will be built by `ThreeJSService` using the same procedural geometry system already used for venue props

### 2.2 Files to Modify

| File | Changes |
|------|---------|
| `src/entities/Bin.ts` | Gut the 2D sprite logic. Replace with a thin wrapper around a Phaser `Zone` + a reference to a Three.js `Object3D`. |
| `src/services/ThreeJSService.ts` | Add a `createBinMesh()` method that builds a 3D trash bin from primitives. Add a `addVenueBins()` method that places bins for a given venue. Expose bin meshes for screen-space projection. |
| `src/scenes/TrayScene.ts` | Update `createBins()` to call the new ThreeJS bin placement. Update `update()` to project 3D bin positions to Phaser zones each frame. |
| `src/data/venues.json` | Update `binPositions` arrays to include 3D world coordinates (`wx`, `wy`, `wz`) and rotation angles (`ry`) for each bin in each venue. |
| `src/data/schemas/venueSchema.ts` | Extend the `binPositions` schema to include 3D position and rotation fields. |
| `src/config/venueEnvironments.ts` | Add `binStyle` overrides per venue for material colors, roughness, metalness, and form-factor. |

### 2.3 New Type Definitions

```typescript
// Add to venueSchema.ts or a new binPlacement.ts
interface BinPlacement3D {
  x: number;       // Phaser fallback X (screen space, used for non-3D venues)
  y: number;       // Phaser fallback Y
  scale?: number;  // Phaser fallback scale
  wx: number;      // Three.js world X position
  wy: number;      // Three.js world Y position (height off floor)
  wz: number;      // Three.js world Z position (depth into scene)
  ry?: number;     // Y-axis rotation in radians (to face the player)
}

interface VenueBinStyle {
  bodyColor: string;          // Hex color for bin body
  bodyRoughness: number;
  bodyMetalness: number;
  lidColor?: string;          // Optional lid color
  labelStyle: 'painted' | 'sticker' | 'embossed';
  formFactor: 'nyc_wire_basket' | 'pedal_bin' | 'slim_office' | 'park_cast_iron' | 'industrial_dumpster' | 'cafe_wooden';
  heightScale?: number;       // Relative height multiplier (default 1.0)
}
```

---

## 3. 3D Bin Mesh Construction — Step-by-Step

### 3.1 Base Bin Geometry

Each bin will be procedurally constructed from Three.js primitives inside `ThreeJSService.createBinMesh()`:

```
Method: createBinMesh(binDef: BinDef, style: VenueBinStyle): THREE.Group
```

**Step 1: Create a Group container**
```typescript
const binGroup = new THREE.Group();
```

**Step 2: Build the body based on `formFactor`**

| formFactor | Geometry | Description |
|------------|----------|-------------|
| `nyc_wire_basket` | CylinderGeometry (open top, wireframe overlay) | Classic NYC street-corner wire mesh trash can. Tapered cylinder with a flat base plate. |
| `pedal_bin` | CylinderGeometry (closed) + BoxGeometry lid | Indoor pedal-operated bin. Smooth metal cylinder with a hinged lid. |
| `slim_office` | BoxGeometry (tall, narrow) | Rectangular slim office bin. Sharp corners, matte plastic look. |
| `park_cast_iron` | CylinderGeometry (ribbed) + half-sphere rim | Classic park cast-iron bin with vertical ribs and a domed opening. |
| `industrial_dumpster` | BoxGeometry (wide, low) | Large open-top rectangular dumpster. |
| `cafe_wooden` | CylinderGeometry with wood-grain procedural texture | Small wooden café waste bin. Warm oak/walnut appearance. |

**Step 3: Build the opening indicator ring**
- A `TorusGeometry` or `RingGeometry` at the top of the bin
- Colored to match `binDef.color` (blue for recycling, green for compost, black for landfill, grey for plastic)
- This is the player's visual cue for which category the bin represents
- Apply `emissive` property with `emissiveIntensity: 0.5` so the color ring subtly glows even in dim lighting

**Step 4: Build the category label**
- Use a `PlaneGeometry` on the front face of the bin
- Apply a `CanvasTexture` with the bin's `displayName` text and `logo` emoji
- This replaces the separate Phaser text labels

**Step 5: Build the ground shadow**
- A flat `PlaneGeometry` disc directly below the bin, rotated flat
- `MeshBasicMaterial` with `color: 0x000000`, `transparent: true`, `opacity: 0.4`
- Slightly larger than the bin's footprint

**Step 6: Apply materials using the `VenueBinStyle`**
```typescript
const bodyMaterial = new THREE.MeshStandardMaterial({
  color: style.bodyColor,
  roughness: style.bodyRoughness,
  metalness: style.bodyMetalness,
});
```

**Step 7: Enable shadows**
```typescript
bodyMesh.castShadow = true;
bodyMesh.receiveShadow = true;
```

**Step 8: Add the completed group to the Three.js scene**
```typescript
binGroup.position.set(placement.wx, placement.wy, placement.wz);
binGroup.rotation.y = placement.ry ?? 0;
this.scene.add(binGroup);
```

### 3.2 The "Hole" Visual

The bin opening must be visually dark to create the illusion of depth:
- Place a `CircleGeometry` (for cylindrical bins) or `PlaneGeometry` (for box bins) at the opening
- Apply `MeshBasicMaterial` with `color: 0x111111` (deep black, no lighting)
- Position it just inside the rim so it looks like you're looking down into a dark interior

---

## 4. Per-Venue Bin Placement & Style Specifications

### CRITICAL: Texture-Based vs Procedural Venues

The game has **TWO types of 3D venues**:

1. **Texture-Based** (360° panoramic image on a sphere): `construction_site`, `ferry_docks`, `tech_startup`, `subway_station`, `gym`, `art_studio`, `financial_district_office`, `times_square`, `hot_dog_stand`, `central_park`, `nyc_hospital`, `mackenzie_cafe`, `public_library`, `community_park`

2. **Procedural** (3D props built from primitives in `venueEnvironments.ts`): Currently `central_park`, `nyc_hospital`, `mackenzie_cafe`, `public_library` have procedural definitions, but they are NOT in the `PROCEDURAL_VENUE_IDS` array — they are rendered as texture venues.

For **texture-based venues**, the 3D bins will be placed inside the existing 360° sphere using world coordinates calculated from the desired screen positions. Since the environment is a static 360° photo mapped onto a sphere, the bins will be the only true 3D objects rendered by Three.js during gameplay. This actually makes them POP nicely since they'll have real geometry and lighting against the flat panoramic background.

For **all venues**, the approach is the same: place `THREE.Group` objects in the Three.js world space, and project their positions to Phaser screen space each frame for the invisible hit zones.

---

### 4.1 CONSTRUCTION SITE (`construction_site`)

**Environment Context**: Abandoned/active construction site. Outdoor, industrial. 360° photo: dirt ground, scaffolding, heavy machinery, orange barriers. The player also has a RockCrusher machine at `(1650, 850)`.

**Bin Style**:
```
formFactor: 'industrial_dumpster'
bodyColor: '#FACC15'       (industrial safety yellow)
bodyRoughness: 0.7
bodyMetalness: 0.3
labelStyle: 'painted'
heightScale: 0.8           (smaller scale — these are skip bins)
```

**Bin Placements** (4 bins):
The existing `binPositions` places them tightly at `x: 820–1060, y: 575, scale: 0.28` — a row near the center of the screen, quite small. These are positioned to be visible against the dirt ground in the lower-center of the panorama.

| Bin Index | Category   | 3D World Position (wx, wy, wz) | Rotation (ry) | Rationale |
|-----------|-----------|-------------------------------|---------------|-----------|
| 0 | Recycling | (-3.0, -2.3, 45) | 0.0 | Left side of the construction floor, near scaffolding |
| 1 | Compost   | (-1.5, -2.3, 45) | 0.0 | Next to recycling, grouped together |
| 2 | Landfill  | (1.5, -2.3, 45) | 0.0 | Right side, spaced from compost |
| 3 | Plastic   | (3.0, -2.3, 45) | 0.0 | Far right, near edge of work zone |

> **NOTE**: For texture-based venues, `wz: 45–50` places objects on the sphere surface approximately where the "floor" appears. The exact values will need to be tuned by running the game and adjusting. The `wy` value of `-2.3` places bins at approximate floor level.

**Lighting Notes**: The 360° photo has natural daylight. Three.js should add a subtle directional light when bins are present to ensure they receive proper shading. Use warm daylight color `#FFF8E1`.

**Special Considerations**: 
- The RockCrusher is also positioned here and uses the same 3D projection system
- Bins should NOT overlap with the crusher's bounds
- The industrial dumpster form factor fits the construction aesthetic

---

### 4.2 FERRY DOCKS (`ferry_docks`)

**Environment Context**: Outdoor waterfront ferry terminal. 360° photo: wooden dock planks, water, boats, ropes. Maritime/nautical feel.

**Bin Style**:
```
formFactor: 'park_cast_iron'
bodyColor: '#1E3A5F'       (deep nautical navy blue)
bodyRoughness: 0.5
bodyMetalness: 0.6
labelStyle: 'painted'
heightScale: 1.0
```

**Bin Placements** (4 bins):
Current positions: `x: 600–1050, y: 890, scale: 0.55` — bottom of screen, spread along the dock.

| Bin Index | Category   | 3D World Position (wx, wy, wz) | Rotation (ry) | Rationale |
|-----------|-----------|-------------------------------|---------------|-----------|
| 0 | Recycling | (-4.0, -2.3, 45) | 0.15 | Left side of dock, slightly angled toward player |
| 1 | Compost   | (-1.5, -2.3, 45) | 0.05 | Left-center, aligned with dock planks |
| 2 | Landfill  | (1.5, -2.3, 45) | -0.05 | Right-center |
| 3 | Plastic   | (4.0, -2.3, 45) | -0.15 | Right side, slightly angled |

**Lighting Notes**: Cool blue-tinted ambient from water reflections. Add a point light at `(0, 3, 48)` with color `#BAE6FD`, intensity 1.5.

**Special Considerations**: 
- Bins should look like harbor/dock waste bins — cast iron or heavy-gauge painted steel
- Slight weathering would be ideal (increase roughness to 0.7)

---

### 4.3 TECH STARTUP (`tech_startup`)

**Environment Context**: Modern open-plan office. 360° photo: standing desks, monitors, whiteboard, industrial exposed-brick walls, neon accent lighting.

**Bin Style**:
```
formFactor: 'slim_office'
bodyColor: '#1F2937'       (dark charcoal — modern office aesthetic)
bodyRoughness: 0.3
bodyMetalness: 0.1
labelStyle: 'sticker'
heightScale: 1.0
```

**Bin Placements** (4 bins):
Current positions: `x: 600–1050, y: 900, scale: 0.5` — bottom row.

| Bin Index | Category   | 3D World Position (wx, wy, wz) | Rotation (ry) | Rationale |
|-----------|-----------|-------------------------------|---------------|-----------|
| 0 | Recycling | (-4.5, -2.3, 45) | 0.2 | Near a desk cluster, left side |
| 1 | Compost   | (-1.5, -2.3, 45) | 0.0 | Near center, by the kitchen area |
| 2 | Landfill  | (1.5, -2.3, 45) | 0.0 | Center-right |
| 3 | Plastic   | (4.5, -2.3, 45) | -0.2 | Right side, near supply area |

**Lighting Notes**: Cool-white overhead fluorescent tone. The 360° photo already has this lighting baked in.

**Special Considerations**: 
- Slim rectangular bins fit the modern office aesthetic
- Consider a matte finish for the body with a small recycling/compost sticker on the front panel

---

### 4.4 SUBWAY STATION (`subway_station`)

**Environment Context**: Underground subway platform. 360° photo: tiled walls, platform edge, tracks, columns, overhead lighting. The photo is rotated `mesh.rotation.y = -Math.PI / 2 + 1.0` to center the platform.

**Bin Style**:
```
formFactor: 'nyc_wire_basket'
bodyColor: '#374151'       (dark gunmetal grey)
bodyRoughness: 0.6
bodyMetalness: 0.7
labelStyle: 'painted'
heightScale: 1.0
```

**Bin Placements** (4 bins):
Current positions: `x: 480,630 (left cluster) and 1275,1425 (right cluster), y: 880/755, scale: 0.75` — two pairs on different platforms.

| Bin Index | Category   | 3D World Position (wx, wy, wz) | Rotation (ry) | Rationale |
|-----------|-----------|-------------------------------|---------------|-----------|
| 0 | Recycling | (-6.0, -2.3, 45) | 0.3 | Left platform, near column |
| 1 | Compost   | (-4.5, -2.3, 45) | 0.3 | Left platform, adjacent |
| 2 | Landfill  | (4.5, -2.0, 42) | -0.3 | Right platform (slightly elevated — different platform level) |
| 3 | Plastic   | (6.0, -2.0, 42) | -0.3 | Right platform, adjacent |

**Lighting Notes**: Harsh overhead fluorescent lighting. Add directional light `(0, 5, 45)`, color `#F0F0F0`, intensity 2.0. Yellow-tinted point lights to simulate platform ceiling lights.

**Special Considerations**: 
- The split placement (two bins left, two right) mirrors real NYC subway stations where bins are placed on each platform
- NYC wire basket is the authentic subway bin style
- The rotation values angle the bins to face the player from each platform position

---

### 4.5 GYM / FITNESS CENTER (`gym`)

**Environment Context**: Indoor gym. 360° photo: exercise equipment, mirrors, rubber flooring, bright overhead lighting.

**Bin Style**:
```
formFactor: 'pedal_bin'
bodyColor: '#F1F5F9'       (clean white/light grey — gym aesthetic)
bodyRoughness: 0.2
bodyMetalness: 0.4
labelStyle: 'sticker'
heightScale: 0.9
```

**Bin Placements** (4 bins):
Current positions: `x: 600–1050, y: 900, scale: 0.5` — bottom row.

| Bin Index | Category   | 3D World Position (wx, wy, wz) | Rotation (ry) | Rationale |
|-----------|-----------|-------------------------------|---------------|-----------|
| 0 | Recycling | (-4.0, -2.3, 45) | 0.1 | Near water fountain area |
| 1 | Compost   | (-1.5, -2.3, 45) | 0.0 | Near smoothie/nutrition bar |
| 2 | Landfill  | (1.5, -2.3, 45) | 0.0 | Near equipment |
| 3 | Plastic   | (4.0, -2.3, 45) | -0.1 | Near locker entrance |

**Lighting Notes**: Bright, even overhead gym lighting. High-intensity ambient.

**Special Considerations**: 
- Pedal bins are appropriate for gym environments (hygienic, hands-free)
- Clean white/grey body matches gym aesthetics
- Consider a slight blue tint for the recycling bin body to distinguish it further

---

### 4.6 PUBLIC LIBRARY (`public_library`)

**Environment Context**: Grand hall with arched windows, mahogany bookshelves, marble pillars, brass chandeliers, study tables with banker's lamps. Procedural environment defined in `venueEnvironments.ts`. Camera at `(0, 2.0, 10.5)`, target `(0, -0.5, 0)`.

**Bin Style**:
```
formFactor: 'cafe_wooden'
bodyColor: '#451A03'       (dark mahogany — matching bookshelf wood)
bodyRoughness: 0.55
bodyMetalness: 0.0
labelStyle: 'embossed'
heightScale: 0.85          (smaller — library bins are discreet)
```

**Bin Placements** (4 bins):
Current positions: `x: 480,660 (left pair), 1260,1440 (right pair), y: 860, scale: 0.75`

| Bin Index | Category   | 3D World Position (wx, wy, wz) | Rotation (ry) | Rationale |
|-----------|-----------|-------------------------------|---------------|-----------|
| 0 | Recycling | (-5.5, -2.3, 3.5) | 0.2 | Left of study table, between book bank and pillar |
| 1 | Compost   | (-3.8, -2.3, 3.5) | 0.15 | Left of center, near study table end |
| 2 | Landfill  | (3.8, -2.3, 3.5) | -0.15 | Right of center, near study table end |
| 3 | Plastic   | (5.5, -2.3, 3.5) | -0.2 | Right side, between book bank and pillar |

**Lighting Notes**: The procedural library scene already has warm ivory ambient light, brass chandeliers with point lights, and green banker's lamp glow. The bin meshes will automatically receive this lighting when placed in the Three.js scene.

**Special Considerations**: 
- Library bins should be wood-toned and discreet, blending with the mahogany furniture
- The embossed label style matches the ornate, traditional aesthetic
- Category color rings should be slightly dimmer (lower emissive intensity: 0.3) to maintain the quiet atmosphere
- Bins are positioned in front of (higher Z than) the book banks but behind (lower Z than) the study table to create proper depth layering

---

### 4.7 ART STUDIO (`art_studio`)

**Environment Context**: Bohemian art studio. 360° photo: easels, canvases, paint splatters, large windows with natural light, concrete floor.

**Bin Style**:
```
formFactor: 'industrial_dumpster'
bodyColor: '#64748B'       (neutral slate grey — canvas for paint splatters)
bodyRoughness: 0.8
bodyMetalness: 0.2
labelStyle: 'painted'
heightScale: 0.9
```

**Bin Placements** (4 bins):
No custom `binPositions` in `venues.json` — falls back to default centered row.

| Bin Index | Category   | 3D World Position (wx, wy, wz) | Rotation (ry) | Rationale |
|-----------|-----------|-------------------------------|---------------|-----------|
| 0 | Recycling | (-4.5, -2.3, 45) | 0.1 | Near paint storage area |
| 1 | Compost   | (-1.5, -2.3, 45) | 0.0 | Center-left |
| 2 | Landfill  | (1.5, -2.3, 45) | 0.0 | Center-right, near worktable |
| 3 | Plastic   | (4.5, -2.3, 45) | -0.1 | Near supply shelf |

**Lighting Notes**: Natural side-lighting from studio windows. Warm afternoon tones.

**Special Considerations**: 
- Consider adding procedural paint splatter marks on the bin body (random colored dots on the CanvasTexture)
- The industrial dumpster form factor makes sense for art studios (they generate large volumes of waste)

---

### 4.8 FINANCIAL DISTRICT OFFICE (`financial_district_office`)

**Environment Context**: High-rise corporate office. 360° photo: glass walls, city skyline view, executive desks, leather chairs, stainless steel fixtures.

**Bin Style**:
```
formFactor: 'slim_office'
bodyColor: '#1E293B'       (dark slate — executive office)
bodyRoughness: 0.15
bodyMetalness: 0.6
labelStyle: 'sticker'
heightScale: 1.0
```

**Bin Placements** (4 bins):
No custom `binPositions` — falls back to default.

| Bin Index | Category   | 3D World Position (wx, wy, wz) | Rotation (ry) | Rationale |
|-----------|-----------|-------------------------------|---------------|-----------|
| 0 | Recycling | (-4.5, -2.3, 45) | 0.15 | Near desk cluster, left wing |
| 1 | Compost   | (-1.5, -2.3, 45) | 0.0 | Kitchen/break area |
| 2 | Landfill  | (1.5, -2.3, 45) | 0.0 | Near printer/copy area |
| 3 | Plastic   | (4.5, -2.3, 45) | -0.15 | Right side, near water cooler |

**Lighting Notes**: Cool white overhead panel lighting with warm accent from desk lamps.

**Special Considerations**: 
- Very sleek, professional appearance
- High metalness for a brushed-steel look
- The sticker labels should look like printed office labels (clean, professional font)

---

### 4.9 CENTRAL PARK (`central_park`)

**Environment Context**: NYC's Central Park with lake, fountain, trees, benches, lampposts. 360° photo rotated to center the park vista. Procedural environment also defined in `venueEnvironments.ts` (but rendered as texture).

**Bin Style**:
```
formFactor: 'park_cast_iron'
bodyColor: '#14532D'       (dark forest green — classic NYC park bin)
bodyRoughness: 0.65
bodyMetalness: 0.4
labelStyle: 'painted'
heightScale: 1.1           (slightly taller — park bins are prominent)
```

**Bin Placements** (4 bins):
Current positions: `x: 75, 525, 1165, 1800, y: 880, scale: 0.72` — spread VERY wide across the entire screen width.

| Bin Index | Category   | 3D World Position (wx, wy, wz) | Rotation (ry) | Rationale |
|-----------|-----------|-------------------------------|---------------|-----------|
| 0 | Recycling | (-8.0, -2.3, 45) | 0.3 | Far left, near park entrance/lamppost |
| 1 | Compost   | (-3.0, -2.3, 45) | 0.15 | Left of center, near bench |
| 2 | Landfill  | (3.0, -2.3, 45) | -0.15 | Right of center, near fountain path |
| 3 | Plastic   | (8.0, -2.3, 45) | -0.3 | Far right, near park exit |

**Lighting Notes**: Warm afternoon sunlight from the left. The 360° photo has golden-hour warmth baked in.

**Special Considerations**: 
- This is the iconic NYC park bin — dark green cast iron with vertical ribs
- Wide spread matches the expansive outdoor feel of the park
- Each bin should have a slightly different Y rotation to face the player naturally from different angles
- The category color ring should be on a separate flat disc on top, simulating the real NYC park bin signage system

---

### 4.10 TIMES SQUARE (`times_square`)

**Environment Context**: Busy urban intersection. 360° photo: neon signs, billboards, Broadway theatres, yellow cabs, crowds, bright overwhelming lighting.

**Bin Style**:
```
formFactor: 'nyc_wire_basket'
bodyColor: '#27272A'       (dark zinc/charcoal)
bodyRoughness: 0.5
bodyMetalness: 0.7
labelStyle: 'painted'
heightScale: 1.0
```

**Bin Placements** (4 bins):
No custom `binPositions` — falls back to default.

| Bin Index | Category   | 3D World Position (wx, wy, wz) | Rotation (ry) | Rationale |
|-----------|-----------|-------------------------------|---------------|-----------|
| 0 | Recycling | (-4.0, -2.3, 45) | 0.2 | Street corner, near sidewalk |
| 1 | Compost   | (-1.2, -2.3, 45) | 0.0 | Near food vendor area |
| 2 | Landfill  | (1.2, -2.3, 45) | 0.0 | Near pedestrian crosswalk |
| 3 | Plastic   | (4.0, -2.3, 45) | -0.2 | Opposite corner |

**Lighting Notes**: Extremely bright, multi-colored ambient from neon signs. Add colorful point lights to simulate billboard reflections.

**Special Considerations**: 
- NYC wire basket is the authentic Times Square bin
- Consider adding subtle neon reflections on the metallic surface (increase metalness)
- These bins are heavily used in real life — a slightly "weathered" appearance with higher roughness would be realistic

---

### 4.11 NYC HOSPITAL (`nyc_hospital`)

**Environment Context**: Clinical hospital hallway with waiting room chairs, reception desk, TV, hand sanitizer station. Procedural environment defined in `venueEnvironments.ts`. Camera at `(0, 2.0, 10.5)`, target `(0, -0.5, 0)`. Floor is polished teal vinyl.

**Bin Style**:
```
formFactor: 'pedal_bin'
bodyColor: '#E2E8F0'       (clinical stainless steel silver)
bodyRoughness: 0.1
bodyMetalness: 0.8
labelStyle: 'sticker'
heightScale: 1.0
```

**Bin Placements** (4 bins):
Current positions: `x: 460,640 (left pair), 1280,1460 (right pair), y: 860, scale: 0.72`

| Bin Index | Category   | 3D World Position (wx, wy, wz) | Rotation (ry) | Rationale |
|-----------|-----------|-------------------------------|---------------|-----------|
| 0 | Recycling | (-6.0, -2.3, 3.5) | 0.25 | Left waiting area, beside chair row |
| 1 | Compost   | (-4.2, -2.3, 3.5) | 0.15 | Left side, near sanitizer station |
| 2 | Landfill  | (4.2, -2.3, 3.5) | -0.15 | Right waiting area, beside chair row |
| 3 | Plastic   | (6.0, -2.3, 3.5) | -0.25 | Right side, near wall TV |

**Lighting Notes**: The procedural hospital scene has bright clinical white/blue lighting already. The bins will receive proper ambient from `F0F9FF` ambient and the overhead point light at `(0, 6.0, 2)`.

**Special Considerations**: 
- Hospital bins must look sterile and professional
- Very high metalness and low roughness for a polished stainless-steel look
- Pedal bins are hygienic and appropriate for hospital environments
- The category color ring should be prominent — in a hospital, sorting waste correctly matters (biohazard vs recyclable)
- Consider adding a small red biohazard symbol sticker on the landfill bin for realism

---

### 4.12 HOT DOG STAND (`hot_dog_stand`)

**Environment Context**: NYC street vendor hot dog stand. 360° photo: cart with umbrella, condiment bottles, steam, sidewalk, buildings. Photo rotated `mesh.rotation.y = -Math.PI * 1.5` to center the stand.

**Bin Style**:
```
formFactor: 'nyc_wire_basket'
bodyColor: '#374151'       (standard NYC grey)
bodyRoughness: 0.6
bodyMetalness: 0.5
labelStyle: 'painted'
heightScale: 0.9
```

**Bin Placements** (4 bins):
Current positions: `x: 1015,1145,1275,1405, y: 750-810, scale: 0.58` — a diagonal descending row on the right side.

| Bin Index | Category   | 3D World Position (wx, wy, wz) | Rotation (ry) | Rationale |
|-----------|-----------|-------------------------------|---------------|-----------|
| 0 | Recycling | (2.0, -2.3, 42) | -0.3 | Right side, near stand counter |
| 1 | Compost   | (3.5, -2.2, 43) | -0.25 | Slightly behind and right |
| 2 | Landfill  | (5.0, -2.1, 44) | -0.2 | Further right, along sidewalk |
| 3 | Plastic   | (6.5, -2.0, 45) | -0.15 | Far right, near curb |

**Lighting Notes**: Outdoor daytime with warm tones from the food cart's umbrella. Add warm point light `#FBBF24` at `(3, 2, 43)`.

**Special Considerations**: 
- The diagonal placement mirrors the current 2D positions and creates perspective depth
- Each bin is placed slightly further back (increasing Z) and higher (increasing Y) to simulate the sidewalk receding into the distance
- The bins should cluster near the hot dog stand since that's where food waste is generated

---

### 4.13 MACKENZIE CAFE (`mackenzie_cafe`)

**Environment Context**: Cozy West Village café with exposed brick walls, barista counter with chalkboard menu, bistro tables, pendant lamps, storefront windows. Procedural environment defined in `venueEnvironments.ts`. Camera at `(0, 2.0, 10.5)`, target `(0, -0.5, 0)`. Floor is warm oak hexagonal tiles.

**Bin Style**:
```
formFactor: 'cafe_wooden'
bodyColor: '#78350F'       (warm walnut wood — matching café furniture)
bodyRoughness: 0.6
bodyMetalness: 0.0
labelStyle: 'painted'
heightScale: 0.85          (smaller — café bins are discreet)
```

**Bin Placements** (4 bins):
Current positions: `x: 340,500 (left pair), 1420,1580 (right pair), y: 870, scale: 0.72`

| Bin Index | Category   | 3D World Position (wx, wy, wz) | Rotation (ry) | Rationale |
|-----------|-----------|-------------------------------|---------------|-----------|
| 0 | Recycling | (-7.0, -2.3, 4.0) | 0.3 | Left corner, near monstera plant and left wall |
| 1 | Compost   | (-5.5, -2.3, 4.0) | 0.2 | Left side, between plant and left bistro table |
| 2 | Landfill  | (5.5, -2.3, 4.0) | -0.2 | Right side, near right wall/window |
| 3 | Plastic   | (7.0, -2.3, 4.0) | -0.3 | Right corner, near right wall |

**Lighting Notes**: The procedural café scene has warm pendant lamp lighting with amber/gold tones. The bins will receive proper warm lighting from the spot light at `(0, 6.5, 3.5)` and the point lights at `(-6, 3.5, 0)` and `(6, 3.5, 0)`.

**Special Considerations**: 
- Wooden café bins blend with the mahogany counter and walnut tables
- The bins should have the same warm tint that `Bin.ts` currently applies (`0xffebd2`) but through material properties
- Pairs of bins (2 left, 2 right) are placed flanking the café, keeping the center clear for the barista counter and seating areas
- Position Z=4.0 places them in front of the counter and seating, close to the camera for easy access

---

### 4.14 COMMUNITY PARK (`community_park`)

**Environment Context**: Neighborhood park with grass, playground, benches. 360° photo. Similar to Central Park but smaller, more residential.

**Bin Style**:
```
formFactor: 'park_cast_iron'
bodyColor: '#166534'       (medium green — residential park)
bodyRoughness: 0.7
bodyMetalness: 0.3
labelStyle: 'painted'
heightScale: 1.0
```

**Bin Placements** (4 bins):
No custom `binPositions` — falls back to default.

| Bin Index | Category   | 3D World Position (wx, wy, wz) | Rotation (ry) | Rationale |
|-----------|-----------|-------------------------------|---------------|-----------|
| 0 | Recycling | (-5.0, -2.3, 45) | 0.15 | Near playground entrance |
| 1 | Compost   | (-1.5, -2.3, 45) | 0.0 | Near picnic table |
| 2 | Landfill  | (1.5, -2.3, 45) | 0.0 | Near benches |
| 3 | Plastic   | (5.0, -2.3, 45) | -0.15 | Near park exit |

**Lighting Notes**: Bright outdoor daylight, similar to Central Park.

**Special Considerations**: 
- Identical style to Central Park but slightly smaller and less ornate
- This venue also has 5 sub-levels (`community_park_level_1` through `_level_5`) — all should use the same bin placement and style

---

## 5. Implementation Instructions — Step-by-Step for Claude Code

### Phase 1: Extend Data Schemas

**Step 1.1: Update `src/data/schemas/venueSchema.ts`**

Add 3D position fields to the `binPositions` array schema:

```typescript
binPositions: z.array(z.object({
  x: z.number(),
  y: z.number(),
  scale: z.number().optional(),
  wx: z.number().optional(),     // Three.js world X
  wy: z.number().optional(),     // Three.js world Y
  wz: z.number().optional(),     // Three.js world Z
  ry: z.number().optional(),     // Y-axis rotation (radians)
})).optional(),
```

**Step 1.2: Update `src/data/venues.json`**

For EVERY venue entry, add `wx`, `wy`, `wz`, and `ry` fields to each bin position object. Use the values specified in Section 4 of this document. Preserve the existing `x`, `y`, `scale` values as fallbacks. For venues that don't yet have `binPositions`, add them.

Example for `construction_site`:
```json
"binPositions": [
  { "x": 820, "y": 575, "scale": 0.28, "wx": -3.0, "wy": -2.3, "wz": 45, "ry": 0.0 },
  { "x": 900, "y": 575, "scale": 0.28, "wx": -1.5, "wy": -2.3, "wz": 45, "ry": 0.0 },
  { "x": 980, "y": 575, "scale": 0.28, "wx": 1.5, "wy": -2.3, "wz": 45, "ry": 0.0 },
  { "x": 1060, "y": 575, "scale": 0.28, "wx": 3.0, "wy": -2.3, "wz": 45, "ry": 0.0 }
]
```

---

### Phase 2: Add Bin Style Configuration

**Step 2.1: Create `src/config/binStyles.ts`**

Create a new file that maps venue IDs to `VenueBinStyle` objects:

```typescript
export interface VenueBinStyle {
  bodyColor: string;
  bodyRoughness: number;
  bodyMetalness: number;
  lidColor?: string;
  labelStyle: 'painted' | 'sticker' | 'embossed';
  formFactor: 'nyc_wire_basket' | 'pedal_bin' | 'slim_office' | 'park_cast_iron' | 'industrial_dumpster' | 'cafe_wooden';
  heightScale?: number;
}

export const VENUE_BIN_STYLES: Record<string, VenueBinStyle> = {
  construction_site: {
    formFactor: 'industrial_dumpster',
    bodyColor: '#FACC15',
    bodyRoughness: 0.7,
    bodyMetalness: 0.3,
    labelStyle: 'painted',
    heightScale: 0.8,
  },
  // ... one entry for every venue (see Section 4)
};

export function getBinStyle(venueId: string): VenueBinStyle {
  return VENUE_BIN_STYLES[venueId] ?? {
    formFactor: 'nyc_wire_basket',
    bodyColor: '#374151',
    bodyRoughness: 0.5,
    bodyMetalness: 0.5,
    labelStyle: 'painted',
    heightScale: 1.0,
  };
}
```

Populate every venue ID from `venues.json` using the exact style specifications in Section 4.

---

### Phase 3: Build 3D Bin Meshes in ThreeJSService

**Step 3.1: Add `createBinMesh()` method to `ThreeJSServiceSingleton`**

This method builds a single 3D bin from Three.js primitives.

```typescript
private createBinMesh(binDef: BinDef, style: VenueBinStyle): THREE.Group {
  const group = new THREE.Group();
  const h = (style.heightScale ?? 1.0);

  // 1. Build body based on formFactor
  let bodyMesh: THREE.Mesh;
  const bodyMat = new THREE.MeshStandardMaterial({
    color: style.bodyColor,
    roughness: style.bodyRoughness,
    metalness: style.bodyMetalness,
  });

  switch (style.formFactor) {
    case 'nyc_wire_basket': {
      // Tapered cylinder with wireframe overlay
      const outer = new THREE.CylinderGeometry(0.35 * h, 0.3 * h, 0.9 * h, 16, 1, true);
      bodyMesh = new THREE.Mesh(outer, bodyMat);
      
      // Wire overlay
      const wireGeo = new THREE.CylinderGeometry(0.36 * h, 0.31 * h, 0.91 * h, 16, 4, true);
      const wireMat = new THREE.MeshStandardMaterial({
        color: style.bodyColor,
        wireframe: true,
        roughness: 0.4,
        metalness: 0.8,
      });
      const wireMesh = new THREE.Mesh(wireGeo, wireMat);
      group.add(wireMesh);
      
      // Base plate
      const baseGeo = new THREE.CylinderGeometry(0.3 * h, 0.3 * h, 0.02, 16);
      const baseMesh = new THREE.Mesh(baseGeo, bodyMat);
      baseMesh.position.y = -0.44 * h;
      group.add(baseMesh);
      break;
    }
    case 'pedal_bin': {
      // Smooth cylinder with lid
      const cylGeo = new THREE.CylinderGeometry(0.3 * h, 0.28 * h, 0.85 * h, 20);
      bodyMesh = new THREE.Mesh(cylGeo, bodyMat);
      
      // Lid (slightly wider disc)
      const lidGeo = new THREE.CylinderGeometry(0.32 * h, 0.32 * h, 0.04, 20);
      const lidMat = new THREE.MeshStandardMaterial({
        color: style.lidColor ?? style.bodyColor,
        roughness: style.bodyRoughness,
        metalness: style.bodyMetalness,
      });
      const lidMesh = new THREE.Mesh(lidGeo, lidMat);
      lidMesh.position.y = 0.44 * h;
      group.add(lidMesh);
      break;
    }
    case 'slim_office': {
      const boxGeo = new THREE.BoxGeometry(0.35 * h, 0.8 * h, 0.25 * h);
      bodyMesh = new THREE.Mesh(boxGeo, bodyMat);
      break;
    }
    case 'park_cast_iron': {
      // Slightly tapered cylinder with ribs
      const cylGeo = new THREE.CylinderGeometry(0.4 * h, 0.35 * h, 1.0 * h, 12);
      bodyMesh = new THREE.Mesh(cylGeo, bodyMat);
      
      // Rim ring at the top
      const rimGeo = new THREE.TorusGeometry(0.41 * h, 0.03, 8, 24);
      const rimMesh = new THREE.Mesh(rimGeo, bodyMat);
      rimMesh.position.y = 0.5 * h;
      rimMesh.rotation.x = Math.PI / 2;
      group.add(rimMesh);
      break;
    }
    case 'industrial_dumpster': {
      const boxGeo = new THREE.BoxGeometry(0.7 * h, 0.5 * h, 0.45 * h);
      bodyMesh = new THREE.Mesh(boxGeo, bodyMat);
      break;
    }
    case 'cafe_wooden': {
      const cylGeo = new THREE.CylinderGeometry(0.28 * h, 0.25 * h, 0.7 * h, 12);
      bodyMesh = new THREE.Mesh(cylGeo, bodyMat);
      break;
    }
    default: {
      const cylGeo = new THREE.CylinderGeometry(0.3 * h, 0.28 * h, 0.85 * h, 16);
      bodyMesh = new THREE.Mesh(cylGeo, bodyMat);
    }
  }

  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // 2. Category color indicator ring at the top
  const colorInt = parseInt(binDef.color.replace('#', ''), 16);
  const ringGeo = new THREE.TorusGeometry(0.32 * h, 0.04, 8, 24);
  const ringMat = new THREE.MeshStandardMaterial({
    color: colorInt,
    roughness: 0.2,
    metalness: 0.3,
    emissive: colorInt,
    emissiveIntensity: 0.5,
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.position.y = 0.45 * h;
  ringMesh.rotation.x = Math.PI / 2;
  group.add(ringMesh);

  // 3. Dark hole interior
  const holeGeo = new THREE.CircleGeometry(0.28 * h, 16);
  const holeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
  const holeMesh = new THREE.Mesh(holeGeo, holeMat);
  holeMesh.position.y = 0.44 * h;
  holeMesh.rotation.x = -Math.PI / 2;
  group.add(holeMesh);

  // 4. Category label on the front face
  const labelTexture = this.createBinLabelTexture(binDef.displayName, binDef.logo ?? '🗑️', binDef.color, style.labelStyle);
  const labelGeo = new THREE.PlaneGeometry(0.4 * h, 0.2 * h);
  const labelMat = new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true });
  const labelMesh = new THREE.Mesh(labelGeo, labelMat);
  labelMesh.position.set(0, 0, 0.3 * h); // Front face
  group.add(labelMesh);

  // 5. Ground shadow disc
  const shadowGeo = new THREE.CircleGeometry(0.4 * h, 16);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.y = -0.45 * h;
  group.add(shadowMesh);

  return group;
}
```

**Step 3.2: Add `createBinLabelTexture()` helper**

```typescript
private createBinLabelTexture(name: string, emoji: string, color: string, labelStyle: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  
  // Background
  ctx.fillStyle = labelStyle === 'embossed' ? 'rgba(0,0,0,0)' : 'rgba(255,255,255,0.9)';
  ctx.fillRect(0, 0, 256, 128);
  
  // Color bar at top
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 256, 8);
  
  // Emoji
  ctx.font = '40px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(emoji, 128, 60);
  
  // Name
  ctx.fillStyle = '#1E293B';
  ctx.font = 'bold 18px Arial';
  ctx.fillText(name, 128, 100);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
```

**Step 3.3: Add `addVenueBins()` and `removeVenueBins()` methods**

```typescript
private binMeshes: THREE.Group[] = [];

addVenueBins(venueId: string, binDefs: BinDef[], placements: BinPlacement3D[]): void {
  this.removeVenueBins();
  
  const style = getBinStyle(venueId);
  
  for (let i = 0; i < binDefs.length && i < placements.length; i++) {
    const placement = placements[i];
    if (placement.wx === undefined || placement.wy === undefined || placement.wz === undefined) continue;
    
    const binGroup = this.createBinMesh(binDefs[i], style);
    binGroup.position.set(placement.wx, placement.wy, placement.wz);
    if (placement.ry !== undefined) {
      binGroup.rotation.y = placement.ry;
    }
    
    this.scene.add(binGroup);
    this.binMeshes.push(binGroup);
  }
}

removeVenueBins(): void {
  for (const mesh of this.binMeshes) {
    this.scene.remove(mesh);
    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        if (child.material instanceof THREE.Material) child.material.dispose();
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
      }
    });
  }
  this.binMeshes = [];
}

/** Get the screen-space position of a bin mesh for Phaser zone synchronization */
getBinScreenPositions(): Array<{x: number, y: number, visible: boolean}> {
  return this.binMeshes.map(mesh => {
    return this.projectWorldToPhaser(mesh.position);
  });
}
```

**Step 3.4: Add a supplemental lighting rig for texture-based venues**

When bins are added to a texture-based venue, add a simple lighting setup so the bin meshes receive proper shading:

```typescript
private binLights: THREE.Light[] = [];

private addBinLighting(venueId: string): void {
  // Remove old lights
  for (const l of this.binLights) { this.scene.remove(l); }
  this.binLights = [];
  
  // Add ambient + directional for all texture venues
  const ambient = new THREE.AmbientLight('#FFF8E1', 0.8);
  this.scene.add(ambient);
  this.binLights.push(ambient);
  
  const dir = new THREE.DirectionalLight('#FFFFFF', 1.2);
  dir.position.set(5, 10, 7);
  dir.castShadow = true;
  this.scene.add(dir);
  this.binLights.push(dir);
}
```

Call `addBinLighting()` inside `addVenueBins()` when the current venue is a texture venue.

---

### Phase 4: Refactor Bin.ts

**Step 4.1: Strip all 2D rendering from `Bin.ts`**

Remove these members entirely:
- `backSprite`
- `frontSprite`
- `shadowGraphics`
- `glowGraphics`
- `glossGraphics`

**Step 4.2: Add a 3D mesh reference**

```typescript
export class Bin extends Phaser.GameObjects.Zone {
  public readonly binDef: BinDef;
  public baseX: number;
  public baseY: number;
  
  /** Index into ThreeJSService.binMeshes — used for screen-space projection */
  public binIndex: number;
  
  /** Whether this bin uses 3D rendering (true for 3D venues) */
  public is3D: boolean;

  constructor(scene: Phaser.Scene, x: number, y: number, binDef: BinDef, binIndex: number, is3D: boolean) {
    const zoneWidth = 180;
    const zoneHeight = 100;
    super(scene, x, y - 60, zoneWidth, zoneHeight);
    
    this.binDef = binDef;
    this.baseX = x;
    this.baseY = y;
    this.binIndex = binIndex;
    this.is3D = is3D;
    
    scene.add.existing(this);
    this.setDepth(25);
  }
  
  // Remove setPosition override (zone-only now)
  // Remove setScale override
  // Remove setVisible override (zone-only)
  // Remove playDropAnimation (will be handled by ThreeJS animation)
  
  /** Get bounding rect for overlap detection (unchanged) */
  getBounds<O extends Phaser.Geom.Rectangle>(output?: O): O { ... }
  
  /** Play drop animation via ThreeJS */
  playDropAnimation(): void {
    // Tell ThreeJSService to animate the bin mesh at this.binIndex
    // (squash and stretch the Three.js group)
    ThreeJSService.animateBinDrop(this.binIndex);
  }
  
  destroy(fromScene?: boolean): void {
    super.destroy(fromScene);
  }
}
```

**Step 4.3: For non-3D venues, keep the old 2D rendering**

If a venue is NOT in `THREE_D_VENUE_IDS`, `Bin.ts` should still create 2D sprites as before. Add a conditional branch in the constructor:

```typescript
if (!is3D) {
  // Create all the 2D sprites/graphics as the current code does
  this.backSprite = scene.add.sprite(x, y, `bin_${binDef.id}_back`);
  // ... etc (copy current code)
}
```

This ensures backward compatibility for any venue that isn't 3D.

---

### Phase 5: Update TrayScene

**Step 5.1: Update `createBins()` in `TrayScene.ts`**

```typescript
private createBins(): void {
  const width = this.cameras.main.width;
  const height = this.cameras.main.height;
  const binDefs = binsData as BinDef[];
  const binCount = binDefs.length;
  const venueData = venuesData.find(v => v.id === this.venueId);
  const is3D = TrayScene.THREE_D_VENUE_IDS.includes(this.venueId);
  
  // If 3D venue, create bin meshes in ThreeJS
  if (is3D && venueData?.binPositions) {
    ThreeJSService.addVenueBins(this.venueId, binDefs, venueData.binPositions);
  }
  
  for (let i = 0; i < binCount; i++) {
    const binDef = binDefs[i]!;
    let x = (width / 2) - (240 * (binCount - 1)) / 2 + i * 240;
    let y = height - 160;
    let scale = 1;
    
    if (venueData?.binPositions && venueData.binPositions.length > i) {
      const pos = venueData.binPositions[i];
      x = pos.x;
      y = pos.y;
      if (pos.scale !== undefined) scale = pos.scale;
    }
    
    const bin = new Bin(this, x, y, binDef, i, is3D);
    if (!is3D) bin.setScale(scale);
    this.bins.push(bin);
  }
}
```

**Step 5.2: Update the `update()` loop in `TrayScene.ts`**

Replace the existing bin projection code with:

```typescript
// Update bins from 3D positions
if (is3D) {
  const binPositions = ThreeJSService.getBinScreenPositions();
  for (let i = 0; i < this.bins.length && i < binPositions.length; i++) {
    const pos = binPositions[i];
    this.bins[i].setPosition(pos.x, pos.y);
    // Zone is invisible — no need to call setVisible
  }
}
```

**Step 5.3: Update cleanup**

In `TrayScene.cleanup()`, add:
```typescript
ThreeJSService.removeVenueBins();
```

---

### Phase 6: Add Drop Animation to ThreeJS

**Step 6.1: Add `animateBinDrop()` method to `ThreeJSServiceSingleton`**

```typescript
animateBinDrop(binIndex: number): void {
  const mesh = this.binMeshes[binIndex];
  if (!mesh) return;
  
  const originalScale = mesh.scale.clone();
  
  // Squash
  mesh.scale.set(
    originalScale.x * 1.05,
    originalScale.y * 0.92,
    originalScale.z * 1.05
  );
  
  // Animate back with spring
  const startTime = performance.now();
  const duration = 200;
  const animate = () => {
    const elapsed = performance.now() - startTime;
    const t = Math.min(1, elapsed / duration);
    const ease = 1 - Math.pow(1 - t, 3); // Ease out cubic
    
    mesh.scale.lerpVectors(
      new THREE.Vector3(originalScale.x * 1.05, originalScale.y * 0.92, originalScale.z * 1.05),
      originalScale,
      ease
    );
    
    if (t < 1) {
      requestAnimationFrame(animate);
    }
  };
  requestAnimationFrame(animate);
}
```

---

### Phase 7: Tuning & Polish

**Step 7.1: Calibrate 3D world positions**

The `wx`, `wy`, `wz` values specified in Section 4 are **initial estimates**. After implementation, you MUST:

1. Run the game for each venue
2. Right-click-drag to orbit the camera
3. Verify bins stay anchored in 3D space and don't slide
4. Verify bins face the player at reasonable angles
5. Adjust `wx`, `wy`, `wz`, and `ry` values in `venues.json` until bins look natural

**Key calibration rules**:
- For **texture-based venues**: `wz` should be around 40-50 (places objects near the surface of the 500-radius sphere, in the "floor" area). Start with `wz: 45` and adjust.
- `wy` of `-2.3` places bins at approximate floor level. Adjust ±0.5 based on the specific panorama.
- `wx` controls left-right placement. The camera starts at `cameraTheta = Math.PI / 4`, so `wx: 0` is roughly center.
- For **procedural venues** (library, hospital, café): `wz` should be 3-5 (matches the foreground prop Z range in `venueEnvironments.ts`).

**Step 7.2: Handle the "drop into bin" animation**

Currently, when an item is dropped into a bin, it animates to the bin's center and shrinks. Update this to use the bin's 3D world position projected to screen space:

In `TrayScene.handleDrop()`, the tween target should use the bin's current Phaser zone position (which is already being synced from 3D):
```typescript
this.tweens.add({
  targets: item,
  x: bin.x,            // Already projected from 3D
  y: bin.y + 30,       // Slight offset downward into the "hole"
  scaleX: 0.2,
  scaleY: 0.2,
  alpha: 0,
  duration: 300,
  ease: 'Power2',
  onComplete: () => { ... }
});
```

This should work without changes because `bin.x` and `bin.y` are already being updated each frame from the 3D projection.

**Step 7.3: Ensure hit zones scale with camera distance**

When the camera orbits, bins that are "further" from the camera will appear smaller on screen. The Phaser hit zone should scale accordingly:

```typescript
// In TrayScene.update(), after projecting bin positions:
const binPositions = ThreeJSService.getBinScreenPositions();
for (let i = 0; i < this.bins.length && i < binPositions.length; i++) {
  const pos = binPositions[i];
  const bin = this.bins[i];
  bin.setPosition(pos.x, pos.y);
  
  // Scale the zone based on projected size
  // (approximate: use distance from camera to bin world position)
  const worldPos = ThreeJSService.getBinWorldPosition(i);
  if (worldPos) {
    const dist = ThreeJSService.getCamera().position.distanceTo(worldPos);
    const scaleFactor = Math.max(0.3, Math.min(1.5, 50 / dist));
    bin.setSize(180 * scaleFactor, 100 * scaleFactor);
  }
}
```

**Step 7.4: Verify drag-and-drop still works**

After implementation, test that:
1. Dragging a trash item over a bin and releasing triggers the correct drop
2. The overlap detection between `TrashItem` bounds and `Bin` bounds works correctly
3. The item flies to the correct on-screen position of the bin when dropped
4. All 4 bin categories still score correctly

---

## 6. Testing Checklist

- [ ] Each of the 14 venues displays 4 correctly-styled 3D bins
- [ ] Bins stay anchored when right-click-dragging to orbit the camera
- [ ] Bins rotate and foreshorten with perspective
- [ ] Bin category colors (blue/green/black/grey rings) are clearly visible
- [ ] Bin labels are readable at the default camera angle
- [ ] Drag-and-drop scoring works correctly for all 4 bin types
- [ ] Drop animation (item shrinking into bin) plays correctly
- [ ] Bin squash-stretch animation on correct drop works
- [ ] Bins have proper shadows on the ground
- [ ] Bins receive venue lighting correctly (warm in café, clinical in hospital, etc.)
- [ ] Performance is acceptable (no frame drops from adding bin meshes)
- [ ] Camera orbit is smooth with bins present
- [ ] The RockCrusher at the construction site doesn't overlap with bins
- [ ] Non-3D venue fallback (if any) still works with 2D sprites
- [ ] Community park sub-levels (1-5) all display bins correctly

---

## 7. Rendering Pipeline After Implementation

```
Layer            Z-Index    Engine     Content
──────────────────────────────────────────────────────────────────────────
ThreeJS Canvas   -1 (CSS)   Three.js   360° sphere/procedural scene + 3D BIN MESHES
Phaser Canvas    10 (CSS)   Phaser     Invisible bin Zones, trash items, HUD, score text
MapLibre Map     0 (CSS)    WebGL      Level select only
```

The 3D bins live in the Three.js layer alongside the environment, receiving proper perspective, lighting, and shadow. The Phaser layer contains only the invisible hit zones and the 2D game objects (trash items, HUD).

---

## 8. Future Enhancements (Not in Scope)

- Replace procedural bin meshes with imported `.glb` models for higher fidelity
- Add physics-based lid animation on pedal bins
- Per-bin fill level visualization (mesh deformation as items are dropped in)
- Particle effects emanating from the bin opening when an item is dropped
- Bin-specific ambient sounds (metal clang for recycling, soft thud for compost)
