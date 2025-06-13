import { SingleUseProduct } from 'lib/inventory/types/products';
import type {
  ProjectInventory,
  SingleUseLineItemPopulated,
  ReusableLineItemPopulatedWithProduct
} from 'lib/inventory/types/projects';
import type { Frequency } from '../../constants/frequency';
import { getAnnualOccurrence } from '../../constants/frequency';
import { ALL_MATERIALS, MATERIAL_MAP, NO_MATERIAL_ID } from '../../constants/materials';
import { CORRUGATED_CARDBOARD_NAME } from '../../constants/materials';
import type { ChangeSummary } from '../../utils';
import { getChangeSummaryRow, getChangeSummaryRowRounded, round } from '../../utils';

import { dishwasherUtilityUsage } from '../dishwashing/getDishwasherUtilityUsage';
import { annualLineItemWeight } from '../foodware/lineItemUtils';

export type AnnualWaterResults = {
  landfillWaste: ChangeSummary;
  dishwashing: ChangeSummary;
  total: ChangeSummary;
};

export function getAnnualWaterUsageChanges(project: ProjectInventory): AnnualWaterResults {
  const lineItems = project.singleUseItems.map(lineItem =>
    getLineItemWaterUsage({ lineItem, frequency: lineItem.frequency, isEventProject: project.isEventProject })
  );
  // console.log(lineItems);
  const reusableLineItems = project.reusableItems
    .filter(item => !!item.product)
    .map(lineItem =>
      getLineItemWaterUsage({
        lineItem: {
          ...(lineItem as ReusableLineItemPopulatedWithProduct),
          // Do not include "one-time" emissions for reusables (aka baseline)
          casesPurchased: 0
        },
        frequency: 'Annually',
        isEventProject: project.isEventProject
      })
    );
  // console.log(reusableLineItems);
  const lineItemResults = [...lineItems, ...reusableLineItems].reduce(
    (sum, item) => {
      return getChangeSummaryRow(sum.baseline + item.total.baseline, sum.forecast + item.total.forecast);
    },
    getChangeSummaryRow(0, 0)
  );

  const dishwashing = getDishwasherWaterUsage(project.dishwashers, project.racksUsedForEventProjects);

  return {
    landfillWaste: getChangeSummaryRowRounded(lineItemResults.baseline, lineItemResults.forecast, 0),
    dishwashing,
    total: getChangeSummaryRowRounded(
      lineItemResults.baseline + dishwashing.baseline,
      lineItemResults.forecast + dishwashing.forecast,
      0
    )
  };
}

// export function getUtilityWaterEmissions(dishwasher: DishWasherStatic, options: DishWasherOptions): number {
//   const { waterUsage } = dishwasherUtilityUsage(dishwasher, options);
//   return waterUsage;
// }

// calculate increased dishwasher emissions
export function getDishwasherWaterUsage(
  dishwashers: ProjectInventory['dishwashers'],
  racksUsed: number
): ChangeSummary {
  let totalBaseline = 0;
  let totalForecast = 0;
  for (const dishwasher of dishwashers) {
    const { waterUsage: baseline } = dishwasherUtilityUsage(dishwasher, {
      operatingDays: dishwasher.operatingDays,
      racksPerDay: dishwasher.racksPerDay
    });
    totalBaseline += baseline;
    const { waterUsage: forecast } = dishwasherUtilityUsage(dishwasher, {
      operatingDays: dishwasher.newOperatingDays,
      racksPerDay: dishwasher.newRacksPerDay,
      calculatedRacksUsed: racksUsed
    });
    totalForecast += forecast;
  }
  return getChangeSummaryRowRounded(totalBaseline, totalForecast, 0);
}

/**
 *
 * Calculate gas emissions from a single use item.
 * This includes the primary and secondary, and packaging materials.
 *
 * Reference: Sheet 5:Detailed Results
 *
 * */
