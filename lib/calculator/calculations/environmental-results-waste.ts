import type { ReusableProduct, SingleUseProduct } from '../../inventory/types/products';
import type { ProjectInventory } from '../../inventory/types/projects';
import type { Frequency } from '../constants/frequency';
import { getAnnualOccurrence } from '../constants/frequency';
import type { ChangeSummary } from '../utils';
import { getChangeSummaryRowRounded } from '../utils';

import { annualLineItemWeight } from './lineItemUtils';

// all values in pounds
export type AnnualWasteResults = {
  disposableProductWeight: ChangeSummary;
  disposableShippingBoxWeight: ChangeSummary;
  total: ChangeSummary;
};

export function getAnnualWasteChanges(project: ProjectInventory): AnnualWasteResults {
  const baselineItems = [
    ...project.singleUseItems.map(item => ({
      casesPurchased: item.casesPurchased,
      product: item.product,
      frequency: item.frequency,
      unitsPerCase: item.unitsPerCase
    }))
    // dont count 'baseline' of reusable items against this year's waste
    // ...project.reusableItems
    //   .filter(item => !!item.product)
    //   .map(item => ({
    //     casesPurchased: item.casesPurchased,
    //     product: item.product as ReusableProduct,
    //     frequency: 'Annually' as const
    //   }))
  ];
  const baseline = getAnnualWaste(baselineItems);

  const forecastItems = [
    ...project.singleUseItems.map(item => ({
      casesPurchased: item.newCasesPurchased,
      product: item.product,
      frequency: item.frequency,
      unitsPerCase: item.unitsPerCase
    })),
    ...project.reusableItems
      .filter(item => !!item.product)
      .map(item => ({
        casesPurchased: item.newCasesPurchased,
        product: item.product as ReusableProduct,
        frequency: 'Annually' as const,
        unitsPerCase: item.unitsPerCase
      }))
  ];

  const forecast = getAnnualWaste(forecastItems);

  const disposableProductWeight = getChangeSummaryRowRounded(baseline.productWeight, forecast.productWeight);
  const disposableShippingBoxWeight = getChangeSummaryRowRounded(
    baseline.shippingBoxWeight,
    forecast.shippingBoxWeight
  );
  const total = getChangeSummaryRowRounded(
    baseline.productWeight + baseline.shippingBoxWeight,
    forecast.productWeight + forecast.shippingBoxWeight
  );

  return {
    disposableProductWeight,
    disposableShippingBoxWeight,
    total
  };
}

type AnnualWaste = {
  productWeight: number;
  shippingBoxWeight: number;
};

function getAnnualWaste(
  lineItems: { casesPurchased: number; frequency: Frequency; product: SingleUseProduct; unitsPerCase: number }[]
): AnnualWaste {
  return lineItems.reduce<AnnualWaste>(
    (sums, lineItem) => {
      const annualOccurrence = getAnnualOccurrence(lineItem.frequency);
      const product = lineItem.product;
      const annualWeight = annualLineItemWeight(
        lineItem.casesPurchased,
        annualOccurrence,
        lineItem.unitsPerCase,
        product.itemWeight
      );
      const boxAnnualWeight = lineItem.casesPurchased * product.boxWeight * annualOccurrence;

      return {
        productWeight: sums.productWeight + annualWeight,
        shippingBoxWeight: sums.shippingBoxWeight + boxAnnualWeight
      };
    },
    { productWeight: 0, shippingBoxWeight: 0 }
  );
}
