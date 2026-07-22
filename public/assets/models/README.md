# 3D Model Assets

Place `.glb` (binary GLTF) model files here for the landmark overlay system.

## Expected File Names

| Landmark | File Name |
|----------|-----------|
| Madison Square Garden | `madison_square_garden.glb` |
| Empire State Building | `empire_state_building.glb` |
| One Times Square | `one_times_square.glb` |
| Rockefeller Center | `rockefeller_center.glb` |
| Hot Dog Stand | `hot_dog_stand.glb` |
| Five Guys | `five_guys.glb` |

## Notes

- Models should be exported with Y-up orientation.
- Units should be in meters.
- The system will auto-scale based on the `heightMeters` config in `LandmarkOverlayService.ts`.
- Until real assets are provided, the system renders vibrant procedural placeholder geometry.
