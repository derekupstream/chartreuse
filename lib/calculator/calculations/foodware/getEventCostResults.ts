import type { ProjectInventory } from 'lib/inventory/types/projects';

export type EventCostResults = {
  /** Sum of (sent - returned) × reusable cost per item across all foodware selections. */
  totalReusableReplacementCost: number;
  /** Sum of reusables sent × single-use cost per item across all foodware selections.
   *  Represents the avoided spend on disposables. */
  totalSingleUseAvoidedCost: number;
  /** Sum of LaborCost.cost across all labor entries — typically per-event, not annual, for events. */
  totalLaborCost: number;
  /** Sum of OtherExpense.cost across all other expense entries (transport, deposits, etc.). */
  totalOtherExpenseCost: number;
  /** Avoided cost minus replacement, labor, and other expenses. Positive = net savings. */
  netCostChange: number;
  perFoodwareItem: Array<{
    id: string;
    description: string;
    reusableItemCount: number;
    reusableReturnCount: number;
    itemsLost: number;
    reusableCostPerItem: number;
    singleUseCostPerItem: number;
    replacementCost: number;
    avoidedSingleUseCost: number;
  }>;
};

const EMPTY_RESULT: EventCostResults = {
  totalReusableReplacementCost: 0,
  totalSingleUseAvoidedCost: 0,
  totalLaborCost: 0,
  totalOtherExpenseCost: 0,
  netCostChange: 0,
  perFoodwareItem: []
};

/**
 * Computes per-event cost outputs for projects flagged isEventProject.
 * Returns zeros for non-event inventories so it can be called unconditionally.
 *
 * Inputs come from fixture-supplied per-foodware costs (reusableCostPerItem and
 * singleUseCostPerItem) which are not yet persisted on EventFoodwareLineItem rows;
 * production event projects pass through with zero costs until those fields are
 * exposed in the project setup UI and added to the DB schema.
 */
export function getEventCostResults(inventory: ProjectInventory): EventCostResults {
  if (!inventory.isEventProject) return EMPTY_RESULT;

  const perFoodwareItem = (inventory.foodwareItems ?? []).map(item => {
    const reusableItemCount = item.reusableItemCount ?? 0;
    const reusableReturnCount = item.reusableReturnCount ?? 0;
    const itemsLost = Math.max(0, reusableItemCount - reusableReturnCount);
    const reusableCostPerItem = item.reusableCostPerItem ?? 0;
    const singleUseCostPerItem = item.singleUseCostPerItem ?? 0;
    const replacementCost = itemsLost * reusableCostPerItem;
    const avoidedSingleUseCost = reusableItemCount * singleUseCostPerItem;
    return {
      id: item.id,
      description: item.reusableProduct?.description ?? 'Foodware item',
      reusableItemCount,
      reusableReturnCount,
      itemsLost,
      reusableCostPerItem,
      singleUseCostPerItem,
      replacementCost,
      avoidedSingleUseCost
    };
  });

  const totalReusableReplacementCost = perFoodwareItem.reduce((s, r) => s + r.replacementCost, 0);
  const totalSingleUseAvoidedCost = perFoodwareItem.reduce((s, r) => s + r.avoidedSingleUseCost, 0);
  const totalLaborCost = (inventory.laborCosts ?? []).reduce((s, l) => s + (l.cost ?? 0), 0);
  const totalOtherExpenseCost = (inventory.otherExpenses ?? []).reduce((s, o) => s + (o.cost ?? 0), 0);
  const netCostChange =
    totalSingleUseAvoidedCost - totalReusableReplacementCost - totalLaborCost - totalOtherExpenseCost;

  return {
    totalReusableReplacementCost,
    totalSingleUseAvoidedCost,
    totalLaborCost,
    totalOtherExpenseCost,
    netCostChange,
    perFoodwareItem
  };
}
