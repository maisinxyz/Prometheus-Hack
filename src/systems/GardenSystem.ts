export class GardenSystem {
  private static readonly COMPOST_KEY = 'trashdash_garden_compost';
  private static readonly TREE_PHASE_KEY = 'trashdash_garden_tree_phase';
  private static readonly UNLOCKED_HABITATS_KEY = 'trashdash_garden_habitats';

  getCompost(): number {
    return parseInt(localStorage.getItem(GardenSystem.COMPOST_KEY) || '0', 10);
  }

  addCompost(amount: number): void {
    const current = this.getCompost();
    localStorage.setItem(GardenSystem.COMPOST_KEY, (current + amount).toString());
  }

  spendCompost(amount: number): boolean {
    const current = this.getCompost();
    if (current >= amount) {
      localStorage.setItem(GardenSystem.COMPOST_KEY, (current - amount).toString());
      return true;
    }
    return false;
  }

  getTreePhase(): number {
    // Phase 1 (Sapling), Phase 2 (Growing), Phase 3 (Blooming)
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
