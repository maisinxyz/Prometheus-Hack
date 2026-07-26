/**
 * venueEnvironments.ts — Stylized PBR environment configurations.
 *
 * Each venue definition specifies floor materials, props, lighting,
 * background layers, and post-processing parameters for procedurally
 * built Three.js scenes.
 *
 * Art Style: "Stylized PBR" — flat vibrant albedo colors with
 * realistic roughness/metallic-driven lighting. Beveled geometry,
 * crisp focus, immersive level depth with outside window views.
 */

export interface VenueLightDef {
  type: 'directional' | 'ambient' | 'point' | 'spot';
  color: string;
  intensity: number;
  position?: [number, number, number];
  target?: [number, number, number];
  angle?: number;       // For spot lights (radians)
  penumbra?: number;    // Soft edge for spot lights
  castShadow?: boolean;
  shadowMapSize?: number;
  distance?: number;    // For point lights
}

export interface VenueMaterialDef {
  color: string;
  roughness: number;
  metallic: number;
  emissive?: string;
  emissiveIntensity?: number;
  opacity?: number;
  transparent?: boolean;
}

export interface VenuePropDef {
  id: string;
  geometry: 'box' | 'cylinder' | 'sphere' | 'plane' | 'cone' | 'torus';
  size: [number, number, number]; // width, height, depth (or radius, height, segments for cylinder)
  position: [number, number, number];
  rotation?: [number, number, number]; // Euler angles in radians
  material: VenueMaterialDef;
  children?: VenuePropDef[]; // Nested parts (e.g., lamp shade on a post)
}

export interface VenueBackgroundLayerDef {
  id: string;
  props: VenuePropDef[];
  fogColor?: string;
  fogDensity?: number;
}

export interface VenuePostProcessingDef {
  bloom: {
    enabled: boolean;
    strength: number;
    radius: number;
    threshold: number;
  };
  ssao: {
    enabled: boolean;
    radius: number;
    minDistance: number;
    maxDistance: number;
  };
  dof: {
    enabled: boolean;
    focus: number;
    aperture: number;
    maxblur: number;
  };
  vignette: boolean;
  godRays: boolean;
}

export interface VenueEnvironmentDef {
  venueId: string;
  displayName: string;
  floor: {
    geometry: 'plane';
    size: [number, number];
    position: [number, number, number];
    material: VenueMaterialDef;
    tilePattern?: 'hexagonal' | 'checkerboard' | null;
  };
  lights: VenueLightDef[];
  props: VenuePropDef[];
  backgroundLayers: VenueBackgroundLayerDef[];
  postProcessing: VenuePostProcessingDef;
  fog?: { color: string; near: number; far: number };
  envMapIntensity?: number;
  cameraPosition?: [number, number, number];
  cameraTarget?: [number, number, number];
}

// ─────────────────────────────────────────────────────
// LEVEL 1: CENTRAL PARK
// Atmosphere: Expansive park landscape with lake, bridge, winding path, trees & skyline.
// ─────────────────────────────────────────────────────
const centralPark: VenueEnvironmentDef = {
  venueId: 'central_park',
  displayName: 'Central Park',
  floor: {
    geometry: 'plane',
    size: [36, 22],
    position: [0, -2.5, 0],
    material: {
      color: '#64748B', // Slate grey cobblestone
      roughness: 0.8,
      metallic: 0.0,
    },
  },
  lights: [
    {
      // Soft warm afternoon sunlight
      type: 'directional',
      color: '#FCD34D',
      intensity: 1.6,
      position: [10, 14, 6],
      target: [0, 0, 0],
      castShadow: true,
      shadowMapSize: 2048,
    },
    {
      // Gentle sky ambient
      type: 'ambient',
      color: '#7DD3FC',
      intensity: 0.35,
    },
    {
      // Warm ground bounce
      type: 'point',
      color: '#FDE047',
      intensity: 0.6,
      position: [0, 1.0, 2],
      distance: 20,
    },
  ],
  props: [
    // ── Red & White Picnic Blanket & Food Basket (Left Lawn) ──
    {
      id: 'picnic_blanket',
      geometry: 'box',
      size: [2.5, 0.02, 1.8],
      position: [-3.8, -2.48, 0.8],
      rotation: [0, 0.15, 0],
      material: { color: '#DC2626', roughness: 0.9, metallic: 0.0 }, // Red picnic blanket
      children: [
        { id: 'basket', geometry: 'box', size: [0.45, 0.32, 0.32], position: [0.6, 0.16, 0.2], material: { color: '#D97706', roughness: 0.7, metallic: 0.0 } }, // Woven basket
        { id: 'apple', geometry: 'sphere', size: [0.08, 8, 8], position: [-0.4, 0.06, -0.2], material: { color: '#EF4444', roughness: 0.3, metallic: 0.0 } },
        { id: 'sandwich_box', geometry: 'box', size: [0.25, 0.08, 0.2], position: [-0.2, 0.04, 0.3], material: { color: '#FEF08A', roughness: 0.5, metallic: 0.0 } },
      ],
    },
    // ── Park Benches ──
    {
      id: 'bench_left',
      geometry: 'box',
      size: [2.8, 0.1, 0.65],
      position: [-6.2, -1.5, 1.2],
      rotation: [0, 0.2, 0],
      material: { color: '#78350F', roughness: 0.65, metallic: 0.0 },
      children: [
        { id: 'b_leg_l1', geometry: 'box', size: [0.1, 0.8, 0.6], position: [-1.2, -0.45, 0], material: { color: '#1E293B', roughness: 0.3, metallic: 0.8 } },
        { id: 'b_leg_l2', geometry: 'box', size: [0.1, 0.8, 0.6], position: [1.2, -0.45, 0], material: { color: '#1E293B', roughness: 0.3, metallic: 0.8 } },
        { id: 'b_back_l', geometry: 'box', size: [2.8, 0.75, 0.08], position: [0, 0.4, -0.28], material: { color: '#78350F', roughness: 0.65, metallic: 0.0 } },
      ],
    },
    {
      id: 'bench_right',
      geometry: 'box',
      size: [2.8, 0.1, 0.65],
      position: [6.2, -1.5, 1.2],
      rotation: [0, -0.2, 0],
      material: { color: '#78350F', roughness: 0.65, metallic: 0.0 },
      children: [
        { id: 'b_leg_r1', geometry: 'box', size: [0.1, 0.8, 0.6], position: [-1.2, -0.45, 0], material: { color: '#1E293B', roughness: 0.3, metallic: 0.8 } },
        { id: 'b_leg_r2', geometry: 'box', size: [0.1, 0.8, 0.6], position: [1.2, -0.45, 0], material: { color: '#1E293B', roughness: 0.3, metallic: 0.8 } },
        { id: 'b_back_r', geometry: 'box', size: [2.8, 0.75, 0.08], position: [0, 0.4, -0.28], material: { color: '#78350F', roughness: 0.65, metallic: 0.0 } },
      ],
    },
    // ── Classic NYC Streetlamps ──
    {
      id: 'lamp_left',
      geometry: 'cylinder',
      size: [0.09, 5.0, 12],
      position: [-8.2, 0.2, 0.3],
      material: { color: '#0F172A', roughness: 0.25, metallic: 0.85 },
      children: [
        { id: 'l_shade_l', geometry: 'sphere', size: [0.35, 12, 12], position: [0, 2.6, 0], material: { color: '#FEF08A', roughness: 0.15, metallic: 0.0, emissive: '#FEF08A', emissiveIntensity: 2.2 } },
      ],
    },
    {
      id: 'lamp_right',
      geometry: 'cylinder',
      size: [0.09, 5.0, 12],
      position: [8.2, 0.2, 0.3],
      material: { color: '#0F172A', roughness: 0.25, metallic: 0.85 },
      children: [
        { id: 'l_shade_r', geometry: 'sphere', size: [0.35, 12, 12], position: [0, 2.6, 0], material: { color: '#FEF08A', roughness: 0.15, metallic: 0.0, emissive: '#FEF08A', emissiveIntensity: 2.2 } },
      ],
    },
    // ── Perimeter Fence & Flowerbeds ──
    { id: 'fence_left', geometry: 'box', size: [7.0, 1.4, 0.08], position: [-10.5, -1.8, -1.5], material: { color: '#1E293B', roughness: 0.3, metallic: 0.8 } },
    { id: 'fence_right', geometry: 'box', size: [7.0, 1.4, 0.08], position: [10.5, -1.8, -1.5], material: { color: '#1E293B', roughness: 0.3, metallic: 0.8 } },
  ],
  backgroundLayers: [
    {
      // Layer 1: Bethesda Stone Fountain, Realistic Multi-Tier Tree Meshes & Floating Sky Clouds
      id: 'park_scenery',
      props: [
        // Ornate Bethesda Stone Fountain Basin (Center Midground)
        {
          id: 'fountain_rim',
          geometry: 'cylinder',
          size: [2.8, 0.45, 24],
          position: [0, -2.3, -4.0],
          material: { color: '#94A3B8', roughness: 0.7, metallic: 0.1 },
          children: [
            { id: 'fountain_water', geometry: 'cylinder', size: [2.5, 0.02, 24], position: [0, 0.2, 0], material: { color: '#0EA5E9', roughness: 0.05, metallic: 0.1, opacity: 0.85, transparent: true } },
            { id: 'fountain_pedestal', geometry: 'cylinder', size: [0.7, 0.9, 16], position: [0, 0.55, 0], material: { color: '#64748B', roughness: 0.6, metallic: 0.2 } },
            { id: 'fountain_top_bowl', geometry: 'cylinder', size: [1.2, 0.25, 16], position: [0, 1.0, 0], material: { color: '#94A3B8', roughness: 0.6, metallic: 0.2 } },
          ],
        },
        // ── Realistic Multi-Tiered Tree Meshes (No Green Spheres!) ──
        // Oak Tree Left
        {
          id: 'oak_tree_left_trunk',
          geometry: 'cylinder',
          size: [0.35, 6.5, 10],
          position: [-7.8, 0.8, -7.0],
          material: { color: '#451A03', roughness: 0.85, metallic: 0.0 },
          children: [
            { id: 'oak_foliage_tier1', geometry: 'cone', size: [3.8, 3.2, 8], position: [0, 3.2, 0], material: { color: '#166534', roughness: 0.8, metallic: 0.0 } },
            { id: 'oak_foliage_tier2', geometry: 'cone', size: [3.0, 2.8, 8], position: [0, 4.8, 0], material: { color: '#15803D', roughness: 0.8, metallic: 0.0 } },
            { id: 'oak_foliage_tier3', geometry: 'cone', size: [2.0, 2.2, 8], position: [0, 6.2, 0], material: { color: '#22C55E', roughness: 0.8, metallic: 0.0 } },
          ],
        },
        // Pine Tree Right
        {
          id: 'pine_tree_right_trunk',
          geometry: 'cylinder',
          size: [0.32, 7.0, 10],
          position: [7.8, 1.0, -7.5],
          material: { color: '#3B1A0E', roughness: 0.85, metallic: 0.0 },
          children: [
            { id: 'pine_tier1', geometry: 'cone', size: [4.0, 3.5, 8], position: [0, 3.5, 0], material: { color: '#14532D', roughness: 0.8, metallic: 0.0 } },
            { id: 'pine_tier2', geometry: 'cone', size: [3.2, 3.0, 8], position: [0, 5.2, 0], material: { color: '#166534', roughness: 0.8, metallic: 0.0 } },
            { id: 'pine_tier3', geometry: 'cone', size: [2.2, 2.4, 8], position: [0, 6.8, 0], material: { color: '#15803D', roughness: 0.8, metallic: 0.0 } },
          ],
        },
        // ── Floating 3D Sky Clouds ──
        { id: 'cloud_1', geometry: 'box', size: [4.5, 1.2, 1.5], position: [-8.0, 6.2, -14.0], material: { color: '#FFFFFF', roughness: 1.0, metallic: 0.0, opacity: 0.75, transparent: true } },
        { id: 'cloud_2', geometry: 'box', size: [5.8, 1.4, 1.8], position: [1.0, 7.5, -16.0], material: { color: '#FFFFFF', roughness: 1.0, metallic: 0.0, opacity: 0.7, transparent: true } },
        { id: 'cloud_3', geometry: 'box', size: [4.0, 1.0, 1.4], position: [8.5, 6.5, -15.0], material: { color: '#FFFFFF', roughness: 1.0, metallic: 0.0, opacity: 0.75, transparent: true } },
      ],
    },
    {
      // Layer 2: NYC Horizon Skyline
      id: 'skyline',
      props: [
        { id: 'b_1', geometry: 'box', size: [3.2, 10.5, 1], position: [-12.0, 2.5, -16], material: { color: '#94A3B8', roughness: 1.0, metallic: 0.0, opacity: 0.5, transparent: true } },
        { id: 'b_2', geometry: 'box', size: [2.4, 16.0, 1], position: [-7.5, 5.0, -17], material: { color: '#CBD5E1', roughness: 1.0, metallic: 0.0, opacity: 0.45, transparent: true } },
        { id: 'b_3', geometry: 'box', size: [4.2, 8.5, 1], position: [-2.2, 1.5, -15], material: { color: '#94A3B8', roughness: 1.0, metallic: 0.0, opacity: 0.4, transparent: true } },
        { id: 'b_4', geometry: 'box', size: [2.8, 19.0, 1], position: [3.8, 6.5, -18], material: { color: '#CBD5E1', roughness: 1.0, metallic: 0.0, opacity: 0.4, transparent: true } },
        { id: 'b_5', geometry: 'box', size: [3.8, 12.0, 1], position: [9.0, 3.0, -16], material: { color: '#94A3B8', roughness: 1.0, metallic: 0.0, opacity: 0.45, transparent: true } },
      ],
    },
  ],
  postProcessing: {
    bloom: { enabled: true, strength: 0.35, radius: 0.5, threshold: 0.85 },
    ssao: { enabled: true, radius: 0.5, minDistance: 0.001, maxDistance: 0.05 },
    dof: { enabled: false, focus: 5.0, aperture: 0.002, maxblur: 0.005 },
    vignette: false,
    godRays: false,
  },
  fog: { color: '#38BDF8', near: 15, far: 35 },
  cameraPosition: [0, 2.0, 10.5],
  cameraTarget: [0, -0.5, 0],
};

