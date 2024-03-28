import type { ReusableProduct, SingleUseProduct } from '../../inventory/types/products';
import type {
  DishWasherStatic,
  DishWasherOptions,
  ProjectInventory,
  SingleUseLineItemPopulated,
  ReusableLineItemPopulatedWithProduct
} from '../../inventory/types/projects';
import { NATURAL_GAS_CO2_EMISSIONS_FACTOR, ELECTRIC_CO2_EMISSIONS_FACTOR } from '../constants/carbon-dioxide-emissions';
import { POUND_TO_TONNE } from '../constants/conversions';
import type { Frequency } from '../constants/frequency';
import { getannualOccurrence } from '../constants/frequency';
import { CORRUGATED_CARDBOARD, ALL_MATERIALS } from '../constants/materials';
import type { ChangeSummary } from '../utils';
import { getChangeSummaryRow, getChangeSummaryRowRounded } from '../utils';

import { dishwasherUtilityUsage } from './financial-results';
import { annualLineItemWeight } from './line-items';

interface EnvironmentalResults {
  annualGasEmissionChanges: AnnualGasEmissionChanges;
  annualWasteChanges: AnnualWasteResults;
}

export function getEnvironmentalResults(project: ProjectInventory): EnvironmentalResults {
  const annualGasEmissionChanges = getAnnualGasEmissionChanges(project);
  const annualWasteChanges = getAnnualWasteChanges(project);

  return {
    annualGasEmissionChanges,
    annualWasteChanges
  };
}

// all values in MTCO2e
interface AnnualGasEmissionChanges {
  landfillWaste: ChangeSummary;
  dishwashing: ChangeSummary;
  total: ChangeSummary;
}

export function getUtilityGasEmissions(
  dishwasher: DishWasherStatic,
  options: DishWasherOptions
): { gas: number; electric: number } {
  const { electricUsage, gasUsage } = dishwasherUtilityUsage(dishwasher, options);
  const electric = electricUsage * ELECTRIC_CO2_EMISSIONS_FACTOR;
  const gas = gasUsage * NATURAL_GAS_CO2_EMISSIONS_FACTOR;
  return { gas, electric };
}

function getAnnualGasEmissionChanges(project: ProjectInventory): AnnualGasEmissionChanges {
  const lineItems = project.singleUseItems.map(lineItem =>
    getLineItemGasEmissions({ lineItem, frequency: lineItem.frequency })
  );
  const reusableLineItems = project.reusableItems
    .filter(item => !!item.product)
    .map(lineItem =>
      getLineItemGasEmissions({
        lineItem: {
          ...(lineItem as ReusableLineItemPopulatedWithProduct),
          // Do not include "one-time" emissions for reusables (aka baseline)
          casesPurchased: 0
        },
        frequency: 'Annually'
      })
    );
  const lineItemEmissions = [...lineItems, ...reusableLineItems].reduce((sum, item) => {
    return getChangeSummaryRow(sum.baseline + item.total.baseline, sum.forecast + item.total.forecast);
  }, getChangeSummaryRow(0, 0));

  const dishwashing = getDishwasherGasEmissions(project.dishwashers);

  return {
    landfillWaste: getChangeSummaryRowRounded(lineItemEmissions.baseline, lineItemEmissions.forecast, 2),
    dishwashing,
    total: getChangeSummaryRowRounded(
      lineItemEmissions.baseline + dishwashing.baseline,
      lineItemEmissions.forecast + dishwashing.forecast,
      2
    )
  };
}

// calculate increased dishwasher emissions
export function getDishwasherGasEmissions(dishwashers: ProjectInventory['dishwashers']): ChangeSummary {
  let ghgBaseline = 0;
  let ghgforecast = 0;
  for (const dishwasher of dishwashers) {
    const baseline = getUtilityGasEmissions(dishwasher, {
      operatingDays: dishwasher.operatingDays,
      racksPerDay: dishwasher.racksPerDay
    });
    ghgBaseline += POUND_TO_TONNE * (baseline.electric + baseline.gas);
    const forecast = getUtilityGasEmissions(dishwasher, {
      operatingDays: dishwasher.newOperatingDays,
      racksPerDay: dishwasher.newRacksPerDay
    });
    ghgforecast += POUND_TO_TONNE * (forecast.electric + forecast.gas);
  }
  return getChangeSummaryRowRounded(ghgBaseline, ghgforecast, 2);
}

/**
 *
 * Calculate gas emissions from a single use item.
 * This includes the primary and secondary, and packaging materials.
 *
 * Reference: Sheet 5:Detailed Results
 *
 * */
