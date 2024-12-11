import type {
  DishWasherStatic,
  DishWasherOptions,
  ProjectInventory,
  SingleUseLineItemPopulated,
  ReusableLineItemPopulatedWithProduct
} from '../../inventory/types/projects';
import {
  NATURAL_GAS_CO2_EMISSIONS_FACTOR,
  ELECTRIC_CO2_EMISSIONS_FACTOR,
  TRANSPORTATION_CO2_EMISSIONS_FACTOR
} from '../constants/carbon-dioxide-emissions';
import { POUND_TO_TONNE } from '../constants/conversions';
import type { Frequency } from '../constants/frequency';
import { getAnnualOccurrence } from '../constants/frequency';
import { CORRUGATED_CARDBOARD_GAS, MATERIAL_MAP } from '../constants/materials';
import type { ChangeSummary } from '../utils';
import { getChangeSummaryRow, getChangeSummaryRowRounded } from '../utils';

import { dishwasherUtilityUsage } from './getFinancialResults';
import { annualLineItemWeight } from './lineItemUtils';

// all values in MTCO2e
export type AnnualGasEmissionChanges = {
  landfillWaste: ChangeSummary;
  shippingBox: ChangeSummary;
  dishwashing: ChangeSummary;
  total: ChangeSummary;
};

// each product GHG= (material EF*product mass) + (overseas cargo EF *product mass* 19270 nautical miles )

export function getAnnualGasEmissionChanges(project: ProjectInventory): AnnualGasEmissionChanges {
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
  const landfillWaste = [...lineItems, ...reusableLineItems].reduce(
    (sum, item) => {
      return getChangeSummaryRow(
        sum.baseline + item.primaryGas.baseline + item.secondaryGas.baseline,
        sum.forecast + item.primaryGas.forecast + item.secondaryGas.forecast
      );
    },
    getChangeSummaryRow(0, 0)
  );
  const shippingBox = [...lineItems, ...reusableLineItems].reduce(
    (sum, item) => {
      return getChangeSummaryRow(
        sum.baseline + item.shippingBoxGas.baseline,
        sum.forecast + item.shippingBoxGas.forecast
      );
    },
    getChangeSummaryRow(0, 0)
  );

  const dishwashing = getDishwasherGasEmissions(project.dishwashers);

  return {
    landfillWaste: getChangeSummaryRowRounded(landfillWaste.baseline, landfillWaste.forecast, 2),
    dishwashing,
    shippingBox: getChangeSummaryRowRounded(shippingBox.baseline, shippingBox.forecast, 2),
    total: getChangeSummaryRowRounded(
      landfillWaste.baseline + shippingBox.baseline + dishwashing.baseline,
      landfillWaste.forecast + shippingBox.forecast + dishwashing.forecast,
      2
    )
  };
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

  const annualOccurrence = getAnnualOccurrence(frequency);

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
  const annualBoxWeight = product.boxWeight * casesPurchased * annualOccurrence;
  // Columns: AM, AN
  const forecastAnnualBoxWeight = product.boxWeight * newCasesPurchased * annualOccurrence;

  // Column AW: shipping box emissions
  const shippingBoxGas = getChangeSummaryRow(
    annualBoxWeight * CORRUGATED_CARDBOARD_GAS + annualBoxWeight * TRANSPORTATION_CO2_EMISSIONS_FACTOR,
    forecastAnnualBoxWeight * CORRUGATED_CARDBOARD_GAS + forecastAnnualBoxWeight * TRANSPORTATION_CO2_EMISSIONS_FACTOR
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
  const epaWARMAssumption = MATERIAL_MAP[material];
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
    annualWeight * epaWARMAssumption.mtco2ePerLb + annualWeight * TRANSPORTATION_CO2_EMISSIONS_FACTOR,
    forecastAnnualWeight * epaWARMAssumption.mtco2ePerLb + forecastAnnualWeight * TRANSPORTATION_CO2_EMISSIONS_FACTOR
  );
}
