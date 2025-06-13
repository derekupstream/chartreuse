import type { ProjectInventory } from 'lib/inventory/types/projects';
import { MATERIALS } from '../../constants/materials';
import { PRODUCT_CATEGORIES } from '../../constants/product-categories';
import { PRODUCT_TYPES } from '../../constants/product-types';
import { getChangeSummaryRow } from '../../utils';

import { getLineItemGasEmissions } from '../ghg/getAnnualGasEmissionChanges';
import { getLineItemWaterUsage } from '../water/getAnnualWaterUsageChanges';
import type { PurchasingSummaryColumn, ProductForecastResults } from './lineItemUtils';
import { getResultsByType, annualLineItemCost, annualLineItemCaseCount } from './lineItemUtils';

export function getSingleUseResults(inventory: ProjectInventory): ProductForecastResults {
  const summary = getSingleUseProductSummary(inventory.singleUseItems, inventory.isEventProject);
  const resultsByType = getResultsByType({
    categories: PRODUCT_CATEGORIES,
    materials: MATERIALS,
    productTypes: PRODUCT_TYPES,
    lineItems: inventory.singleUseItems,
    isEventProject: inventory.isEventProject
  });

  return {
    summary,
    resultsByType
  };
}

// for each single use item, calculate difference in annual cost
export function getSingleUseProductSummary(
  singleUseItems: ProjectInventory['singleUseItems'],
  isEventProject: boolean
): ProductForecastResults['summary'] {
  const baseline = singleUseItems.reduce<PurchasingSummaryColumn>(
    (column, item) => {
      const { caseCost, casesPurchased, frequency, product, unitsPerCase } = item;

      const annualCost = annualLineItemCost({
        caseCost,
        casesPurchased,
        frequency
      });

      const annualUnits =
        unitsPerCase *
        annualLineItemCaseCount({
          casesPurchased,
          frequency
        });

      const emissions = getLineItemGasEmissions({
        lineItem: item,
        frequency: 'Annually',
        isEventProject
      }).total;

      const waterUsage = getLineItemWaterUsage({
        lineItem: item,
        frequency: 'Annually',
        isEventProject
      }).total;

      return {
        annualCost: column.annualCost + annualCost,
        annualGHG: column.annualGHG + emissions.baseline,
        annualWater: column.annualWater + waterUsage.baseline,
        annualUnits: column.annualUnits + annualUnits,
        productCount: annualUnits > 0 ? column.productCount + 1 : column.productCount
      };
    },
    { annualCost: 0, annualGHG: 0, annualWater: 0, annualUnits: 0, productCount: 0 }
  );

  const forecast = singleUseItems.reduce<PurchasingSummaryColumn>(
    (column, item) => {
      const { newCaseCost: caseCost, newCasesPurchased: casesPurchased, frequency, unitsPerCase } = item;
      const annualCost = annualLineItemCost({
        caseCost,
        casesPurchased,
        frequency
      });
      const annualUnits =
        unitsPerCase *
        annualLineItemCaseCount({
          casesPurchased,
          frequency
        });

      const emissions = getLineItemGasEmissions({
        lineItem: item,
        frequency: 'Annually',
        isEventProject
      }).total;

      const waterUsage = getLineItemWaterUsage({
        lineItem: item,
        frequency: 'Annually',
        isEventProject
      }).total;

      return {
        annualCost: column.annualCost + annualCost,
        annualGHG: column.annualGHG + emissions.forecast,
        annualWater: column.annualWater + waterUsage.forecast,
        annualUnits: column.annualUnits + annualUnits,
        productCount: annualUnits > 0 ? column.productCount + 1 : column.productCount
      };
    },
    { annualCost: 0, annualGHG: 0, annualWater: 0, annualUnits: 0, productCount: 0 }
  );

  return {
    annualCost: getChangeSummaryRow(baseline.annualCost, forecast.annualCost),
    annualGHG: getChangeSummaryRow(baseline.annualGHG, forecast.annualGHG),
    annualWater: getChangeSummaryRow(baseline.annualWater, forecast.annualWater),
    annualUnits: getChangeSummaryRow(baseline.annualUnits, forecast.annualUnits),
    productCount: getChangeSummaryRow(baseline.productCount, forecast.productCount)
  };
}
