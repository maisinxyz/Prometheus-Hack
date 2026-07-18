import Phaser from 'phaser';

/**
 * HUDScene — Score/combo/timer overlay.
 * Stub for Track B (step B.10) and Track C to build upon.
 */
export class HUDScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HUDScene' });
  }

  create(): void {
    // HUD will be launched as a parallel scene over TrayScene in Track B
    // Placeholder: no-op until Track B wires up score/combo/timer display
  }
}
