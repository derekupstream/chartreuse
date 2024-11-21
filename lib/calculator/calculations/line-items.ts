import type { SingleUseProduct } from '../../inventory/types/products';
import type { SingleUseLineItemPopulated } from '../../inventory/types/projects';
import type { Frequency } from '../constants/frequency';
import { getAnnualOccurrence } from '../constants/frequency';
import { CORRUGATED_CARDBOARD_NAME } from '../constants/materials';
import type { ChangeSummary } from '../utils';
import { getChangeSummaryRow, getChangeSummaryRowRounded } from '../utils';

import { getLineItemGasEmissions } from './environmental-results-gas';
import { getLineItemWaterUsage } from './environmental-results-water';

export type PurchasingSummaryColumn = {
  annualCost: number;
  annualGHG: number;
  annualWater: number;
  annualUnits: number;
  productCount: number;
};

export type ProductForecastResults = {
  summary: {
    annualCost: ChangeSummary;
    annualUnits: ChangeSummary;
    annualGHG: ChangeSummary;
    annualWater?: ChangeSummary; // for single-use items
    reusableWater?: { lineItemForecast: number; dishwasherForecast: number; total: number }; // we dont use baseline/forecast for reusable items
    productCount: ChangeSummary;
  };
  resultsByType: {
    material: {
      rows: CombinedLineItemResultsWithTitle[];
      totals: CombinedLineItemResults;
    };
    productType: {
      rows: CombinedLineItemResultsWithTitle[];
      totals: CombinedLineItemResults;
    };
    productCategory: {
      rows: CombinedLineItemResultsWithTitle[];
      totals: CombinedLineItemResults;
    };
  };
};

// Detailed Results, Column M: =$J5*L5*INDEX(HIDDEN_Purchase_Frequency_Table,MATCH($I5,HIDDEN_Purchase_Frequency_Options,0),2)
export function annualLineItemCost(item: { caseCost: number; casesPurchased: number; frequency: Frequency }) {
  return item.caseCost * annualLineItemCaseCount(item);
}

// Detailed Results, Column N
export function annualLineItemCaseCount(item: { casesPurchased: number; frequency: Frequency }) {
  const frequencyVal = getAnnualOccurrence(item.frequency);
  return item.casesPurchased * frequencyVal;
}

export function annualLineItemWeight(
  casesPurchased: number,
  annualOccurrence: number,
  unitsPerCase: number,
  weightPerUnit: number
) {
  const annualUnits = casesPurchased * unitsPerCase * annualOccurrence;
  return annualUnits * weightPerUnit;
}

// See Sheet 5: Detailed Results
type ProductDetailedResult = {
  annualCost: number;
  annualBoxWeight: number;
  annualWeight: number;
  category: SingleUseProduct['category'];
  gasEmissions: ChangeSummary;
  type: SingleUseProduct['type'];
  forecastAnnualCost: number;
  forecastAnnualWeight: number;
  forecastAnnualBoxWeight: number;
  primaryMaterial: SingleUseProduct['primaryMaterial'];
  primaryGas: ChangeSummary;
  secondaryGas: ChangeSummary;
  shippingBoxGas: ChangeSummary;
  waterUsage: ChangeSummary;
  shippingBoxWater: ChangeSummary;
};

// see HIDDEN: Output Calculations
export type CombinedLineItemResults = {
  cost: ChangeSummary;
  gasEmissions: ChangeSummary;
  weight: ChangeSummary;
  waterUsage: ChangeSummary;
};

type CombinedLineItemResultsWithTitle = CombinedLineItemResults & {
  title: string;
};

type LineItemInput = Pick<
  SingleUseLineItemPopulated,
  'casesPurchased' | 'caseCost' | 'newCasesPurchased' | 'unitsPerCase' | 'product'
> &
  Partial<Pick<SingleUseLineItemPopulated, 'frequency'>>;

