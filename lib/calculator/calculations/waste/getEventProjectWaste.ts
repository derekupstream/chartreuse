import { ProjectInventory } from 'lib/inventory/types/projects';
import { ChangeSummary, getChangeSummaryRow } from 'lib/calculator/utils';

export type EventProjectWaste = {
  singleUseItems: {
    productWeight: number;
    shippingBoxWeight: number;
    total: number;
  };
  reusableItems: {
    total: number;
  };
  summary: ChangeSummary;
};

export function getEventProjectWaste(project: ProjectInventory): EventProjectWaste {
  const singleUseItems = project.singleUseItems.reduce<EventProjectWaste['singleUseItems']>(
    (acc, { product, casesPurchased, unitsPerCase }) => {
      const itemCount = casesPurchased * unitsPerCase;
      acc.productWeight += product.itemWeight * itemCount;
      acc.shippingBoxWeight += product.boxWeightPerItem * itemCount;
      acc.total = acc.productWeight + acc.shippingBoxWeight;
      return acc;
    },
    {
      shippingBoxWeight: 0,
      productWeight: 0,
      total: 0
    }
  );
  const reusableItems = project.reusableItems.reduce<EventProjectWaste['reusableItems']>(
    (acc, { product, newCasesPurchased, unitsPerCase }) => {
      const itemCount = newCasesPurchased * unitsPerCase;
      acc.total += (product?.itemWeight ?? 0) * itemCount;
      return acc;
    },
    { total: 0 }
  );
  return {
    summary: getChangeSummaryRow(singleUseItems.total, reusableItems.total),
    singleUseItems,
    reusableItems
  };
}
