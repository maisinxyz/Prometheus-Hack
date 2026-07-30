export class GardenSystem {
  private static readonly PROGRESS_KEY = 'trashdash_garden_progress_v2';
  private static readonly TREE_PHASE_KEY = 'trashdash_garden_tree_phase'; // Legacy
  private static readonly UNLOCKED_HABITATS_KEY = 'trashdash_garden_habitats'; // Legacy
  private static readonly LAST_SEEN_KEY = 'trashdash_garden_last_seen_levels';
  public static readonly UNSEEN_UPGRADES_KEY = 'trashdash_garden_unseen_upgrades';

  private progress: Record<string, number> = {
    compost: 0,
    recycling: 0,
    plastic: 0,
    landfill: 0
  };

  private lastSeenLevels: Record<string, number> = {
    compost: 0,
    recycling: 0,
    plastic: 0,
    landfill: 0
  };

  constructor() {
    this.loadProgress();
    
    // Listen for storage events (so edits in Chrome Dev Tools trigger in real-time)
    window.addEventListener('storage', (e) => {
      if (e.key === GardenSystem.PROGRESS_KEY) {
        this.loadProgress();
      }
    });
  }

  private loadProgress(): void {
    const isDev = localStorage.getItem('trashdash_dev_mode') === 'true';
    let saved = isDev ? sessionStorage.getItem(GardenSystem.PROGRESS_KEY) : localStorage.getItem(GardenSystem.PROGRESS_KEY);
    
    // Fallback: If dev mode is active but no session data exists, clone from localStorage
    if (isDev && !saved) {
      saved = localStorage.getItem(GardenSystem.PROGRESS_KEY);
      if (saved) sessionStorage.setItem(GardenSystem.PROGRESS_KEY, saved);
    }

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
    
    const savedSeen = localStorage.getItem(GardenSystem.LAST_SEEN_KEY);
    if (savedSeen) {
      try {
        this.lastSeenLevels = JSON.parse(savedSeen);
      } catch (e) {}
    } else {
      // First time playing, initialize seen levels to current levels so we don't spam them
      this.updateLastSeenLevels();
    }
    
    this.checkLevelUps();
  }

  private updateLastSeenLevels(): void {
    this.lastSeenLevels = {
      compost: this.getCompostLevel(),
      recycling: this.getRecyclingLevel(),
      plastic: this.getPlasticLevel(),
      landfill: this.getLandfillLevel()
    };
    localStorage.setItem(GardenSystem.LAST_SEEN_KEY, JSON.stringify(this.lastSeenLevels));
  }

  private checkLevelUps(): void {
    const current = {
      compost: this.getCompostLevel(),
      recycling: this.getRecyclingLevel(),
      plastic: this.getPlasticLevel(),
      landfill: this.getLandfillLevel()
    };

    let upgraded = false;
    
    for (const [key, level] of Object.entries(current)) {
      if (level > (this.lastSeenLevels[key] || 0)) {
        upgraded = true;
        const desc = this.getUpgradeDescription(key, level);
        this.queueUnseenUpgrade(desc);
        this.showGlobalToast(`🎉 ${desc} Check the park!`);
      }
    }

    if (upgraded) {
      this.updateLastSeenLevels();
    }
  }

  private getUpgradeDescription(track: string, level: number): string {
    if (track === 'compost') {
      if (level <= 3) return 'Fresh grass and small flowers sprouted!';
      if (level <= 6) return 'Beautiful wildflowers are blooming!';
      if (level <= 8) return 'Butterflies have migrated to the garden!';
      return 'The garden flora is thriving wildly!';
    } else if (track === 'recycling') {
      if (level === 1) return 'A tiny tree sapling was planted!';
      if (level <= 4) return 'The park trees are growing taller!';
      if (level === 5) return 'The trees have fully matured!';
      if (level === 6) return 'Park benches have been installed!';
      if (level === 7) return 'Street lamps now illuminate the park!';
      if (level === 8) return 'People are relaxing on the park benches!';
      if (level === 9) return 'Picnic tables have been set up!';
      if (level === 10) return 'Families are enjoying the picnic tables!';
      return 'The park infrastructure expanded!';
    } else if (track === 'plastic') {
      const plasticSongs = [
        'River Flows In You', 'Time To Love', 'Star Tea Party', 'Idea 22',
        'Kiss The Rain', 'Icarus', 'Snowfall', 'Summer', 'Cherry Blossom', 'Canon in D'
      ];
      if (level >= 1 && level <= 10) {
        return `Unlocked song: ${plasticSongs[level - 1]}!`;
      }
      return 'A new musical track has been unlocked!';
    } else if (track === 'landfill') {
      if (level === 1) return 'The official park sign has been erected!';
      if (level <= 5) return 'Cute dogs are playing in the park!';
      if (level <= 10) return 'Squirrels and wildlife have moved in!';
      return 'More animals have appeared!';
    }
    return 'New upgrades appeared!';
  }

  private queueUnseenUpgrade(msg: string) {
    let queue: string[] = [];
    try {
      queue = JSON.parse(localStorage.getItem(GardenSystem.UNSEEN_UPGRADES_KEY) || '[]');
    } catch(e){}
    queue.push(msg);
    localStorage.setItem(GardenSystem.UNSEEN_UPGRADES_KEY, JSON.stringify(queue));
  }

  private showGlobalToast(message: string) {
    const toast = document.createElement('div');
    toast.innerText = message;
    toast.style.position = 'fixed';
    toast.style.top = '50%';
    toast.style.left = '50%';
    toast.style.transform = 'translate(-50%, -50%)';
    toast.style.backgroundColor = 'rgba(20, 30, 40, 0.95)';
    toast.style.color = '#fff';
    toast.style.padding = '24px 32px';
    toast.style.borderRadius = '16px';
    toast.style.fontSize = '24px';
    toast.style.textAlign = 'center';
    toast.style.fontWeight = 'bold';
    toast.style.boxShadow = '0 15px 35px rgba(0,0,0,0.6), 0 0 20px rgba(100, 200, 100, 0.5)';
    toast.style.border = '2px solid rgba(100, 200, 100, 0.8)';
    toast.style.zIndex = '99999';
    toast.style.transition = 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out';
    
    // Add pop-in effect
    toast.style.transform = 'translate(-50%, calc(-50% + 30px)) scale(0.95)';
    toast.style.opacity = '0';
    
    document.body.appendChild(toast);
    
    // Trigger animation
    requestAnimationFrame(() => {
      toast.style.transform = 'translate(-50%, -50%) scale(1)';
      toast.style.opacity = '1';
    });
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translate(-50%, calc(-50% - 20px)) scale(0.95)';
      setTimeout(() => toast.remove(), 500);
    }, 5000);
  }

  private saveProgress(): void {
    const isDev = localStorage.getItem('trashdash_dev_mode') === 'true';
    if (isDev) {
      sessionStorage.setItem(GardenSystem.PROGRESS_KEY, JSON.stringify(this.progress));
    } else {
      localStorage.setItem(GardenSystem.PROGRESS_KEY, JSON.stringify(this.progress));
    }
  }

  public addProgress(binId: string, amount: number): void {
    if (this.progress[binId] !== undefined) {
      this.progress[binId] += amount;
      this.saveProgress();
      this.checkLevelUps();
    }
  }

  public setProgress(binId: string, amount: number): void {
    if (this.progress[binId] !== undefined) {
      this.progress[binId] = amount;
      this.saveProgress();
      this.checkLevelUps();
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
