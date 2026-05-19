import { STATES } from 'lib/calculator/constants/utilities';
import type { ProjectInventory } from 'lib/inventory/types/projects';

import type { FixtureField, FixtureValues } from './projectionsFixture';

/**
 * Flat fixture schema for the Actuals / Event Model. Holds event-level fields only —
 * per-foodware-item editing (counts, water, per-item costs) lives in the dedicated
 * EventFoodwareEditor component which writes directly to inventory.foodwareItems[].
 */
export const EVENT_FIXTURE_FIELDS: FixtureField[] = [
  {
    key: 'state',
    label: 'State',
    type: 'select',
    helpText: 'Drives default utility rates',
    options: STATES.map(s => ({ value: s.name, label: s.name }))
  },
  {
    key: 'eventLaborCost',
    label: 'Event Labor Cost',
    type: 'number',
    unit: '$',
    helpText: 'Labor for setup, monitoring, return collection, washing'
  },
  {
    key: 'eventOtherCost',
    label: 'Event Other Cost',
    type: 'number',
    unit: '$',
    helpText: 'Transport, deposit handling, signage, or any one-off event expense'
  }
];

function num(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

export function extractEventFixtureValues(inventory: ProjectInventory): FixtureValues {
  const labor = inventory.laborCosts?.[0];
  const other = inventory.otherExpenses?.[0];
  return {
    state: inventory.state ?? 'Oregon',
    eventLaborCost: labor?.cost ?? 0,
    eventOtherCost: other?.cost ?? 0
  };
}

export function applyEventFixtureValues(reference: ProjectInventory, values: FixtureValues): ProjectInventory {
  const next: ProjectInventory = JSON.parse(JSON.stringify(reference));

  const stateValue = typeof values.state === 'string' && values.state ? values.state : next.state;
  next.state = stateValue as ProjectInventory['state'];

  const matched = STATES.find(s => s.name === stateValue);
  if (matched) {
    next.utilityRates = {
      gas: matched.gas,
      electric: matched.electric,
      water: next.utilityRates?.water ?? 0.005
    };
  }

  const projectIdHint = next.foodwareItems?.[0]?.projectId ?? '';

  // Labor: ensure a row exists if user supplied a non-zero value
  const laborCost = num(values.eventLaborCost, 0);
  if (laborCost > 0 || next.laborCosts.length > 0) {
    if (next.laborCosts.length === 0) {
      next.laborCosts.push({
        projectId: projectIdHint,
        categoryId: 'Service' as any,
        cost: laborCost,
        frequency: 'One Time' as any
      });
    } else {
      next.laborCosts[0].cost = laborCost;
    }
  }

  // Other expenses (transport, deposits, etc.)
  const otherCost = num(values.eventOtherCost, 0);
  if (otherCost > 0 || next.otherExpenses.length > 0) {
    if (next.otherExpenses.length === 0) {
      next.otherExpenses.push({
        projectId: projectIdHint,
        categoryId: 'Transportation' as any,
        cost: otherCost,
        frequency: 'One Time' as any
      });
    } else {
      next.otherExpenses[0].cost = otherCost;
    }
  }

  return next;
}

/**
 * Stand-alone editor for the foodwareItems array. Returns a deep clone with the
 * given index updated. Recomputes reusableReturnPercentage from sent/returned counts.
 */
export function applyFoodwareItemEdit(
  inventory: ProjectInventory,
  index: number,
  patch: Partial<{
    reusableItemCount: number;
    reusableReturnCount: number;
    waterUsageGallons: number;
    reusableCostPerItem: number;
    singleUseCostPerItem: number;
  }>
): ProjectInventory {
  const next: ProjectInventory = JSON.parse(JSON.stringify(inventory));
  const fw = next.foodwareItems?.[index];
  if (!fw) return next;
  if (patch.reusableItemCount !== undefined) fw.reusableItemCount = num(patch.reusableItemCount, fw.reusableItemCount);
  if (patch.reusableReturnCount !== undefined)
    fw.reusableReturnCount = num(patch.reusableReturnCount, fw.reusableReturnCount);
  if (patch.waterUsageGallons !== undefined)
    fw.waterUsageGallons = num(patch.waterUsageGallons, fw.waterUsageGallons ?? 0);
  if (patch.reusableCostPerItem !== undefined)
    fw.reusableCostPerItem = num(patch.reusableCostPerItem, fw.reusableCostPerItem ?? 0);
  if (patch.singleUseCostPerItem !== undefined)
    fw.singleUseCostPerItem = num(patch.singleUseCostPerItem, fw.singleUseCostPerItem ?? 0);
  fw.reusableReturnPercentage = fw.reusableItemCount > 0 ? (fw.reusableReturnCount / fw.reusableItemCount) * 100 : 0;
  return next;
}