// ─────────────────────────────────────────────────────
// LEVEL 2: MOUNT SINAI HOSPITAL (nyc_hospital)
// Atmosphere: Clinical hospital hallway & waiting room with reception desk, pharmacy counter, waiting chairs, TV, and EXIT sign.
// ─────────────────────────────────────────────────────
const nycHospital: VenueEnvironmentDef = {
  venueId: 'nyc_hospital',
  displayName: 'NYC Hospital',
  floor: {
    geometry: 'plane',
    size: [28, 18],
    position: [0, -2.5, 0],
    material: {
      color: '#0F766E', // High-Contrast Polished Slate Teal Vinyl Floor
      roughness: 0.15,
      metallic: 0.05,
    },
  },
  lights: [
    {
      type: 'ambient',
      color: '#F0F9FF',
      intensity: 1.4,
    },
    {
      type: 'point',
      color: '#FFFFFF',
      intensity: 3.5,
      position: [0, 6.0, 2],
      distance: 25,
      castShadow: true,
      shadowMapSize: 1024,
    },
    {
      type: 'point',
      color: '#E0F2FE',
      intensity: 2.5,
      position: [-5.0, 5.0, 1],
      distance: 20,
    },
    {
      type: 'point',
      color: '#E0F2FE',
      intensity: 2.5,
      position: [5.0, 5.0, 1],
      distance: 20,
    },
  ],
  props: [
    // ── Enclosed Hospital Baseboards & Wall Architecture ──
    {
      id: 'wall_left',
      geometry: 'box',
      size: [0.3, 8.0, 14.0],
      position: [-10.0, 1.5, -1.0],
      material: { color: '#F8FAFC', roughness: 0.3, metallic: 0.1 },
      children: [
        { id: 'baseboard_l', geometry: 'box', size: [0.32, 0.3, 14.0], position: [0, -3.85, 0], material: { color: '#1E293B', roughness: 0.4, metallic: 0.1 } }, // Dark Baseboard Trim
        { id: 'wall_strip_l', geometry: 'box', size: [0.32, 0.25, 14.0], position: [0, -0.6, 0], material: { color: '#0EA5E9', roughness: 0.3, metallic: 0.1 } }, // Cyan Wall Guard
        { id: 'handrail_l', geometry: 'cylinder', size: [0.04, 13.5, 8], position: [0.1, -0.4, 0], rotation: [Math.PI / 2, 0, 0], material: { color: '#94A3B8', roughness: 0.2, metallic: 0.8 } },
        // Double Exit Doors with Red EXIT Sign
        { id: 'door_frame_l', geometry: 'box', size: [0.32, 4.4, 2.4], position: [0, -0.8, -2.0], material: { color: '#0284C7', roughness: 0.2, metallic: 0.5 } },
        { id: 'exit_sign', geometry: 'box', size: [0.36, 0.45, 0.9], position: [0, 1.8, -2.0], material: { color: '#EF4444', roughness: 0.2, metallic: 0.0, emissive: '#EF4444', emissiveIntensity: 3.5 } },
      ],
    },
    {
      id: 'wall_right',
      geometry: 'box',
      size: [0.3, 8.0, 14.0],
      position: [10.0, 1.5, -1.0],
      material: { color: '#F8FAFC', roughness: 0.3, metallic: 0.1 },
      children: [
        { id: 'baseboard_r', geometry: 'box', size: [0.32, 0.3, 14.0], position: [0, -3.85, 0], material: { color: '#1E293B', roughness: 0.4, metallic: 0.1 } },
        { id: 'wall_strip_r', geometry: 'box', size: [0.32, 0.25, 14.0], position: [0, -0.6, 0], material: { color: '#0EA5E9', roughness: 0.3, metallic: 0.1 } },
        // Wall-Mounted TV
        { id: 'tv_frame', geometry: 'box', size: [0.1, 1.6, 2.8], position: [-0.1, 1.2, 0.5], material: { color: '#1E293B', roughness: 0.2, metallic: 0.8 } },
        { id: 'tv_screen', geometry: 'box', size: [0.12, 1.4, 2.5], position: [-0.08, 1.2, 0.5], material: { color: '#38BDF8', roughness: 0.1, metallic: 0.0, emissive: '#0284C7', emissiveIntensity: 1.8 } },
      ],
    },

    // ── Double Rows of Blue Vinyl Waiting Room Chairs (Left Side) ──
    {
      id: 'waiting_chair_row_1',
      geometry: 'box',
      size: [3.4, 0.1, 0.55],
      position: [-6.8, -1.6, 1.2],
      material: { color: '#0284C7', roughness: 0.4, metallic: 0.0 }, // Blue Vinyl Seat
      children: [
        { id: 'wc_back_1', geometry: 'box', size: [3.4, 0.65, 0.06], position: [0, 0.32, -0.25], material: { color: '#0284C7', roughness: 0.4, metallic: 0.0 } },
        { id: 'wc_leg_1a', geometry: 'cylinder', size: [0.04, 0.8, 8], position: [-1.5, -0.4, 0], material: { color: '#94A3B8', roughness: 0.2, metallic: 0.8 } },
        { id: 'wc_leg_1b', geometry: 'cylinder', size: [0.04, 0.8, 8], position: [1.5, -0.4, 0], material: { color: '#94A3B8', roughness: 0.2, metallic: 0.8 } },
      ],
    },
    {
      id: 'waiting_chair_row_2',
      geometry: 'box',
      size: [3.4, 0.1, 0.55],
      position: [-6.8, -1.6, -1.2],
      material: { color: '#0284C7', roughness: 0.4, metallic: 0.0 },
      children: [
        { id: 'wc_back_2', geometry: 'box', size: [3.4, 0.65, 0.06], position: [0, 0.32, -0.25], material: { color: '#0284C7', roughness: 0.4, metallic: 0.0 } },
        { id: 'wc_leg_2a', geometry: 'cylinder', size: [0.04, 0.8, 8], position: [-1.5, -0.4, 0], material: { color: '#94A3B8', roughness: 0.2, metallic: 0.8 } },
        { id: 'wc_leg_2b', geometry: 'cylinder', size: [0.04, 0.8, 8], position: [1.5, -0.4, 0], material: { color: '#94A3B8', roughness: 0.2, metallic: 0.8 } },
      ],
    },

    // ── Right-Side Waiting Room Tables & Double Row Chairs ──
    {
      id: 'waiting_chair_row_r1',
      geometry: 'box',
      size: [3.4, 0.1, 0.55],
      position: [6.8, -1.6, 1.2],
      material: { color: '#0284C7', roughness: 0.4, metallic: 0.0 }, // Blue Vinyl Seat
      children: [
        { id: 'wc_back_r1', geometry: 'box', size: [3.4, 0.65, 0.06], position: [0, 0.32, -0.25], material: { color: '#0284C7', roughness: 0.4, metallic: 0.0 } },
        { id: 'wc_leg_r1a', geometry: 'cylinder', size: [0.04, 0.8, 8], position: [-1.5, -0.4, 0], material: { color: '#94A3B8', roughness: 0.2, metallic: 0.8 } },
        { id: 'wc_leg_r1b', geometry: 'cylinder', size: [0.04, 0.8, 8], position: [1.5, -0.4, 0], material: { color: '#94A3B8', roughness: 0.2, metallic: 0.8 } },
      ],
    },
    {
      id: 'waiting_chair_row_r2',
      geometry: 'box',
      size: [3.4, 0.1, 0.55],
      position: [6.8, -1.6, -1.2],
      material: { color: '#0284C7', roughness: 0.4, metallic: 0.0 },
      children: [
        { id: 'wc_back_r2', geometry: 'box', size: [3.4, 0.65, 0.06], position: [0, 0.32, -0.25], material: { color: '#0284C7', roughness: 0.4, metallic: 0.0 } },
        { id: 'wc_leg_r2a', geometry: 'cylinder', size: [0.04, 0.8, 8], position: [-1.5, -0.4, 0], material: { color: '#94A3B8', roughness: 0.2, metallic: 0.8 } },
        { id: 'wc_leg_r2b', geometry: 'cylinder', size: [0.04, 0.8, 8], position: [1.5, -0.4, 0], material: { color: '#94A3B8', roughness: 0.2, metallic: 0.8 } },
      ],
    },
    {
      id: 'reception_coffee_table_r',
      geometry: 'box',
      size: [2.6, 0.4, 1.0],
      position: [6.8, -1.85, 0.0],
      material: { color: '#F8FAFC', roughness: 0.2, metallic: 0.1 }, // Reception table
      children: [
        { id: 'mag_r1', geometry: 'box', size: [0.4, 0.02, 0.3], position: [-0.6, 0.22, 0], material: { color: '#0284C7', roughness: 0.5, metallic: 0.0 } },
        { id: 'mag_r2', geometry: 'box', size: [0.4, 0.02, 0.3], position: [0.6, 0.22, 0], material: { color: '#EF4444', roughness: 0.5, metallic: 0.0 } },
        { id: 'tissue_box', geometry: 'box', size: [0.25, 0.18, 0.2], position: [0, 0.22, 0], material: { color: '#FFFFFF', roughness: 0.3, metallic: 0.0 } },
      ],
    },

    // ── Potted Ficus Plant ──
    {
      id: 'ficus_pot',
      geometry: 'cylinder',
      size: [0.45, 0.7, 12],
      position: [-8.8, -1.95, 2.2],
      material: { color: '#D97706', roughness: 0.7, metallic: 0.0 },
      children: [
        { id: 'ficus_leaves', geometry: 'sphere', size: [0.75, 12, 12], position: [0, 0.9, 0], material: { color: '#15803D', roughness: 0.35, metallic: 0.0 } },
      ],
    },

    // ── Hand Sanitizer Station ──
    {
      id: 'sanitizer_post',
      geometry: 'cylinder',
      size: [0.06, 3.2, 12],
      position: [-4.2, -0.9, 1.2],
      material: { color: '#F1F5F9', roughness: 0.15, metallic: 0.4 },
      children: [
        { id: 'san_base', geometry: 'cylinder', size: [0.42, 0.08, 16], position: [0, -1.6, 0], material: { color: '#64748B', roughness: 0.2, metallic: 0.7 } },
        { id: 'san_dispenser', geometry: 'box', size: [0.28, 0.42, 0.18], position: [0, 1.4, 0.1], material: { color: '#FFFFFF', roughness: 0.1, metallic: 0.1 } },
      ],
    },
  ],
  backgroundLayers: [
    {
      // Layer 1: Solid Interior Clinical Wall & Baseboard Trim
      id: 'partitions',
      props: [
        { id: 'back_wall', geometry: 'box', size: [22.0, 8.0, 0.3], position: [0, 1.5, -4.5], material: { color: '#F8FAFC', roughness: 0.3, metallic: 0.1 } },
        { id: 'back_baseboard', geometry: 'box', size: [22.0, 0.3, 0.32], position: [0, -2.35, -4.5], material: { color: '#1E293B', roughness: 0.4, metallic: 0.1 } },
        { id: 'back_wall_strip', geometry: 'box', size: [22.0, 0.3, 0.32], position: [0, -0.6, -4.5], material: { color: '#0EA5E9', roughness: 0.3, metallic: 0.1 } },
        // Framed Wall Artwork Prints
        { id: 'art_frame_1', geometry: 'box', size: [1.8, 1.2, 0.08], position: [-7.0, 1.8, -4.3], material: { color: '#1E293B', roughness: 0.5, metallic: 0.2 } },
        { id: 'art_print_1', geometry: 'box', size: [1.6, 1.0, 0.02], position: [-7.0, 1.8, -4.24], material: { color: '#38BDF8', roughness: 0.1, metallic: 0.0 } },
      ],
    },
    {
      // Layer 2: Nurse Reception Counter & Intake Desk
      id: 'reception',
      props: [
        // ── Main Hospital Reception & Nurse Intake Desk (Center) ──
        { id: 'desk_top', geometry: 'box', size: [6.0, 0.14, 1.4], position: [-1.8, -0.4, -4.0], material: { color: '#F8FAFC', roughness: 0.1, metallic: 0.2 } },
        { id: 'desk_front', geometry: 'box', size: [6.0, 1.6, 0.12], position: [-1.8, -1.25, -3.3], material: { color: '#E2E8F0', roughness: 0.25, metallic: 0.1 } },
        { id: 'desk_wood_strip', geometry: 'box', size: [6.0, 0.3, 0.14], position: [-1.8, -0.7, -3.28], material: { color: '#0284C7', roughness: 0.3, metallic: 0.1 } },
        { id: 'desk_led', geometry: 'box', size: [5.8, 0.05, 0.06], position: [-1.8, -2.0, -3.24], material: { color: '#38BDF8', roughness: 0.1, metallic: 0.0, emissive: '#0EA5E9', emissiveIntensity: 3.5 } },
        // Compact Realistic Desktop Computer Terminals
        { id: 'mon_1_screen', geometry: 'box', size: [0.6, 0.42, 0.04], position: [-3.2, 0.1, -4.0], material: { color: '#0284C7', roughness: 0.1, metallic: 0.0, emissive: '#38BDF8', emissiveIntensity: 0.9 } },
        { id: 'mon_2_screen', geometry: 'box', size: [0.6, 0.42, 0.04], position: [-0.4, 0.1, -4.0], material: { color: '#0EA5E9', roughness: 0.1, metallic: 0.0, emissive: '#BAE6FD', emissiveIntensity: 0.8 } },
      ],
    },
  ],
  postProcessing: {
    bloom: { enabled: false, strength: 0.0, radius: 0.0, threshold: 1.0 },
    ssao: { enabled: true, radius: 0.6, minDistance: 0.001, maxDistance: 0.04 },
    dof: { enabled: false, focus: 5.0, aperture: 0.001, maxblur: 0.003 },
    vignette: false,
    godRays: false,
  },
  envMapIntensity: 0.8,
  cameraPosition: [0, 2.0, 10.5],
  cameraTarget: [0, -0.5, 0],
};

