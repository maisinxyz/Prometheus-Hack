import { TrashItemDef } from '../data/schemas/itemSchema';
import mockPolicyUpdates from '../data/mockPolicyUpdates.json';

export interface PolicyUpdate {
  itemId: string;
  newCorrectBinId: string;
  effectiveDate: string;
  reason?: string;
}

/**
 * MunicipalPolicyService — Stub for municipal DB integration (Track H).
 * Simulates fetching live recycling rules from a city's database.
 */
export class MunicipalPolicyService {
  /**
   * Fetches the latest policy updates.
   * In a real implementation, this would be an API call.
   */
  async fetchPolicyUpdates(): Promise<PolicyUpdate[]> {
    // Return mock updates directly for now
    return mockPolicyUpdates as PolicyUpdate[];
  }

  /**
   * Immutably applies policy updates to a list of item definitions.
   * Overwrites the `correctBinId` for any item that has a matching update.
   */
  applyUpdates(items: TrashItemDef[], updates: PolicyUpdate[]): TrashItemDef[] {
    const updateMap = new Map<string, PolicyUpdate>();
    
    // Use the latest update for each item if there are duplicates
    for (const update of updates) {
      updateMap.set(update.itemId, update);
    }

    return items.map(item => {
      const update = updateMap.get(item.id);
      if (update) {
        return { ...item, correctBinId: update.newCorrectBinId };
      }
      return item;
    });
  }
}