export function getLineItemGasEmissions({
  frequency,
  lineItem
}: {
  frequency: Frequency;
  lineItem: Pick<SingleUseLineItemPopulated, 'casesPurchased' | 'newCasesPurchased' | 'unitsPerCase' | 'product'>;
}) {
  const { casesPurchased, newCasesPurchased, unitsPerCase, product } = lineItem;

  const annualOccurrence = getannualOccurrence(frequency);

  // Column: AS
  const primaryGas = calculateMaterialGas(
    casesPurchased,
    newCasesPurchased,
    annualOccurrence,
    unitsPerCase,
    product.primaryMaterial,
    product.primaryMaterialWeightPerUnit
  );

  // Column: AU: calculate secondary material emissions
  const secondaryGas = calculateMaterialGas(
    casesPurchased,
    newCasesPurchased,
    annualOccurrence,
    unitsPerCase,
    product.secondaryMaterial,
    product.secondaryMaterialWeightPerUnit
  );

  // Columns: X, Y
  const boxWeight = product.boxWeight;
  const annualBoxWeight = boxWeight * casesPurchased * annualOccurrence;
  // Columns: AM, AN
  const forecastBoxWeight = product.boxWeight;
  const forecastAnnualBoxWeight = forecastBoxWeight * newCasesPurchased * annualOccurrence;

  // Column AW: shipping box emissions
  const shippingBoxGas = getChangeSummaryRow(
    annualBoxWeight * CORRUGATED_CARDBOARD,
    forecastAnnualBoxWeight * CORRUGATED_CARDBOARD
  );

  // Column: AX
  const total = getChangeSummaryRow(
    primaryGas.baseline + secondaryGas.baseline + shippingBoxGas.baseline,
    primaryGas.forecast + secondaryGas.forecast + shippingBoxGas.forecast
  );

  return {
    primaryGas,
    secondaryGas,
    shippingBoxGas,
    total
  };
}

/**
  Given a product and change in cases, determine how much gas emissions are reduced

  Example calculations:

  // Column: N, V
  const annualUnits = casesPurchased * product.unitsPerCase * annualOccurrence;
  const annualSecondaryWeight = secondaryMaterialWeightPerUnit * annualUnits;
  // Column: AC, AK
  const forecastAnnualUnits = newCasesPurchased * product.unitsPerCase * annualOccurrence;
  const forecastAnnualSecondaryWeight = secondaryMaterialWeightPerUnit * forecastAnnualUnits;
  // Column: AT
  const changeInSecondaryWeight = forecastAnnualSecondaryWeight - annualSecondaryWeight;
  if (epaWARMAssumption && changeInSecondaryWeight > 0) {
    secondaryGHGReduction = -1 * changeInSecondaryWeight * epaWARMAssumption.mtco2ePerLb;
  }
*/
function calculateMaterialGas(
  casesPurchased: number,
  newCasesPurchased: number,
  annualOccurrence: number,
  unitsPerCase: number,
  material: number,
  weightPerUnit: number
): ChangeSummary {
  const epaWARMAssumption = ALL_MATERIALS.find(m => m.id === material);
  if (!epaWARMAssumption) {
    throw new Error('Could not find EPA Warm assumption for material: ' + material);
  }
  const annualWeight = annualLineItemWeight(casesPurchased, annualOccurrence, unitsPerCase, weightPerUnit);
  const forecastAnnualWeight = annualLineItemWeight(newCasesPurchased, annualOccurrence, unitsPerCase, weightPerUnit);
  // const changeInWeight = forecastAnnualWeight - annualWeight
  // let gasReduction = 0
  // if (changeInWeight !== 0) {
  //   gasReduction = -1 * changeInWeight * epaWARMAssumption.mtco2ePerLb
  // }
  return getChangeSummaryRow(
    annualWeight * epaWARMAssumption.mtco2ePerLb,
    forecastAnnualWeight * epaWARMAssumption.mtco2ePerLb
  );
}

// all values in pounds
interface AnnualWasteResults {
  disposableProductWeight: ChangeSummary;
  disposableShippingBoxWeight: ChangeSummary;
  total: ChangeSummary;
}

function getAnnualWasteChanges(project: ProjectInventory): AnnualWasteResults {
  const baselineItems = [
    ...project.singleUseItems.map(item => ({
      casesPurchased: item.casesPurchased,
      product: item.product,
      frequency: item.frequency
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
      frequency: item.frequency
    })),
    ...project.reusableItems
      .filter(item => !!item.product)
      .map(item => ({
        casesPurchased: item.newCasesPurchased,
        product: item.product as ReusableProduct,
        frequency: 'Annually' as const
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

interface AnnualWaste {
  productWeight: number;
  shippingBoxWeight: number;
}

function getAnnualWaste(
  lineItems: { casesPurchased: number; frequency: Frequency; product: SingleUseProduct }[]
): AnnualWaste {
  return lineItems.reduce<AnnualWaste>(
    (sums, lineItem) => {
      const annualOccurrence = getannualOccurrence(lineItem.frequency);
      const product = lineItem.product;
      const annualWeight = annualLineItemWeight(
        lineItem.casesPurchased,
        annualOccurrence,
        product.unitsPerCase,
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
