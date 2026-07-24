class MapCameraControllerSingleton {
  private map: any = null;

  public setMap(map: any) {
    this.map = map;
  }

  /**
   * Instantly snaps the camera to lock onto a node.
   * Used on scene load.
   */
  public lockOnNode(lng: number, lat: number) {
    if (!this.map) return;
    
    // We flyTo with a quick duration so it settles smoothly but fast
    this.map.flyTo({
      center: [lng, lat],
      zoom: 16.5,
      pitch: 65,
      bearing: -20,
      duration: 1000,
      essential: true
    });
  }

  /**
   * A gentle drift towards a node.
   * Used during the unlock sequence.
   */
  public driftToNode(lng: number, lat: number, duration: number = 1500) {
    if (!this.map) return;
    
    // An easeTo gives a more subtle, linear drift compared to flyTo's sweeping arc
    this.map.easeTo({
      center: [lng, lat],
      zoom: 16,
      pitch: 60,
      duration: duration,
      essential: true,
      easing: (t: number) => t * (2 - t) // easeOutQuad
    });
  }
}

export const MapCameraController = new MapCameraControllerSingleton();
