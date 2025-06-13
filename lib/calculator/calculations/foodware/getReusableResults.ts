import type { ProjectInventory, ReusableLineItemPopulatedWithProduct } from 'lib/inventory/types/projects';
import { REUSABLE_MATERIALS } from '../../constants/materials';
import { PRODUCT_CATEGORIES } from '../../constants/product-categories';
import { PRODUCT_TYPES } from '../../constants/reusable-product-types';
import { getChangeSummaryRow } from '../../utils';

import { getDishwasherGasEmissions, getLineItemGasEmissions } from '../ghg/getAnnualGasEmissionChanges';
import { getDishwasherWaterUsage } from '../water/getAnnualWaterUsageChanges';
import { getLineItemWaterUsage } from '../water/getAnnualWaterUsageChanges';
import type { PurchasingSummaryColumn, ProductForecastResults } from './lineItemUtils';
import { getResultsByType, annualLineItemCost, annualLineItemCaseCount } from './lineItemUtils';

export function getReusableResults(inventory: ProjectInventory): ProductForecastResults {
  const summary = getReusableProductSummary(
    inventory.reusableItems,
    inventory.dishwashers,
    inventory.racksUsedForEventProjects,
    inventory.isEventProject
  );
  const resultsByType = getResultsByType({
    categories: PRODUCT_CATEGORIES,
    lineItems: inventory.reusableItems.filter(item => !!item.product) as ReusableLineItemPopulatedWithProduct[],
    materials: REUSABLE_MATERIALS,
    productTypes: PRODUCT_TYPES,
    isEventProject: inventory.isEventProject
  });

  return {
    summary,
    resultsByType
  };
}

// for each single use item, calculate difference in annual cost
export function getReusableProductSummary(
  reusableItems: ProjectInventory['reusableItems'],
  diswashers: ProjectInventory['dishwashers'],
  racksUsedForEventProjects: ProjectInventory['racksUsedForEventProjects'],
  isEventProject: boolean
): ProductForecastResults['summary'] {
  const baseline = reusableItems.reduce<PurchasingSummaryColumn>(
    (column, item) => {
      // TODO: remove this line when reusable products are mandatory
      if (!item.product) {
        return column;
      }
      const { caseCost, casesPurchased, unitsPerCase } = item;
      const annualCost = annualLineItemCost({
        caseCost,
        casesPurchased,
        frequency: 'Annually'
      });
      const annualUnits =
        unitsPerCase *
        annualLineItemCaseCount({
          casesPurchased,
          frequency: 'Annually'
        });

      const emissions = getLineItemGasEmissions({
        lineItem: item as ReusableLineItemPopulatedWithProduct,
        frequency: 'Annually',
        isEventProject: isEventProject
      }).total;

      const waterUsage = getLineItemWaterUsage({
        lineItem: item as ReusableLineItemPopulatedWithProduct,
        frequency: 'Annually',
        isEventProject: isEventProject
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

  const forecast = reusableItems.reduce<PurchasingSummaryColumn>(
    (column, item) => {
      // TODO: remove this line when reusable products are mandatory
      if (!item.product) {
        return column;
      }
      const { newCaseCost: caseCost, newCasesPurchased: casesPurchased, unitsPerCase } = item;

      const annualCost = annualLineItemCost({
        caseCost,
        casesPurchased,
        frequency: 'Annually'
      });

      const annualUnits =
        unitsPerCase *
        annualLineItemCaseCount({
          casesPurchased,
          frequency: 'Annually'
        });

      const emissions = getLineItemGasEmissions({
        lineItem: item as ReusableLineItemPopulatedWithProduct,
        frequency: 'Annually',
        isEventProject: isEventProject
      }).total;

      const waterUsage = getLineItemWaterUsage({
        lineItem: item as ReusableLineItemPopulatedWithProduct,
        frequency: 'Annually',
        isEventProject: isEventProject
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

  // include the forecasted dishwasher emissions for both one-time and recurring gas emissions
  const dishwasherEmissions = getDishwasherGasEmissions(diswashers, racksUsedForEventProjects);
  const dishwasherWaterUsage = getDishwasherWaterUsage(diswashers, racksUsedForEventProjects).forecast;

  return {
    annualCost: getChangeSummaryRow(baseline.annualCost, forecast.annualCost),
    annualGHG: getChangeSummaryRow(
      baseline.annualGHG + dishwasherEmissions.baseline,
      forecast.annualGHG + dishwasherEmissions.forecast
    ),
    // this is not a valid calculation - save baseline/forecast water usage for single-use items
    // annualWater: getChangeSummaryRow(
    //   baseline.annualWater + dishwasherWaterUsage,
    //   forecast.annualWater + dishwasherWaterUsage
    // ),
    reusableWater: {
      dishwasherForecast: dishwasherWaterUsage,
      lineItemForecast: forecast.annualWater,
      total: dishwasherWaterUsage + forecast.annualWater
    },
    annualUnits: getChangeSummaryRow(baseline.annualUnits, forecast.annualUnits),
    productCount: getChangeSummaryRow(baseline.productCount, forecast.productCount)
  };
}