// ─────────────────────────────────────────────────────
// LEVEL 3: WEST VILLAGE CAFE (mackenzie_cafe)
// Atmosphere: Cozy interior cafe with large glass storefront window showing West Village street outside.
// ─────────────────────────────────────────────────────
const westVillageCafe: VenueEnvironmentDef = {
  venueId: 'mackenzie_cafe',
  displayName: 'Mackenzie Cafe',
  floor: {
    geometry: 'plane',
    size: [28, 18],
    position: [0, -2.5, 0],
    material: {
      color: '#FEF3C7', // Bright Warm Oak & Parquet Hexagon Tile Pattern
      roughness: 0.25,
      metallic: 0.05,
    },
    tilePattern: 'hexagonal',
  },
  lights: [
    {
      type: 'spot',
      color: '#FFF7ED',
      intensity: 8.0,
      position: [0, 6.5, 3.5],
      target: [0, -2.5, 0],
      angle: Math.PI / 2.8,
      penumbra: 0.3,
      castShadow: true,
      shadowMapSize: 2048,
    },
    {
      type: 'ambient',
      color: '#FEF08A',
      intensity: 1.8,
    },
    {
      type: 'point',
      color: '#FDE047',
      intensity: 3.5,
      position: [-6, 3.5, 0],
      distance: 20,
    },
    {
      type: 'point',
      color: '#FDE047',
      intensity: 3.5,
      position: [6, 3.5, 0],
      distance: 20,
    },
  ],
  props: [
    // ── Brick Side Walls with Storefront Glass Windows & Framed Art Paintings ──
    {
      id: 'wall_left',
      geometry: 'box',
      size: [0.3, 8.0, 14.0],
      position: [-9.5, 1.5, -1.0],
      material: { color: '#9A3412', roughness: 0.85, metallic: 0.0 }, // Warm Terracotta Brick
      children: [
        // Left Side Window to West Village Street
        { id: 'win_frame_l', geometry: 'box', size: [0.34, 4.2, 4.8], position: [0.05, 0.5, -1.5], material: { color: '#451A03', roughness: 0.4, metallic: 0.2 } },
        { id: 'win_glass_l', geometry: 'box', size: [0.36, 3.8, 4.4], position: [0.06, 0.5, -1.5], material: { color: '#BAE6FD', roughness: 0.1, metallic: 0.0, opacity: 0.4, transparent: true } },
        // Outside Street Trees visible through Left Window
        { id: 'ext_tree_l', geometry: 'sphere', size: [2.2, 10, 10], position: [-2.5, 0.5, -1.5], material: { color: '#16A34A', roughness: 0.9, metallic: 0.0 } },
        // Framed Oil Painting Print on Left Wall
        { id: 'art_frame_l', geometry: 'box', size: [0.36, 1.8, 1.4], position: [0.05, 1.8, 2.5], material: { color: '#78350F', roughness: 0.5, metallic: 0.1 } },
        { id: 'art_canvas_l', geometry: 'box', size: [0.38, 1.5, 1.1], position: [0.06, 1.8, 2.5], material: { color: '#0EA5E9', roughness: 0.2, metallic: 0.0 } },
      ],
    },
    {
      id: 'wall_right',
      geometry: 'box',
      size: [0.3, 8.0, 14.0],
      position: [9.5, 1.5, -1.0],
      material: { color: '#9A3412', roughness: 0.85, metallic: 0.0 },
      children: [
        // Right Side Window to Outdoor Patio
        { id: 'win_frame_r', geometry: 'box', size: [0.34, 4.2, 4.8], position: [-0.05, 0.5, -1.5], material: { color: '#451A03', roughness: 0.4, metallic: 0.2 } },
        { id: 'win_glass_r', geometry: 'box', size: [0.36, 3.8, 4.4], position: [-0.06, 0.5, -1.5], material: { color: '#BAE6FD', roughness: 0.1, metallic: 0.0, opacity: 0.4, transparent: true } },
        { id: 'ext_tree_r', geometry: 'sphere', size: [2.2, 10, 10], position: [2.5, 0.5, -1.5], material: { color: '#15803D', roughness: 0.9, metallic: 0.0 } },
        // Framed Coffee Art Print on Right Wall
        { id: 'art_frame_r', geometry: 'box', size: [0.36, 1.8, 1.4], position: [-0.05, 1.8, 2.5], material: { color: '#78350F', roughness: 0.5, metallic: 0.1 } },
        { id: 'art_canvas_r', geometry: 'box', size: [0.38, 1.5, 1.1], position: [-0.06, 1.8, 2.5], material: { color: '#F59E0B', roughness: 0.2, metallic: 0.0 } },
      ],
    },
    {
      id: 'ceiling_beam_1',
      geometry: 'box',
      size: [19.0, 0.4, 0.4],
      position: [0, 5.2, 0],
      material: { color: '#451A03', roughness: 0.7, metallic: 0.0 },
    },

    // ── Hanging Industrial Pendant Lamps ──
    {
      id: 'pendant_1',
      geometry: 'cylinder',
      size: [0.02, 2.2, 6],
      position: [-4.5, 4.3, 1.5],
      material: { color: '#1E293B', roughness: 0.6, metallic: 0.4 },
      children: [
        { id: 'shade_1', geometry: 'cone', size: [0.65, 0.55, 16], position: [0, -1.2, 0], material: { color: '#B45309', roughness: 0.4, metallic: 0.6 } },
        { id: 'bulb_1', geometry: 'sphere', size: [0.22, 12, 12], position: [0, -1.45, 0], material: { color: '#FEF08A', roughness: 0.1, metallic: 0.0, emissive: '#FFDAB9', emissiveIntensity: 4.0 } },
      ],
    },
    {
      id: 'pendant_2',
      geometry: 'cylinder',
      size: [0.02, 2.2, 6],
      position: [4.5, 4.3, 1.5],
      material: { color: '#1E293B', roughness: 0.6, metallic: 0.4 },
      children: [
        { id: 'shade_2', geometry: 'cone', size: [0.65, 0.55, 16], position: [0, -1.2, 0], material: { color: '#B45309', roughness: 0.4, metallic: 0.6 } },
        { id: 'bulb_2', geometry: 'sphere', size: [0.22, 12, 12], position: [0, -1.45, 0], material: { color: '#FEF08A', roughness: 0.1, metallic: 0.0, emissive: '#FFDAB9', emissiveIntensity: 4.0 } },
      ],
    },

    // ── Cafe Seating Set 1: Large Round White Marble Bistro Table with French Navy Bentwood Chairs (Left Foreground) ──
    {
      id: 'bistro_table_left',
      geometry: 'cylinder',
      size: [1.4, 0.08, 16], // Enlarged to 1.4m diameter
      position: [-6.5, -1.6, 2.2],
      material: { color: '#F8FAFC', roughness: 0.15, metallic: 0.1 }, // White Marble Top
      children: [
        { id: 'bistro_pedestal_l', geometry: 'cylinder', size: [0.09, 0.82, 10], position: [0, -0.45, 0], material: { color: '#1E293B', roughness: 0.3, metallic: 0.8 } },
        { id: 'bistro_feet_l1', geometry: 'box', size: [0.9, 0.06, 0.1], position: [0, -0.85, 0], material: { color: '#1E293B', roughness: 0.3, metallic: 0.8 } },
        { id: 'bistro_feet_l2', geometry: 'box', size: [0.1, 0.06, 0.9], position: [0, -0.85, 0], material: { color: '#1E293B', roughness: 0.3, metallic: 0.8 } },
        { id: 'cup_l', geometry: 'cylinder', size: [0.12, 0.14, 10], position: [-0.3, 0.11, 0.15], material: { color: '#FFFFFF', roughness: 0.3, metallic: 0.0 } },
        { id: 'croissant_l', geometry: 'box', size: [0.22, 0.08, 0.14], position: [0.3, 0.08, -0.15], material: { color: '#F59E0B', roughness: 0.7, metallic: 0.0 } },
      ],
    },
    {
      id: 'chair_left_navy1',
      geometry: 'box',
      size: [0.55, 0.06, 0.55], // Seat Slab
      position: [-7.5, -1.65, 2.2],
      material: { color: '#1E3A8A', roughness: 0.5, metallic: 0.0 }, // French Navy Bentwood Chair
      children: [
        // 4 Legs raising seat off floor
        { id: 'leg_n1_fl', geometry: 'cylinder', size: [0.04, 0.75, 8], position: [-0.22, -0.4, 0.22], material: { color: '#1E3A8A', roughness: 0.5, metallic: 0.0 } },
        { id: 'leg_n1_fr', geometry: 'cylinder', size: [0.04, 0.75, 8], position: [0.22, -0.4, 0.22], material: { color: '#1E3A8A', roughness: 0.5, metallic: 0.0 } },
        { id: 'leg_n1_bl', geometry: 'cylinder', size: [0.04, 0.75, 8], position: [-0.22, -0.4, -0.22], material: { color: '#1E3A8A', roughness: 0.5, metallic: 0.0 } },
        { id: 'leg_n1_br', geometry: 'cylinder', size: [0.04, 0.75, 8], position: [0.22, -0.4, -0.22], material: { color: '#1E3A8A', roughness: 0.5, metallic: 0.0 } },
        // Backrest Spindles & Curved Top Rail
        { id: 'back_n1_rail', geometry: 'box', size: [0.55, 0.25, 0.05], position: [0, 0.45, -0.24], material: { color: '#1E3A8A', roughness: 0.5, metallic: 0.0 } },
        { id: 'back_n1_spindle1', geometry: 'cylinder', size: [0.03, 0.45, 6], position: [-0.15, 0.22, -0.24], material: { color: '#1E3A8A', roughness: 0.5, metallic: 0.0 } },
        { id: 'back_n1_spindle2', geometry: 'cylinder', size: [0.03, 0.45, 6], position: [0.15, 0.22, -0.24], material: { color: '#1E3A8A', roughness: 0.5, metallic: 0.0 } },
      ],
    },
    {
      id: 'chair_left_navy2',
      geometry: 'box',
      size: [0.55, 0.06, 0.55],
      position: [-5.5, -1.65, 2.2],
      material: { color: '#1E3A8A', roughness: 0.5, metallic: 0.0 },
      children: [
        { id: 'leg_n2_fl', geometry: 'cylinder', size: [0.04, 0.75, 8], position: [-0.22, -0.4, 0.22], material: { color: '#1E3A8A', roughness: 0.5, metallic: 0.0 } },
        { id: 'leg_n2_fr', geometry: 'cylinder', size: [0.04, 0.75, 8], position: [0.22, -0.4, 0.22], material: { color: '#1E3A8A', roughness: 0.5, metallic: 0.0 } },
        { id: 'leg_n2_bl', geometry: 'cylinder', size: [0.04, 0.75, 8], position: [-0.22, -0.4, -0.22], material: { color: '#1E3A8A', roughness: 0.5, metallic: 0.0 } },
        { id: 'leg_n2_br', geometry: 'cylinder', size: [0.04, 0.75, 8], position: [0.22, -0.4, -0.22], material: { color: '#1E3A8A', roughness: 0.5, metallic: 0.0 } },
        { id: 'back_n2_rail', geometry: 'box', size: [0.55, 0.25, 0.05], position: [0, 0.45, 0.24], material: { color: '#1E3A8A', roughness: 0.5, metallic: 0.0 } },
      ],
    },

    // ── Cafe Seating Set 2: Large Dark Walnut Bar Table with 4 Legs (Left Midground) ──
    {
      id: 'work_table_left',
      geometry: 'box',
      size: [2.2, 0.08, 1.1], // Enlarged to 2.2m x 1.1m
      position: [-6.8, -1.3, -0.5],
      material: { color: '#3B1A0E', roughness: 0.4, metallic: 0.0 }, // Dark Walnut Top
      children: [
        { id: 'w_leg_l1', geometry: 'box', size: [0.08, 1.1, 0.08], position: [-0.95, -0.55, -0.45], material: { color: '#1E293B', roughness: 0.3, metallic: 0.8 } },
        { id: 'w_leg_l2', geometry: 'box', size: [0.08, 1.1, 0.08], position: [0.95, -0.55, -0.45], material: { color: '#1E293B', roughness: 0.3, metallic: 0.8 } },
        { id: 'w_leg_l3', geometry: 'box', size: [0.08, 1.1, 0.08], position: [-0.95, -0.55, 0.45], material: { color: '#1E293B', roughness: 0.3, metallic: 0.8 } },
        { id: 'w_leg_l4', geometry: 'box', size: [0.08, 1.1, 0.08], position: [0.95, -0.55, 0.45], material: { color: '#1E293B', roughness: 0.3, metallic: 0.8 } },
        { id: 'laptop_body', geometry: 'box', size: [0.42, 0.02, 0.28], position: [-0.4, 0.05, 0], material: { color: '#CBD5E1', roughness: 0.2, metallic: 0.8 } },
        { id: 'iced_tea', geometry: 'cylinder', size: [0.1, 0.22, 10], position: [0.5, 0.12, 0.1], material: { color: '#BAE6FD', roughness: 0.1, metallic: 0.0, opacity: 0.7, transparent: true } },
      ],
    },
    {
      id: 'barstool_left_brass',
      geometry: 'cylinder',
      size: [0.24, 0.06, 12],
      position: [-6.8, -1.5, -0.1],
      material: { color: '#1E293B', roughness: 0.7, metallic: 0.0 }, // Black Leather Seat Cushion
      children: [
        // 4 Tapered Brass Legs
        { id: 's_leg_1', geometry: 'cylinder', size: [0.03, 0.85, 8], position: [-0.15, -0.42, 0.15], material: { color: '#D97706', roughness: 0.3, metallic: 0.85 } },
        { id: 's_leg_2', geometry: 'cylinder', size: [0.03, 0.85, 8], position: [0.15, -0.42, 0.15], material: { color: '#D97706', roughness: 0.3, metallic: 0.85 } },
        { id: 's_leg_3', geometry: 'cylinder', size: [0.03, 0.85, 8], position: [-0.15, -0.42, -0.15], material: { color: '#D97706', roughness: 0.3, metallic: 0.85 } },
        { id: 's_leg_4', geometry: 'cylinder', size: [0.03, 0.85, 8], position: [0.15, -0.42, -0.15], material: { color: '#D97706', roughness: 0.3, metallic: 0.85 } },
        { id: 's_ring', geometry: 'torus', size: [0.22, 0.02, 12], position: [0, -0.45, 0], material: { color: '#D97706', roughness: 0.3, metallic: 0.85 } }, // Footrest ring
      ],
    },

    // ── Cafe Seating Set 3: Large Warm Honey Oak Square Table with 4 Legs & Terracotta Velvet Chairs (Right Foreground) ──
    {
      id: 'square_table_right',
      geometry: 'box',
      size: [1.35, 0.08, 1.35], // Enlarged to 1.35m x 1.35m
      position: [6.5, -1.6, 2.2],
      material: { color: '#D97706', roughness: 0.4, metallic: 0.0 }, // Warm Honey Oak Top
      children: [
        { id: 'sq_leg_r1', geometry: 'cylinder', size: [0.06, 0.82, 8], position: [-0.55, -0.45, -0.55], material: { color: '#451A03', roughness: 0.6, metallic: 0.0 } },
        { id: 'sq_leg_r2', geometry: 'cylinder', size: [0.06, 0.82, 8], position: [0.55, -0.45, -0.55], material: { color: '#451A03', roughness: 0.6, metallic: 0.0 } },
        { id: 'sq_leg_r3', geometry: 'cylinder', size: [0.06, 0.82, 8], position: [-0.55, -0.45, 0.55], material: { color: '#451A03', roughness: 0.6, metallic: 0.0 } },
        { id: 'sq_leg_r4', geometry: 'cylinder', size: [0.06, 0.82, 8], position: [0.55, -0.45, 0.55], material: { color: '#451A03', roughness: 0.6, metallic: 0.0 } },
        { id: 'latte_cup_r', geometry: 'cylinder', size: [0.12, 0.14, 10], position: [0.2, 0.11, -0.2], material: { color: '#FEF08A', roughness: 0.3, metallic: 0.0 } },
        { id: 'plate_croissant', geometry: 'cylinder', size: [0.22, 0.02, 12], position: [-0.25, 0.05, 0.2], material: { color: '#F8FAFC', roughness: 0.2, metallic: 0.0 } },
      ],
    },
    {
      id: 'chair_terracotta_1',
      geometry: 'box',
      size: [0.55, 0.06, 0.55],
      position: [7.5, -1.65, 2.2],
      material: { color: '#C2410C', roughness: 0.7, metallic: 0.0 }, // Terracotta Velvet Cushion
      children: [
        { id: 'leg_t1_fl', geometry: 'cylinder', size: [0.04, 0.75, 8], position: [-0.22, -0.4, 0.22], material: { color: '#451A03', roughness: 0.6, metallic: 0.0 } },
        { id: 'leg_t1_fr', geometry: 'cylinder', size: [0.04, 0.75, 8], position: [0.22, -0.4, 0.22], material: { color: '#451A03', roughness: 0.6, metallic: 0.0 } },
        { id: 'leg_t1_bl', geometry: 'cylinder', size: [0.04, 0.75, 8], position: [-0.22, -0.4, -0.22], material: { color: '#451A03', roughness: 0.6, metallic: 0.0 } },
        { id: 'leg_t1_br', geometry: 'cylinder', size: [0.04, 0.75, 8], position: [0.22, -0.4, -0.22], material: { color: '#451A03', roughness: 0.6, metallic: 0.0 } },
        { id: 'c_back_terra1', geometry: 'box', size: [0.55, 0.55, 0.08], position: [0, 0.32, -0.24], material: { color: '#C2410C', roughness: 0.7, metallic: 0.0 } },
      ],
    },
    {
      id: 'chair_terracotta_2',
      geometry: 'box',
      size: [0.55, 0.06, 0.55],
      position: [5.5, -1.65, 2.2],
      material: { color: '#C2410C', roughness: 0.7, metallic: 0.0 },
      children: [
        { id: 'leg_t2_fl', geometry: 'cylinder', size: [0.04, 0.75, 8], position: [-0.22, -0.4, 0.22], material: { color: '#451A03', roughness: 0.6, metallic: 0.0 } },
        { id: 'leg_t2_fr', geometry: 'cylinder', size: [0.04, 0.75, 8], position: [0.22, -0.4, 0.22], material: { color: '#451A03', roughness: 0.6, metallic: 0.0 } },
        { id: 'leg_t2_bl', geometry: 'cylinder', size: [0.04, 0.75, 8], position: [-0.22, -0.4, -0.22], material: { color: '#451A03', roughness: 0.6, metallic: 0.0 } },
        { id: 'leg_t2_br', geometry: 'cylinder', size: [0.04, 0.75, 8], position: [0.22, -0.4, -0.22], material: { color: '#451A03', roughness: 0.6, metallic: 0.0 } },
        { id: 'c_back_terra2', geometry: 'box', size: [0.55, 0.55, 0.08], position: [0, 0.32, 0.24], material: { color: '#C2410C', roughness: 0.7, metallic: 0.0 } },
      ],
    },

    // ── Cafe Seating Set 4: Large Vintage Deep Teal Enamel Table (Right Midground) ──
    {
      id: 'teal_table_right',
      geometry: 'cylinder',
      size: [1.3, 0.08, 16], // Enlarged to 1.3m diameter
      position: [6.8, -1.3, -0.5],
      material: { color: '#0F766E', roughness: 0.2, metallic: 0.3 }, // Deep Teal Enamel Top
      children: [
        { id: 't_ped_r', geometry: 'cylinder', size: [0.09, 0.85, 10], position: [0, -0.45, 0], material: { color: '#1E293B', roughness: 0.3, metallic: 0.8 } },
        { id: 't_base_r', geometry: 'cylinder', size: [0.65, 0.05, 12], position: [0, -0.85, 0], material: { color: '#1E293B', roughness: 0.3, metallic: 0.8 } },
        { id: 'teapot_glass', geometry: 'sphere', size: [0.22, 10, 10], position: [0, 0.14, 0], material: { color: '#0EA5E9', roughness: 0.2, metallic: 0.1, opacity: 0.8, transparent: true } },
      ],
    },

    // ── Cafe Seating Set 5: Central Lounge Zone with Low Honey Birch Coffee Table & Plush Armchairs (Center Foreground) ──
    {
      id: 'lounge_coffee_table',
      geometry: 'box',
      size: [2.0, 0.08, 1.1], // Enlarged Coffee Table Top
      position: [0, -1.65, 3.2],
      material: { color: '#F59E0B', roughness: 0.4, metallic: 0.0 }, // Honey Birch Coffee Table
      children: [
        { id: 'c_leg_l1', geometry: 'cylinder', size: [0.05, 0.5, 8], position: [-0.85, -0.3, -0.4], material: { color: '#451A03', roughness: 0.6, metallic: 0.0 } },
        { id: 'c_leg_l2', geometry: 'cylinder', size: [0.05, 0.5, 8], position: [0.85, -0.3, -0.4], material: { color: '#451A03', roughness: 0.6, metallic: 0.0 } },
        { id: 'c_leg_l3', geometry: 'cylinder', size: [0.05, 0.5, 8], position: [-0.85, -0.3, 0.4], material: { color: '#451A03', roughness: 0.6, metallic: 0.0 } },
        { id: 'c_leg_l4', geometry: 'cylinder', size: [0.05, 0.5, 8], position: [0.85, -0.3, 0.4], material: { color: '#451A03', roughness: 0.6, metallic: 0.0 } },
        { id: 'mag_stack', geometry: 'box', size: [0.38, 0.06, 0.28], position: [-0.4, 0.08, 0], material: { color: '#0284C7', roughness: 0.7, metallic: 0.0 } },
        { id: 'mug_lounge', geometry: 'cylinder', size: [0.1, 0.14, 10], position: [0.4, 0.11, 0.1], material: { color: '#FEF08A', roughness: 0.3, metallic: 0.0 } },
      ],
    },
    {
      id: 'emerald_armchair_l',
      geometry: 'box',
      size: [0.75, 0.14, 0.75], // Seat Cushion
      position: [-1.6, -1.65, 3.2],
      material: { color: '#047857', roughness: 0.7, metallic: 0.0 }, // Emerald Velvet Armchair Left
      children: [
        { id: 'arm_l_leg1', geometry: 'cylinder', size: [0.05, 0.4, 8], position: [-0.3, -0.25, 0.3], material: { color: '#451A03', roughness: 0.6, metallic: 0.0 } },
        { id: 'arm_l_leg2', geometry: 'cylinder', size: [0.05, 0.4, 8], position: [0.3, -0.25, 0.3], material: { color: '#451A03', roughness: 0.6, metallic: 0.0 } },
        { id: 'arm_l_leg3', geometry: 'cylinder', size: [0.05, 0.4, 8], position: [-0.3, -0.25, -0.3], material: { color: '#451A03', roughness: 0.6, metallic: 0.0 } },
        { id: 'arm_l_leg4', geometry: 'cylinder', size: [0.05, 0.4, 8], position: [0.3, -0.25, -0.3], material: { color: '#451A03', roughness: 0.6, metallic: 0.0 } },
        { id: 'arm_l_back', geometry: 'box', size: [0.75, 0.65, 0.14], position: [0, 0.35, -0.3], material: { color: '#047857', roughness: 0.7, metallic: 0.0 } },
        { id: 'arm_l_arm1', geometry: 'box', size: [0.12, 0.35, 0.65], position: [-0.32, 0.2, 0], material: { color: '#047857', roughness: 0.7, metallic: 0.0 } },
        { id: 'arm_l_arm2', geometry: 'box', size: [0.12, 0.35, 0.65], position: [0.32, 0.2, 0], material: { color: '#047857', roughness: 0.7, metallic: 0.0 } },
      ],
    },
    {
      id: 'emerald_armchair_r',
      geometry: 'box',
      size: [0.75, 0.14, 0.75],
      position: [1.6, -1.65, 3.2],
      material: { color: '#047857', roughness: 0.7, metallic: 0.0 }, // Emerald Velvet Armchair Right
      children: [
        { id: 'arm_r_leg1', geometry: 'cylinder', size: [0.05, 0.4, 8], position: [-0.3, -0.25, 0.3], material: { color: '#451A03', roughness: 0.6, metallic: 0.0 } },
        { id: 'arm_r_leg2', geometry: 'cylinder', size: [0.05, 0.4, 8], position: [0.3, -0.25, 0.3], material: { color: '#451A03', roughness: 0.6, metallic: 0.0 } },
        { id: 'arm_r_leg3', geometry: 'cylinder', size: [0.05, 0.4, 8], position: [-0.3, -0.25, -0.3], material: { color: '#451A03', roughness: 0.6, metallic: 0.0 } },
        { id: 'arm_r_leg4', geometry: 'cylinder', size: [0.05, 0.4, 8], position: [0.3, -0.25, -0.3], material: { color: '#451A03', roughness: 0.6, metallic: 0.0 } },
        { id: 'arm_r_back', geometry: 'box', size: [0.75, 0.65, 0.14], position: [0, 0.35, -0.3], material: { color: '#047857', roughness: 0.7, metallic: 0.0 } },
        { id: 'arm_r_arm1', geometry: 'box', size: [0.12, 0.35, 0.65], position: [-0.32, 0.2, 0], material: { color: '#047857', roughness: 0.7, metallic: 0.0 } },
        { id: 'arm_r_arm2', geometry: 'box', size: [0.12, 0.35, 0.65], position: [0.32, 0.2, 0], material: { color: '#047857', roughness: 0.7, metallic: 0.0 } },
      ],
    },

    // ── Main Barista Coffee Bar & Countertop (Front and Center) ──
    {
      id: 'barista_counter_main',
      geometry: 'box',
      size: [10.5, 1.4, 1.6],
      position: [0, -1.4, 0.5],
      material: { color: '#451A03', roughness: 0.6, metallic: 0.0 }, // Mahogany Front
      children: [
        { id: 'counter_marble_slab', geometry: 'box', size: [10.8, 0.14, 1.8], position: [0, 0.72, 0], material: { color: '#F8FAFC', roughness: 0.15, metallic: 0.1 } }, // White Marble Top
        
        // ── Overhead Barista Chalkboard Menu Board (Clean Surface with Texture Writing) ──
        { id: 'bar_menu_frame', geometry: 'box', size: [5.6, 2.2, 0.12], position: [0, 2.8, 0], material: { color: '#451A03', roughness: 0.7, metallic: 0.0 } },
        { id: 'bar_menu_chalk', geometry: 'box', size: [5.2, 1.9, 0.04], position: [0, 2.8, 0.06], material: { color: '#1E293B', roughness: 1.0, metallic: 0.0 } },
        { id: 'bar_menu_rod1', geometry: 'cylinder', size: [0.04, 1.6, 8], position: [-2.2, 4.3, 0], material: { color: '#D97706', roughness: 0.3, metallic: 0.8 } },
        { id: 'bar_menu_rod2', geometry: 'cylinder', size: [0.04, 1.6, 8], position: [2.2, 4.3, 0], material: { color: '#D97706', roughness: 0.3, metallic: 0.8 } },

        // ── Chrome Commercial Espresso Machine on Counter ──
        { id: 'esp_body', geometry: 'box', size: [1.8, 1.2, 0.85], position: [1.8, 1.35, 0], material: { color: '#CBD5E1', roughness: 0.05, metallic: 0.95 } },
        { id: 'esp_spout1', geometry: 'cylinder', size: [0.05, 0.3, 8], position: [1.3, 0.85, 0.4], material: { color: '#475569', roughness: 0.2, metallic: 0.9 } },
        { id: 'esp_spout2', geometry: 'cylinder', size: [0.05, 0.3, 8], position: [2.3, 0.85, 0.4], material: { color: '#475569', roughness: 0.2, metallic: 0.9 } },

        // ── Coffee Bean Grinder & Syrup Bottles on Counter ──
        { id: 'grinder_base', geometry: 'box', size: [0.45, 0.75, 0.5], position: [0.2, 1.1, 0], material: { color: '#1E293B', roughness: 0.3, metallic: 0.5 } },
        { id: 'syrup_bot1', geometry: 'cylinder', size: [0.06, 0.25, 8], position: [-0.4, 0.9, 0.1], material: { color: '#D97706', roughness: 0.2, metallic: 0.0 } },
        { id: 'syrup_bot2', geometry: 'cylinder', size: [0.06, 0.25, 8], position: [-0.6, 0.9, 0.1], material: { color: '#78350F', roughness: 0.2, metallic: 0.0 } },

        // ── Glass Pastry Display Case (Croissants & Muffins) ──
        { id: 'pastry_base', geometry: 'box', size: [2.2, 0.18, 0.85], position: [-2.6, 0.88, 0], material: { color: '#78350F', roughness: 0.5, metallic: 0.0 } },
        { id: 'pastry_glass', geometry: 'box', size: [2.15, 0.75, 0.8], position: [-2.6, 1.32, 0], material: { color: '#E0F2FE', roughness: 0.1, metallic: 0.1, opacity: 0.35, transparent: true } },
        { id: 'muffin1', geometry: 'cylinder', size: [0.1, 0.12, 8], position: [-3.0, 1.05, 0.1], material: { color: '#451A03', roughness: 0.8, metallic: 0.0 } },
        { id: 'croissant1', geometry: 'box', size: [0.2, 0.08, 0.12], position: [-2.2, 1.05, 0.1], material: { color: '#F59E0B', roughness: 0.7, metallic: 0.0 } },
      ],
    },

    // ── Potted Monstera Plant ──
    {
      id: 'monstera_pot',
      geometry: 'cylinder',
      size: [0.45, 0.7, 12],
      position: [-8.8, -1.95, 0.8],
      material: { color: '#D97706', roughness: 0.7, metallic: 0.0 },
      children: [
        { id: 'm_leaf_1', geometry: 'sphere', size: [0.6, 10, 10], position: [0.2, 0.9, 0.1], material: { color: '#15803D', roughness: 0.35, metallic: 0.0 } },
      ],
    },
  ],
  backgroundLayers: [
    {
      // Layer 1: Exposed Red Brick Wall & Storefront Window Showing West Village Street
      id: 'brick_wall',
      props: [
        { id: 'wall_main', geometry: 'box', size: [22.0, 9.0, 0.3], position: [0, 1.8, -4.2], material: { color: '#9A3412', roughness: 0.85, metallic: 0.0 } },
        
        // ── Large Storefront Glass Window (Right Wall) ──
        { id: 'win_frame_cafe', geometry: 'box', size: [5.2, 4.2, 0.12], position: [5.2, 1.8, -4.1], material: { color: '#451A03', roughness: 0.4, metallic: 0.2 } },
        { id: 'win_glass_cafe', geometry: 'box', size: [4.8, 3.8, 0.02], position: [5.2, 1.8, -4.05], material: { color: '#BAE6FD', roughness: 0.1, metallic: 0.0, opacity: 0.35, transparent: true } },
        // Outside West Village Street visible through Window
        { id: 'ext_street', geometry: 'box', size: [8.0, 0.1, 6.0], position: [5.2, -2.4, -6.0], material: { color: '#64748B', roughness: 0.8, metallic: 0.0 } },
        { id: 'ext_tree_cafe', geometry: 'sphere', size: [2.2, 10, 10], position: [6.8, 0.5, -6.5], material: { color: '#16A34A', roughness: 0.9, metallic: 0.0 } },
        { id: 'ext_lamp_cafe', geometry: 'cylinder', size: [0.06, 3.5, 8], position: [3.8, 0.2, -6.2], material: { color: '#0F172A', roughness: 0.3, metallic: 0.8 } },
      ],
    },
  ],
  postProcessing: {
    bloom: { enabled: true, strength: 0.6, radius: 0.4, threshold: 0.7 },
    ssao: { enabled: true, radius: 0.4, minDistance: 0.001, maxDistance: 0.04 },
    dof: { enabled: false, focus: 5.0, aperture: 0.003, maxblur: 0.006 },
    vignette: true,
    godRays: false,
  },
  cameraPosition: [0, 2.0, 10.5],
  cameraTarget: [0, -0.5, 0],
};

