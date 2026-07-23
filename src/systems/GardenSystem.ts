export class GardenSystem {
  private static readonly PROGRESS_KEY = 'trashdash_garden_progress_v2';
  private static readonly TREE_PHASE_KEY = 'trashdash_garden_tree_phase'; // Legacy
  private static readonly UNLOCKED_HABITATS_KEY = 'trashdash_garden_habitats'; // Legacy

  private progress: Record<string, number> = {
    compost: 0,
    recycling: 0,
    plastic: 0,
    landfill: 0
  };

  constructor() {
    this.loadProgress();
  }

  private loadProgress(): void {
    const saved = localStorage.getItem(GardenSystem.PROGRESS_KEY);
    if (saved) {
      try {
        this.progress = { ...this.progress, ...JSON.parse(saved) };
      } catch (e) {
        console.error("Failed to parse garden progress", e);
      }
    } else {
      // Migrate legacy compost
      const legacyCompost = localStorage.getItem('trashdash_garden_compost');
      if (legacyCompost) {
        this.progress.compost = parseInt(legacyCompost, 10) || 0;
      }
      this.saveProgress();
    }
  }

  private saveProgress(): void {
    localStorage.setItem(GardenSystem.PROGRESS_KEY, JSON.stringify(this.progress));
  }

  public addProgress(binId: string, amount: number): void {
    if (this.progress[binId] !== undefined) {
      this.progress[binId] += amount;
      this.saveProgress();
    }
  }

  public getRawCount(binId: string): number {
    return this.progress[binId] || 0;
  }

  public getCompostLevel(): number {
    return Math.min(10, Math.floor(this.progress.compost / 30));
  }

  public getRecyclingLevel(): number {
    if (this.getCompostLevel() < 5) return 0;
    return Math.min(10, Math.floor(this.progress.recycling / 30));
  }

  public getPlasticLevel(): number {
    if (this.getCompostLevel() < 5) return 0;
    return Math.min(10, Math.floor(this.progress.plastic / 30));
  }

  public getLandfillLevel(): number {
    if (this.getCompostLevel() < 5) return 0;
    return Math.min(5, Math.floor(this.progress.landfill / 50));
  }
  
  // Legacy methods mapping to new properties to not break other parts of code too harshly if they exist
  getCompost(): number { return this.getRawCount('compost'); }
  addCompost(amount: number): void { this.addProgress('compost', amount); }
  spendCompost(amount: number): boolean {
    if (this.progress.compost >= amount) {
      this.progress.compost -= amount;
      this.saveProgress();
      return true;
    }
    return false;
  }

  getTreePhase(): number {
    return parseInt(localStorage.getItem(GardenSystem.TREE_PHASE_KEY) || '1', 10);
  }

  upgradeTree(): void {
    const currentPhase = this.getTreePhase();
    if (currentPhase < 3) {
      localStorage.setItem(GardenSystem.TREE_PHASE_KEY, (currentPhase + 1).toString());
    }
  }

  getUnlockedHabitats(): string[] {
    const habitatsStr = localStorage.getItem(GardenSystem.UNLOCKED_HABITATS_KEY);
    if (!habitatsStr) return [];
    try {
      return JSON.parse(habitatsStr) as string[];
    } catch (e) {
      return [];
    }
  }

  unlockHabitat(habitatId: string): void {
    const habitats = this.getUnlockedHabitats();
    if (!habitats.includes(habitatId)) {
      habitats.push(habitatId);
      localStorage.setItem(GardenSystem.UNLOCKED_HABITATS_KEY, JSON.stringify(habitats));
    }
  }

  isHabitatUnlocked(habitatId: string): boolean {
    const habitats = this.getUnlockedHabitats();
    return habitats.includes(habitatId);
  }
}
