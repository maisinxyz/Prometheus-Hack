import { describe, it, expect } from 'vitest';
import { MunicipalPolicyService, PolicyUpdate } from '../src/services/MunicipalPolicyService';
import { TrashItemDef } from '../src/data/schemas/itemSchema';

describe('MunicipalPolicyService', () => {
  const policyService = new MunicipalPolicyService();

  it('immutably overrides correctBinId for matched items', () => {
    const originalItems: TrashItemDef[] = [
      {
        id: 'coffee_cup',
        displayName: 'Coffee Cup',
        spriteKey: 'item_coffee_cup',
        correctBinId: 'landfill',
        isComposite: false,
        componentIds: [],
        venueIds: ['mackenzie_cafe']
      },
      {
        id: 'apple_core',
        displayName: 'Apple Core',
        spriteKey: 'item_apple_core',
        correctBinId: 'compost',
        isComposite: false,
        componentIds: [],
        venueIds: ['mackenzie_cafe']
      }
    ];

    const updates: PolicyUpdate[] = [
      {
        itemId: 'coffee_cup',
        newCorrectBinId: 'paper',
        effectiveDate: '2024-01-01T00:00:00Z'
      }
    ];

    const updatedItems = policyService.applyUpdates(originalItems, updates);

    // Verify it changed the target item
    const updatedCup = updatedItems.find(i => i.id === 'coffee_cup');
    expect(updatedCup?.correctBinId).toBe('paper');

    // Verify it did not mutate the original array element
    const originalCup = originalItems.find(i => i.id === 'coffee_cup');
    expect(originalCup?.correctBinId).toBe('landfill');

    // Verify untouched items remain the same object reference
    const updatedApple = updatedItems.find(i => i.id === 'apple_core');
    const originalApple = originalItems.find(i => i.id === 'apple_core');
    expect(updatedApple).toBe(originalApple);
  });
});
