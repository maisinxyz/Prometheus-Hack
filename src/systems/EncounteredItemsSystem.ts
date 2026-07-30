export class EncounteredItemsSystem {
  private static readonly STORAGE_KEY = 'trashdash_encountered_items';
  private encountered: Set<string>;

  constructor() {
    this.encountered = new Set<string>();
    this.load();
  }

  private load() {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(EncounteredItemsSystem.STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            this.encountered = new Set(parsed);
          }
        } catch (e) {
          console.error('Failed to parse encountered items', e);
        }
      }
    }
  }

  private save() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
        EncounteredItemsSystem.STORAGE_KEY,
        JSON.stringify(Array.from(this.encountered))
      );
    }
  }

  public markEncountered(itemIds: string[]) {
    let changed = false;
    for (const id of itemIds) {
      if (!this.encountered.has(id)) {
        this.encountered.add(id);
        changed = true;
      }
    }
    if (changed) {
      this.save();
    }
  }

  public hasEncountered(itemId: string): boolean {
    return this.encountered.has(itemId);
  }
}
