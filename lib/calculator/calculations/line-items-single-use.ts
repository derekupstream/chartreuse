import type { ProjectInventory } from '../../inventory/types/projects';
import { MATERIALS } from '../constants/materials';
import { PRODUCT_CATEGORIES } from '../constants/product-categories';
import { PRODUCT_TYPES } from '../constants/product-types';
import { getChangeSummaryRow } from '../utils';

import { getLineItemGasEmissions } from './environmental-results';
import type { PurchasingSummaryColumn, ProductForecastResults } from './line-items';
import { getResultsByType, annualLineItemCost, annualLineItemCaseCount } from './line-items';

export function getSingleUseResults(inventory: ProjectInventory): ProductForecastResults {
  const summary = getSingleUseProductSummary(inventory.singleUseItems);
  const resultsByType = getResultsByType({
    categories: PRODUCT_CATEGORIES,
    materials: MATERIALS,
    productTypes: PRODUCT_TYPES,
    lineItems: inventory.singleUseItems
  });

  return {
    summary,
    resultsByType
  };
}

// for each single use item, calculate difference in annual cost
export function getSingleUseProductSummary(
  singleUseItems: ProjectInventory['singleUseItems']
): ProductForecastResults['summary'] {
  const baseline = singleUseItems.reduce<PurchasingSummaryColumn>(
    (column, item) => {
      const { caseCost, casesPurchased, frequency, product } = item;
      const annualCost = annualLineItemCost({
        caseCost,
        casesPurchased,
        frequency
      });
      const annualUnits =
        product.unitsPerCase *
        annualLineItemCaseCount({
          casesPurchased,
          frequency
        });
      const emissions = getLineItemGasEmissions({
        lineItem: item,
        frequency: 'Annually'
      }).total;

      return {
        annualCost: column.annualCost + annualCost,
        annualGHG: column.annualGHG + emissions.baseline,
        annualUnits: column.annualUnits + annualUnits,
        productCount: annualUnits > 0 ? column.productCount + 1 : column.productCount
      };
    },
    { annualCost: 0, annualGHG: 0, annualUnits: 0, productCount: 0 }
  );

  const forecast = singleUseItems.reduce<PurchasingSummaryColumn>(
    (column, item) => {
      const { newCaseCost: caseCost, newCasesPurchased: casesPurchased, frequency, product } = item;
      const annualCost = annualLineItemCost({
        caseCost,
        casesPurchased,
        frequency
      });
      const annualUnits =
        product.unitsPerCase *
        annualLineItemCaseCount({
          casesPurchased,
          frequency
        });

      const emissions = item.product
        ? getLineItemGasEmissions({
            lineItem: item,
            frequency: 'Annually'
          }).total
        : null;

      return {
        annualCost: column.annualCost + annualCost,
        annualGHG: emissions ? column.annualGHG + emissions.forecast : column.annualGHG,
        annualUnits: column.annualUnits + annualUnits,
        productCount: annualUnits > 0 ? column.productCount + 1 : column.productCount
      };
    },
    { annualCost: 0, annualGHG: 0, annualUnits: 0, productCount: 0 }
  );

  return {
    annualCost: getChangeSummaryRow(baseline.annualCost, forecast.annualCost),
    annualGHG: getChangeSummaryRow(baseline.annualGHG, forecast.annualGHG),
    annualUnits: getChangeSummaryRow(baseline.annualUnits, forecast.annualUnits),
    productCount: getChangeSummaryRow(baseline.productCount, forecast.productCount)
  };
}