export function getResultsByType({
  categories,
  productTypes,
  materials,
  lineItems
}: {
  categories: Readonly<{ id: string; name: string }[]>;
  productTypes: Readonly<{ id: number; name: string }[]>;
  materials: Readonly<{ id: number; name: string }[]>;
  lineItems: LineItemInput[];
}): ProductForecastResults['resultsByType'] {
  const detailedResults = getDetailedLineItemResults(lineItems);

  const itemsByCategory = categories.map(category => {
    const items = detailedResults.filter(item => item.category === category.id);
    return { title: category.name, items };
  });

  const itemsByType = productTypes.map(type => {
    const items = detailedResults.filter(item => item.type === type.id);
    return { title: type.name, items };
  });

  const materialRows = materials.map(material => {
    const items = detailedResults.filter(item => {
      // all products require some cardboard
      if (material.name === CORRUGATED_CARDBOARD_NAME) {
        return true;
      } else {
        return item.primaryMaterial === material.id;
      }
    });
    return { title: material.name, items };
  });

  return {
    productCategory: combineResultsByCategory(itemsByCategory),
    material: combineResultsByCategory(materialRows),
    productType: combineResultsByCategory(itemsByType)
  };
}

function getDetailedLineItemResults(singleUseItems: LineItemInput[]): ProductDetailedResult[] {
  return singleUseItems.map(lineItem => {
    const annualCost = annualLineItemCost({
      caseCost: lineItem.caseCost,
      casesPurchased: lineItem.casesPurchased,
      frequency: lineItem.frequency || 'Annually'
    });
    const forecastAnnualCost = annualLineItemCost({
      caseCost: lineItem.caseCost,
      casesPurchased: lineItem.newCasesPurchased,
      frequency: lineItem.frequency || 'Annually'
    });
    const annualOccurrence = getAnnualOccurrence(lineItem.frequency || 'Annually');
    const product = lineItem.product;
    const annualWeight = annualLineItemWeight(
      lineItem.casesPurchased,
      annualOccurrence,
      lineItem.unitsPerCase,
      product.primaryMaterialWeightPerUnit
    );
    const forecastAnnualWeight = annualLineItemWeight(
      lineItem.newCasesPurchased,
      annualOccurrence,
      lineItem.unitsPerCase,
      product.primaryMaterialWeightPerUnit
    );

    const {
      primaryGas,
      secondaryGas,
      shippingBoxGas,
      total: gasEmissions
    } = getLineItemGasEmissions({
      frequency: lineItem.frequency || 'Annually',
      lineItem
    });

    const { total: waterUsage, shippingBoxWater } = getLineItemWaterUsage({
      frequency: lineItem.frequency || 'Annually',
      lineItem
    });

    const annualBoxWeight = lineItem.casesPurchased * lineItem.product.boxWeight * annualOccurrence;
    const forecastAnnualBoxWeight = lineItem.newCasesPurchased * lineItem.product.boxWeight * annualOccurrence;

    const detailedResult: ProductDetailedResult = {
      annualBoxWeight,
      annualCost,
      annualWeight,
      category: product.category,
      forecastAnnualCost,
      forecastAnnualWeight,
      forecastAnnualBoxWeight,
      gasEmissions,
      waterUsage,
      primaryMaterial: product.primaryMaterial,
      primaryGas,
      secondaryGas: secondaryGas,
      shippingBoxGas: shippingBoxGas,
      shippingBoxWater,
      type: product.type
    };
    return detailedResult;
  });
}

const emptyCombinedResults: CombinedLineItemResults = {
  cost: {
    baseline: 0,
    forecast: 0,
    change: 0,
    changePercent: 0
  },
  gasEmissions: {
    baseline: 0,
    forecast: 0,
    change: 0,
    changePercent: 0
  },
  weight: {
    baseline: 0,
    forecast: 0,
    change: 0,
    changePercent: 0
  },
  waterUsage: {
    baseline: 0,
    forecast: 0,
    change: 0,
    changePercent: 0
  }
};

