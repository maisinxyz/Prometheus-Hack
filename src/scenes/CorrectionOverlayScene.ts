import Phaser from 'phaser';
import { TrashItemDef } from '../data/schemas/itemSchema';
import explanationsData from '../data/explanations.json';
import binsData from '../data/bins.json';

export interface CorrectionData {
  item: TrashItemDef;
  binUsed: string;
  correctBinId: string;
}

/**
 * CorrectionOverlayScene — Stub for Cluster C (Track G).
 * Displays a list of incorrect drops with explanations after a round.
 * 
 * Note: Per PRD, this is stubbed for a future sprint and may not be actively wired 
 * into the main gameplay loop by default.
 */
export class CorrectionOverlayScene extends Phaser.Scene {
  private corrections: CorrectionData[] = [];

  constructor() {
    super({ key: 'CorrectionOverlayScene' });
  }

  init(data: { corrections: CorrectionData[] }) {
    this.corrections = data.corrections || [];
  }

  create(): void {
    // Semi-transparent dark background
    this.add.rectangle(0, 0, 1920, 1080, 0x000000, 0.85).setOrigin(0);
    // Title
    this.add
      .text(960, 150, 'Correction Review', {
        fontFamily: '"Nunito", sans-serif',
        fontSize: '48px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    if (this.corrections.length === 0) {
      this.add.text(960, 300, 'Perfect Sorting!', {
        fontFamily: '"Nunito", sans-serif',
        fontSize: '48px',
        color: '#22c55e',
        fontStyle: 'bold'
      }).setOrigin(0.5);
    } else {
      // List each mistake
      let startY = 250;
      this.corrections.forEach((c) => {
        const itemDisplayName = c.item.displayName;
        const binUsedName = binsData.find(b => b.id === c.binUsed)?.displayName || c.binUsed;
        const correctBinName = binsData.find(b => b.id === c.correctBinId)?.displayName || c.correctBinId;
        const explanation = (explanationsData as Record<string, string>)[c.item.id] || "No explanation available.";

        const rowText = `${itemDisplayName}\nYou put it in: ${binUsedName} | Should go in: ${correctBinName}\nWhy: ${explanation}`;

        this.add.text(400, startY, rowText, {
          fontFamily: '"Nunito", sans-serif',
          fontSize: '28px',
          color: '#ffffff',
          lineSpacing: 10,
          wordWrap: { width: 1120 }
        });

        startY += 180;
      });
    }

    // Continue Button
    const continueBtn = this.add.text(960, 950, 'Continue', {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '48px',
      color: '#ffffff',
      backgroundColor: '#3b82f6',
      padding: { x: 40, y: 20 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    continueBtn.on('pointerup', () => {
      this.scene.start('LevelSelectScene'); // Return to map
    });
  }
}