export function getLineItemWaterUsage({
  frequency,
  lineItem,
  isEventProject
}: {
  frequency: Frequency;
  lineItem: Pick<
    ReusableLineItemPopulatedWithProduct | SingleUseLineItemPopulated,
    'casesPurchased' | 'newCasesPurchased' | 'unitsPerCase' | 'product'
  >;
  isEventProject: boolean;
}) {
  const { casesPurchased, newCasesPurchased, unitsPerCase, product } = lineItem;

  const annualOccurrence = getAnnualOccurrence(frequency);

  // Column: AS
  const primaryWater = calculateMaterialWater(
    casesPurchased,
    newCasesPurchased,
    annualOccurrence,
    unitsPerCase,
    product.primaryMaterial,
    product.primaryMaterialWeightPerUnit
  );

  // Column: AU: calculate secondary material emissions
  const secondaryWater = product.secondaryMaterial
    ? calculateMaterialWater(
        casesPurchased,
        newCasesPurchased,
        annualOccurrence,
        unitsPerCase,
        product.secondaryMaterial,
        product.secondaryMaterialWeightPerUnit
      )
    : getChangeSummaryRow(0, 0);

  // impact from shipping box
  const baselineBoxWeight = isEventProject
    ? ((product as SingleUseProduct).boxWeightPerItem || 0) * casesPurchased * unitsPerCase
    : product.boxWeight * casesPurchased * annualOccurrence;

  const forecastBoxWeight = isEventProject ? 0 : product.boxWeight * newCasesPurchased * annualOccurrence;
  const shippingBoxWater = calculateCardboardWater(baselineBoxWeight, forecastBoxWeight);

  // Column: AX
  const total = getChangeSummaryRowRounded(
    primaryWater.baseline + secondaryWater.baseline + shippingBoxWater.baseline,
    primaryWater.forecast + secondaryWater.forecast + shippingBoxWater.forecast,
    0
  );

  return {
    primaryWater,
    secondaryWater,
    shippingBoxWater: {
      baseline: round(shippingBoxWater.baseline, 0),
      forecast: round(shippingBoxWater.forecast, 0),
      change: round(shippingBoxWater.change, 0),
      changePercent: round(shippingBoxWater.changePercent, 0)
    },
    total
  };
}

/**
  Given a product and change in cases, determine how much gas emissions are reduced

  Water usage = if :lookup (user selected material = material in water savings database),
    item mass (primary material)*water consumption factor in database
*/
function calculateMaterialWater(
  casesPurchased: number,
  newCasesPurchased: number,
  annualOccurrence: number,
  unitsPerCase: number,
  material: number,
  weightPerUnit: number
): ChangeSummary {
  if (material === NO_MATERIAL_ID) {
    return getChangeSummaryRow(0, 0);
  }
  const epaWARMAssumption = MATERIAL_MAP[material];
  const waterUsageGalPerLb = epaWARMAssumption?.waterUsageGalPerLb;
  if (!waterUsageGalPerLb) {
    throw new Error('Could not find EPA Warm assumption for material: ' + material);
  }
  const annualWeight = annualLineItemWeight(casesPurchased, annualOccurrence, unitsPerCase, weightPerUnit);
  const forecastAnnualWeight = annualLineItemWeight(newCasesPurchased, annualOccurrence, unitsPerCase, weightPerUnit);
  return getChangeSummaryRow(annualWeight * waterUsageGalPerLb, forecastAnnualWeight * waterUsageGalPerLb);
}

function calculateCardboardWater(baselineWeight: number, forecastWeight: number): ChangeSummary {
  const cardboardWaterUsagePerLb = ALL_MATERIALS.find(m => m.name === CORRUGATED_CARDBOARD_NAME)?.waterUsageGalPerLb;
  if (!cardboardWaterUsagePerLb) {
    throw new Error('Could not find EPA Warm assumption for cardboard');
  }
  return getChangeSummaryRow(baselineWeight * cardboardWaterUsagePerLb, forecastWeight * cardboardWaterUsagePerLb);
}