// ─────────────────────────────────────────────────────
// LEVEL 4: NEW YORK PUBLIC LIBRARY (Main Branch)
// Atmosphere: Grand hall with double-height arched windows looking out onto Fifth Avenue.
// ─────────────────────────────────────────────────────
const publicLibrary: VenueEnvironmentDef = {
  venueId: 'public_library',
  displayName: 'Public Library',
  floor: {
    geometry: 'plane',
    size: [28, 18],
    position: [0, -2.5, 0],
    material: {
      color: '#FEF3C7',
      roughness: 0.12,
      metallic: 0.05,
    },
  },
  lights: [
    {
      type: 'directional',
      color: '#FFFBEB',
      intensity: 2.8,
      position: [10, 12, 5],
      target: [0, -0.5, 0],
      castShadow: true,
      shadowMapSize: 2048,
    },
    {
      type: 'ambient',
      color: '#FFF7ED', // Bright warm ivory ambient light
      intensity: 1.8,
    },
    {
      type: 'point',
      color: '#FEF08A',
      intensity: 3.5,
      position: [0, 6.0, 3],
      distance: 25,
    },
    {
      type: 'point',
      color: '#22C55E',
      intensity: 2.5,
      position: [-4.2, -0.7, 1.5],
      distance: 8,
    },
    {
      type: 'point',
      color: '#22C55E',
      intensity: 2.5,
      position: [4.2, -0.7, 1.5],
      distance: 8,
    },
  ],
  props: [
    // ── Grand Library Back Wall, Archway & Upper Mezzanine Balcony Rail ──
    {
      id: 'back_lib_wall',
      geometry: 'box',
      size: [22.0, 9.0, 0.3],
      position: [0, 2.0, -4.5],
      material: { color: '#FFFBEB', roughness: 0.3, metallic: 0.0 }, // Ivory plaster back wall
      children: [
        { id: 'back_wainscot', geometry: 'box', size: [22.0, 2.6, 0.32], position: [0, -3.2, 0.02], material: { color: '#451A03', roughness: 0.5, metallic: 0.0 } }, // Dark Oak Wainscoting
        { id: 'back_gold_trim', geometry: 'box', size: [22.0, 0.12, 0.34], position: [0, -1.8, 0.03], material: { color: '#D97706', roughness: 0.3, metallic: 0.8 } }, // Gold Trim
        
        // Grand Central Library Archway Frame
        { id: 'grand_arch_frame', geometry: 'box', size: [7.2, 7.2, 0.14], position: [0, 0.6, 0.04], material: { color: '#3B1A0E', roughness: 0.5, metallic: 0.0 } },
        { id: 'grand_arch_inner', geometry: 'box', size: [6.6, 6.6, 0.06], position: [0, 0.6, 0.08], material: { color: '#0F172A', roughness: 0.9, metallic: 0.0 } }, // Deep arch interior shadow
        
        // Upper Mezzanine Balcony Gallery Railing
        { id: 'mezzanine_rail', geometry: 'box', size: [22.0, 0.5, 0.6], position: [0, 3.8, 0.2], material: { color: '#451A03', roughness: 0.5, metallic: 0.0 } },
        { id: 'mezzanine_gold_strip', geometry: 'box', size: [22.0, 0.1, 0.64], position: [0, 4.05, 0.22], material: { color: '#D97706', roughness: 0.3, metallic: 0.8 } },
      ],
    },

    // ── Hanging Brass Ceiling Chandeliers ──
    {
      id: 'chandelier_left',
      geometry: 'cylinder',
      size: [0.03, 2.4, 8],
      position: [-4.2, 4.5, 1.0],
      material: { color: '#D97706', roughness: 0.25, metallic: 0.85 },
      children: [
        { id: 'chand_ring_l', geometry: 'torus', size: [0.75, 0.06, 16], position: [0, -1.2, 0], material: { color: '#D97706', roughness: 0.25, metallic: 0.85 } },
        { id: 'chand_bulb_l1', geometry: 'sphere', size: [0.15, 10, 10], position: [-0.6, -1.1, 0], material: { color: '#FEF08A', roughness: 0.1, metallic: 0.0, emissive: '#F59E0B', emissiveIntensity: 2.0 } },
        { id: 'chand_bulb_l2', geometry: 'sphere', size: [0.15, 10, 10], position: [0.6, -1.1, 0], material: { color: '#FEF08A', roughness: 0.1, metallic: 0.0, emissive: '#F59E0B', emissiveIntensity: 2.0 } },
      ],
    },
    {
      id: 'chandelier_right',
      geometry: 'cylinder',
      size: [0.03, 2.4, 8],
      position: [4.2, 4.5, 1.0],
      material: { color: '#D97706', roughness: 0.25, metallic: 0.85 },
      children: [
        { id: 'chand_ring_r', geometry: 'torus', size: [0.75, 0.06, 16], position: [0, -1.2, 0], material: { color: '#D97706', roughness: 0.25, metallic: 0.85 } },
        { id: 'chand_bulb_r1', geometry: 'sphere', size: [0.15, 10, 10], position: [-0.6, -1.1, 0], material: { color: '#FEF08A', roughness: 0.1, metallic: 0.0, emissive: '#F59E0B', emissiveIntensity: 2.0 } },
        { id: 'chand_bulb_r2', geometry: 'sphere', size: [0.15, 10, 10], position: [0.6, -1.1, 0], material: { color: '#FEF08A', roughness: 0.1, metallic: 0.0, emissive: '#F59E0B', emissiveIntensity: 2.0 } },
      ],
    },

    // ── Towering Mahogany Bookshelves Stocked with Detailed Books & Gold Embossed Spines ──
    // ── Left Side Bookshelf Unit & All 5 Shelf Tiers ──
    {
      id: 'shelf_frame_L',
      geometry: 'box',
      size: [5.2, 9.0, 1.2],
      position: [-6.8, 1.5, 1.0],
      material: { color: '#451A03', roughness: 0.55, metallic: 0.0 }, // Mahogany Frame
      children: [
        { id: 'bks_L1', geometry: 'box', size: [4.8, 0.85, 0.85], position: [0, -3.2, 0.2], material: { color: '#991B1B', roughness: 0.7, metallic: 0.0 } }, // Crimson Leather Books
        { id: 'bks_L1_gold', geometry: 'box', size: [4.82, 0.12, 0.87], position: [0, -3.2, 0.22], material: { color: '#D97706', roughness: 0.3, metallic: 0.8 } }, // Gold Spine Bands
        { id: 'bks_L2', geometry: 'box', size: [4.8, 0.85, 0.85], position: [0, -1.8, 0.2], material: { color: '#1E3A8A', roughness: 0.7, metallic: 0.0 } }, // Navy Blue Books
        { id: 'bks_L2_gold', geometry: 'box', size: [4.82, 0.12, 0.87], position: [0, -1.8, 0.22], material: { color: '#D97706', roughness: 0.3, metallic: 0.8 } },
        { id: 'bks_L3', geometry: 'box', size: [4.8, 0.85, 0.85], position: [0, -0.4, 0.2], material: { color: '#064E3B', roughness: 0.7, metallic: 0.0 } }, // Emerald Green Books
        { id: 'bks_L3_gold', geometry: 'box', size: [4.82, 0.12, 0.87], position: [0, -0.4, 0.22], material: { color: '#D97706', roughness: 0.3, metallic: 0.8 } },
        { id: 'bks_L4', geometry: 'box', size: [4.8, 0.85, 0.85], position: [0, 1.0, 0.2], material: { color: '#C2410C', roughness: 0.7, metallic: 0.0 } },  // Amber Brown Books
        { id: 'bks_L4_gold', geometry: 'box', size: [4.82, 0.12, 0.87], position: [0, 1.0, 0.22], material: { color: '#D97706', roughness: 0.3, metallic: 0.8 } },
        { id: 'bks_L5', geometry: 'box', size: [4.8, 0.85, 0.85], position: [0, 2.4, 0.2], material: { color: '#581C87', roughness: 0.7, metallic: 0.0 } },  // Purple Books
        { id: 'bks_L5_gold', geometry: 'box', size: [4.82, 0.12, 0.87], position: [0, 2.4, 0.22], material: { color: '#D97706', roughness: 0.3, metallic: 0.8 } },
      ],
    },

    // ── Right Side Bookshelf Unit & All 5 Shelf Tiers ──
    {
      id: 'shelf_frame_R',
      geometry: 'box',
      size: [5.2, 9.0, 1.2],
      position: [6.8, 1.5, 1.0],
      material: { color: '#451A03', roughness: 0.55, metallic: 0.0 },
      children: [
        { id: 'bks_R1', geometry: 'box', size: [4.8, 0.85, 0.85], position: [0, -3.2, 0.2], material: { color: '#831843', roughness: 0.7, metallic: 0.0 } }, // Burgundy Books
        { id: 'bks_R1_gold', geometry: 'box', size: [4.82, 0.12, 0.87], position: [0, -3.2, 0.22], material: { color: '#D97706', roughness: 0.3, metallic: 0.8 } },
        { id: 'bks_R2', geometry: 'box', size: [4.8, 0.85, 0.85], position: [0, -1.8, 0.2], material: { color: '#172554', roughness: 0.7, metallic: 0.0 } }, // Midnight Blue Books
        { id: 'bks_R2_gold', geometry: 'box', size: [4.82, 0.12, 0.87], position: [0, -1.8, 0.22], material: { color: '#D97706', roughness: 0.3, metallic: 0.8 } },
        { id: 'bks_R3', geometry: 'box', size: [4.8, 0.85, 0.85], position: [0, -0.4, 0.2], material: { color: '#14532D', roughness: 0.7, metallic: 0.0 } }, // Forest Green Books
        { id: 'bks_R3_gold', geometry: 'box', size: [4.82, 0.12, 0.87], position: [0, -0.4, 0.22], material: { color: '#D97706', roughness: 0.3, metallic: 0.8 } },
        { id: 'bks_R4', geometry: 'box', size: [4.8, 0.85, 0.85], position: [0, 1.0, 0.2], material: { color: '#7C2D12', roughness: 0.7, metallic: 0.0 } },  // Dark Mahogany Books
        { id: 'bks_R4_gold', geometry: 'box', size: [4.82, 0.12, 0.87], position: [0, 1.0, 0.22], material: { color: '#D97706', roughness: 0.3, metallic: 0.8 } },
        { id: 'bks_R5', geometry: 'box', size: [4.8, 0.85, 0.85], position: [0, 2.4, 0.2], material: { color: '#312E81', roughness: 0.7, metallic: 0.0 } },  // Royal Indigo Books
        { id: 'bks_R5_gold', geometry: 'box', size: [4.82, 0.12, 0.87], position: [0, 2.4, 0.22], material: { color: '#D97706', roughness: 0.3, metallic: 0.8 } },
      ],
    },

    // ── Center Grand Arch Bookshelf Unit & All 5 Shelf Tiers ──
    {
      id: 'shelf_frame_C',
      geometry: 'box',
      size: [6.8, 9.0, 1.2],
      position: [0, 1.5, -1.2],
      material: { color: '#3B1A0E', roughness: 0.55, metallic: 0.0 },
      children: [
        { id: 'bks_C1', geometry: 'box', size: [6.4, 0.85, 0.85], position: [0, -3.2, 0.2], material: { color: '#9F1239', roughness: 0.7, metallic: 0.0 } }, // Crimson Books
        { id: 'bks_C1_gold', geometry: 'box', size: [6.42, 0.12, 0.87], position: [0, -3.2, 0.22], material: { color: '#D97706', roughness: 0.3, metallic: 0.8 } },
        { id: 'bks_C2', geometry: 'box', size: [6.4, 0.85, 0.85], position: [0, -1.8, 0.2], material: { color: '#1E40AF', roughness: 0.7, metallic: 0.0 } }, // Sapphire Blue Books
        { id: 'bks_C2_gold', geometry: 'box', size: [6.42, 0.12, 0.87], position: [0, -1.8, 0.22], material: { color: '#D97706', roughness: 0.3, metallic: 0.8 } },
        { id: 'bks_C3', geometry: 'box', size: [6.4, 0.85, 0.85], position: [0, -0.4, 0.2], material: { color: '#047857', roughness: 0.7, metallic: 0.0 } }, // Jade Green Books
        { id: 'bks_C3_gold', geometry: 'box', size: [6.42, 0.12, 0.87], position: [0, -0.4, 0.22], material: { color: '#D97706', roughness: 0.3, metallic: 0.8 } },
        { id: 'bks_C4', geometry: 'box', size: [6.4, 0.85, 0.85], position: [0, 1.0, 0.2], material: { color: '#EA580C', roughness: 0.7, metallic: 0.0 } },  // Burnt Orange Books
        { id: 'bks_C4_gold', geometry: 'box', size: [6.42, 0.12, 0.87], position: [0, 1.0, 0.22], material: { color: '#D97706', roughness: 0.3, metallic: 0.8 } },
        { id: 'bks_C5', geometry: 'box', size: [6.4, 0.85, 0.85], position: [0, 2.4, 0.2], material: { color: '#6B21A8', roughness: 0.7, metallic: 0.0 } },  // Purple Books
        { id: 'bks_C5_gold', geometry: 'box', size: [6.42, 0.12, 0.87], position: [0, 2.4, 0.22], material: { color: '#D97706', roughness: 0.3, metallic: 0.8 } },
      ],
    },

    // ── Architectural Library Interior Walls & Wood Wainscoting ──
    {
      id: 'lib_wall_left',
      geometry: 'box',
      size: [0.3, 9.0, 14.0],
      position: [-10.0, 2.0, -1.0],
      material: { color: '#FFFBEB', roughness: 0.3, metallic: 0.0 }, // Ivory plaster wall
      children: [
        { id: 'lib_wainscot_l', geometry: 'box', size: [0.32, 2.6, 14.0], position: [0, -3.2, 0], material: { color: '#451A03', roughness: 0.5, metallic: 0.0 } }, // Dark Oak Wainscoting
        { id: 'lib_gold_trim_l', geometry: 'box', size: [0.34, 0.12, 14.0], position: [0, -1.8, 0], material: { color: '#D97706', roughness: 0.3, metallic: 0.8 } }, // Gold Trim
      ],
    },
    {
      id: 'lib_wall_right',
      geometry: 'box',
      size: [0.3, 9.0, 14.0],
      position: [10.0, 2.0, -1.0],
      material: { color: '#FFFBEB', roughness: 0.3, metallic: 0.0 },
      children: [
        { id: 'lib_wainscot_r', geometry: 'box', size: [0.32, 2.6, 14.0], position: [0, -3.2, 0], material: { color: '#451A03', roughness: 0.5, metallic: 0.0 } },
        { id: 'lib_gold_trim_r', geometry: 'box', size: [0.34, 0.12, 14.0], position: [0, -1.8, 0], material: { color: '#D97706', roughness: 0.3, metallic: 0.8 } },
      ],
    },

    // ── Midground Freestanding Book Displays & Book Banks ──
    {
      id: 'book_bank_left',
      geometry: 'box',
      size: [3.8, 2.2, 0.8],
      position: [-4.2, -1.2, 0.5],
      material: { color: '#451A03', roughness: 0.5, metallic: 0.0 }, // Mahogany Wood Book Bank
      children: [
        { id: 'bb_books_top_l', geometry: 'box', size: [3.5, 0.65, 0.5], position: [0, 0.75, 0], material: { color: '#991B1B', roughness: 0.7, metallic: 0.0 } },
        { id: 'bb_books_bot_l', geometry: 'box', size: [3.5, 0.65, 0.5], position: [0, -0.15, 0], material: { color: '#1E3A8A', roughness: 0.7, metallic: 0.0 } },
      ],
    },
    {
      id: 'book_bank_right',
      geometry: 'box',
      size: [3.8, 2.2, 0.8],
      position: [4.2, -1.2, 0.5],
      material: { color: '#451A03', roughness: 0.5, metallic: 0.0 },
      children: [
        { id: 'bb_books_top_r', geometry: 'box', size: [3.5, 0.65, 0.5], position: [0, 0.75, 0], material: { color: '#064E3B', roughness: 0.7, metallic: 0.0 } },
        { id: 'bb_books_bot_r', geometry: 'box', size: [3.5, 0.65, 0.5], position: [0, -0.15, 0], material: { color: '#D97706', roughness: 0.7, metallic: 0.0 } },
      ],
    },

    // ── Marble Pillars ──
    {
      id: 'pillar_left',
      geometry: 'cylinder',
      size: [0.6, 9.0, 16],
      position: [-8.5, 2.0, 1.5],
      material: { color: '#FEF3C7', roughness: 0.2, metallic: 0.05 },
    },
    {
      id: 'pillar_right',
      geometry: 'cylinder',
      size: [0.6, 9.0, 16],
      position: [8.5, 2.0, 1.5],
      material: { color: '#FEF3C7', roughness: 0.2, metallic: 0.05 },
    },
    // ── Study Table & Lamps ──
    {
      id: 'study_table',
      geometry: 'box',
      size: [10.5, 0.14, 1.8],
      position: [0, -1.4, 2.2],
      material: { color: '#451A03', roughness: 0.3, metallic: 0.0 },
      children: [
        { id: 'blotter_left', geometry: 'box', size: [2.6, 0.02, 1.1], position: [-4.0, 0.08, 0], material: { color: '#14532D', roughness: 0.7, metallic: 0.0 } },
        { id: 'blotter_right', geometry: 'box', size: [2.6, 0.02, 1.1], position: [4.0, 0.08, 0], material: { color: '#14532D', roughness: 0.7, metallic: 0.0 } },
      ],
    },
    {
      id: 'lamp_left',
      geometry: 'cylinder',
      size: [0.24, 0.06, 12],
      position: [-4.2, -1.25, 2.2],
      material: { color: '#D97706', roughness: 0.25, metallic: 0.8 },
      children: [
        { id: 'b_shade_l', geometry: 'box', size: [0.6, 0.18, 0.3], position: [0, 0.95, 0], material: { color: '#15803D', roughness: 0.3, metallic: 0.0, emissive: '#22C55E', emissiveIntensity: 2.4 } },
      ],
    },
    {
      id: 'lamp_right',
      geometry: 'cylinder',
      size: [0.24, 0.06, 12],
      position: [4.2, -1.25, 2.2],
      material: { color: '#D97706', roughness: 0.25, metallic: 0.8 },
      children: [
        { id: 'b_shade_r', geometry: 'box', size: [0.6, 0.18, 0.3], position: [0, 0.95, 0], material: { color: '#15803D', roughness: 0.3, metallic: 0.0, emissive: '#22C55E', emissiveIntensity: 2.4 } },
      ],
    },
    {
      id: 'book_stack_left',
      geometry: 'box',
      size: [0.8, 0.14, 0.55],
      position: [-2.5, -1.26, 2.2],
      rotation: [0, 0.12, 0],
      material: { color: '#991B1B', roughness: 0.6, metallic: 0.0 },
    },
    {
      id: 'open_book',
      geometry: 'box',
      size: [0.9, 0.04, 0.65],
      position: [2.5, -1.3, 2.2],
      rotation: [0, -0.15, 0],
      material: { color: '#78350F', roughness: 0.7, metallic: 0.0 },
    },
  ],
  backgroundLayers: [
    {
      // Layer 1: Double-height Arched Windows looking out onto Fifth Avenue & Trees
      id: 'windows',
      props: [
        { id: 'window_frame_L', geometry: 'box', size: [3.2, 7.0, 0.12], position: [-10.5, 3.5, -8.0], material: { color: '#451A03', roughness: 0.5, metallic: 0.1 } },
        { id: 'window_glass_L', geometry: 'box', size: [2.7, 6.0, 0.02], position: [-10.5, 3.5, -7.9], material: { color: '#FEF3C7', roughness: 0.1, metallic: 0.0, opacity: 0.6, transparent: true } },
        { id: 'window_frame_R', geometry: 'box', size: [3.2, 7.0, 0.12], position: [10.5, 3.5, -8.0], material: { color: '#451A03', roughness: 0.5, metallic: 0.1 } },
        { id: 'window_glass_R', geometry: 'box', size: [2.7, 6.0, 0.02], position: [10.5, 3.5, -7.9], material: { color: '#FEF3C7', roughness: 0.1, metallic: 0.0, opacity: 0.6, transparent: true } },
      ],
    },
  ],
  postProcessing: {
    bloom: { enabled: false, strength: 0.0, radius: 0.0, threshold: 1.0 },
    ssao: { enabled: true, radius: 0.5, minDistance: 0.001, maxDistance: 0.05 },
    dof: { enabled: false, focus: 6.0, aperture: 0.003, maxblur: 0.005 },
    vignette: false,
    godRays: false,
  },
  cameraPosition: [0, 2.0, 10.5],
  cameraTarget: [0, -0.5, 0],
};

// ─────────────────────────────────────────────────────
// REGISTRY
// ─────────────────────────────────────────────────────
export const VENUE_ENVIRONMENTS: Record<string, VenueEnvironmentDef> = {
  central_park: centralPark,
  nyc_hospital: nycHospital,
  mackenzie_cafe: westVillageCafe,
  public_library: publicLibrary,
};

/** Get a venue environment config by ID, or null if not a procedural venue */
export function getVenueEnvironment(venueId: string): VenueEnvironmentDef | null {
  return VENUE_ENVIRONMENTS[venueId] ?? null;
}