// combine the results of a group of line items
function combineLineItemResults(title: string, items: ProductDetailedResult[]): CombinedLineItemResultsWithTitle {
  return items.reduce(
    (result, item) => {
      const baselineCost = result.cost.baseline + item.annualCost;
      const forecastCost = result.cost.forecast + item.forecastAnnualCost;
      let cost = getChangeSummaryRow(baselineCost, forecastCost);
      let annualWeight = item.annualWeight;
      let forecastAnnualWeight = item.forecastAnnualWeight;
      let itemGasEmissions = item.primaryGas;
      let itemWaterUsage = item.waterUsage;
      // calculate box weight for cardboard
      if (title === CORRUGATED_CARDBOARD_NAME) {
        annualWeight = item.annualBoxWeight;
        forecastAnnualWeight = item.forecastAnnualBoxWeight;
        cost = result.cost; // no cost for cardboard
        itemGasEmissions = item.shippingBoxGas;
        itemWaterUsage = item.shippingBoxWater;
      }

      const baselineWeight = result.weight.baseline + annualWeight;
      const forecastWeight = result.weight.forecast + forecastAnnualWeight;
      const weight = getChangeSummaryRow(baselineWeight, forecastWeight);

      const baselineGas = result.gasEmissions.baseline + itemGasEmissions.baseline;
      const forecastGas = result.gasEmissions.forecast + itemGasEmissions.forecast;
      const gasEmissions = getChangeSummaryRowRounded(baselineGas, forecastGas, 2);

      const baselineWater = result.waterUsage.baseline + itemWaterUsage.baseline;
      const forecastWater = result.waterUsage.forecast + itemWaterUsage.forecast;
      const waterUsage = getChangeSummaryRowRounded(baselineWater, forecastWater, 2);

      return {
        title,
        cost,
        gasEmissions,
        weight,
        waterUsage
      };
    },
    {
      title,
      ...emptyCombinedResults
    }
  );
}

function combineResultsByCategory(items: { title: string; items: ProductDetailedResult[] }[]): {
  totals: CombinedLineItemResults;
  rows: CombinedLineItemResultsWithTitle[];
} {
  const rows = items.map(item => combineLineItemResults(item.title, item.items));

  const totals = rows.reduce((totals, row) => {
    const baselineCost = totals.cost.baseline + row.cost.baseline;
    const forecastCost = totals.cost.forecast + row.cost.forecast;
    const cost = getChangeSummaryRowRounded(baselineCost, forecastCost);
    const baselineWeight = totals.weight.baseline + row.weight.baseline;
    const forecastWeight = totals.weight.forecast + row.weight.forecast;
    const weight = getChangeSummaryRowRounded(baselineWeight, forecastWeight);
    const baselineGas = totals.gasEmissions.baseline + row.gasEmissions.baseline;
    const forecastGas = totals.gasEmissions.forecast + row.gasEmissions.forecast;
    const gasEmissions = getChangeSummaryRowRounded(baselineGas, forecastGas, 2);
    const baselineWater = totals.waterUsage.baseline + row.waterUsage.baseline;
    const forecastWater = totals.waterUsage.forecast + row.waterUsage.forecast;
    const waterUsage = getChangeSummaryRowRounded(baselineWater, forecastWater, 2);

    return {
      cost,
      gasEmissions,
      waterUsage,
      weight
    };
  }, emptyCombinedResults);

  const nonEmptyRows = rows.filter(
    row =>
      row.cost.baseline !== 0 ||
      row.cost.forecast !== 0 ||
      row.weight.baseline !== 0 ||
      row.weight.forecast !== 0 ||
      row.gasEmissions.baseline !== 0 ||
      row.gasEmissions.forecast !== 0 ||
      row.waterUsage.baseline !== 0 ||
      row.waterUsage.forecast !== 0
  );

  return {
    rows: nonEmptyRows,
    totals
  };
}
