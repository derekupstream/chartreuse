import type { SingleUseProduct } from '../../inventory/types/products';
import type { ProjectInventory } from '../../inventory/types/projects';
import { singleUseItemGasEmissions } from '../calculations/environmental-results';
import type { Frequency } from '../constants/frequency';
import { getannualOccurrence } from '../constants/frequency';
import { MATERIALS } from '../constants/materials';
import { CORRUGATED_CARDBOARD_NAME } from '../constants/materials';
import { PRODUCT_CATEGORIES } from '../constants/product-categories';
import { PRODUCT_TYPES } from '../constants/product-types';
import type { ChangeSummary } from '../utils';
import { getChangeSummaryRow, getChangeSummaryRowRounded, round } from '../utils';

interface PurchasingSummaryColumn {
  annualCost: number;
  annualUnits: number;
  productCount: number;
}

interface SingleUseProductResults {
  summary: {
    annualCost: ChangeSummary;
    annualUnits: ChangeSummary;
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
}

export function getSingleUseProductForecast(inventory: ProjectInventory): SingleUseProductResults {
  const summary = getSingleUseProductSummary(inventory.singleUseItems);
  const resultsByType = getResultsByType(inventory.singleUseItems);

  return {
    summary,
    resultsByType
  };
}

// for each single use item, calculate difference in annual cost
export function getSingleUseProductSummary(singleUseItems: ProjectInventory['singleUseItems']): SingleUseProductResults['summary'] {
  const baseline = singleUseItems.reduce<PurchasingSummaryColumn>(
    (column, item) => {
      const { caseCost, casesPurchased, frequency, product } = item;
      const annualCost = annualSingleUseCost({
        caseCost,
        casesPurchased,
        frequency
      });
      const annualUnits =
        product.unitsPerCase *
        annualSingleUseCaseCount({
          casesPurchased,
          frequency
        });

      return {
        annualUnits: column.annualUnits + annualUnits,
        annualCost: column.annualCost + annualCost,
        productCount: annualUnits > 0 ? column.productCount + 1 : column.productCount
      };
    },
    { annualCost: 0, annualUnits: 0, productCount: 0 }
  );

  const forecast = singleUseItems.reduce<PurchasingSummaryColumn>(
    (column, item) => {
      const { newCaseCost: caseCost, newCasesPurchased: casesPurchased, frequency, product } = item;
      const annualCost = annualSingleUseCost({
        caseCost,
        casesPurchased,
        frequency
      });
      const annualUnits =
        product.unitsPerCase *
        annualSingleUseCaseCount({
          casesPurchased,
          frequency
        });

      return {
        annualUnits: column.annualUnits + annualUnits,
        annualCost: column.annualCost + annualCost,
        productCount: annualUnits > 0 ? column.productCount + 1 : column.productCount
      };
    },
    { annualCost: 0, annualUnits: 0, productCount: 0 }
  );

  return {
    annualCost: getChangeSummaryRow(baseline.annualCost, forecast.annualCost),
    annualUnits: getChangeSummaryRow(baseline.annualUnits, forecast.annualUnits),
    productCount: getChangeSummaryRow(baseline.productCount, forecast.productCount)
  };
}

// Detailed Results, Column M: =$J5*L5*INDEX(HIDDEN_Purchase_Frequency_Table,MATCH($I5,HIDDEN_Purchase_Frequency_Options,0),2)
function annualSingleUseCost(item: { caseCost: number; casesPurchased: number; frequency: Frequency }) {
  return item.caseCost * annualSingleUseCaseCount(item);
}

// Detailed Results, Column N
function annualSingleUseCaseCount(item: { casesPurchased: number; frequency: Frequency }) {
  const frequencyVal = getannualOccurrence(item.frequency);
  return item.casesPurchased * frequencyVal;
}

export function annualSingleUseWeight(casesPurchased: number, annualOccurrence: number, unitsPerCase: number, weightPerUnit: number) {
  const annualUnits = casesPurchased * unitsPerCase * annualOccurrence;
  return annualUnits * weightPerUnit;
}

// See Sheet 5: Detailed Results
interface SingleUseDetailedResult {
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
}

function getDetailedLineItemResults(singleUseItems: ProjectInventory['singleUseItems']): SingleUseDetailedResult[] {
  return singleUseItems.map(lineItem => {
    const annualCost = annualSingleUseCost({
      caseCost: lineItem.caseCost,
      casesPurchased: lineItem.casesPurchased,
      frequency: lineItem.frequency
    });
    const forecastAnnualCost = annualSingleUseCost({
      caseCost: lineItem.caseCost,
      casesPurchased: lineItem.newCasesPurchased,
      frequency: lineItem.frequency
    });
    const annualOccurrence = getannualOccurrence(lineItem.frequency);
    const product = lineItem.product;
    const annualWeight = annualSingleUseWeight(lineItem.casesPurchased, annualOccurrence, product.unitsPerCase, product.primaryMaterialWeightPerUnit);
    const forecastAnnualWeight = annualSingleUseWeight(lineItem.newCasesPurchased, annualOccurrence, product.unitsPerCase, product.primaryMaterialWeightPerUnit);

    const { primaryGas, secondaryGas, shippingBoxGas, total: gasEmissions } = singleUseItemGasEmissions(lineItem);

    const annualBoxWeight = lineItem.casesPurchased * lineItem.product.boxWeight * annualOccurrence;
    const forecastAnnualBoxWeight = lineItem.newCasesPurchased * lineItem.product.boxWeight * annualOccurrence;

    const detailedResult: SingleUseDetailedResult = {
      annualBoxWeight,
      annualCost,
      annualWeight,
      category: product.category,
      forecastAnnualCost,
      forecastAnnualWeight,
      forecastAnnualBoxWeight,
      gasEmissions,
      primaryMaterial: product.primaryMaterial,
      primaryGas,
      secondaryGas: secondaryGas,
      shippingBoxGas: shippingBoxGas,
      type: product.type
    };
    return detailedResult;
  });
}

// see HIDDEN: Output Calculations
interface CombinedLineItemResults {
  cost: ChangeSummary;
  gasEmissions: ChangeSummary;
  weight: ChangeSummary;
}

interface CombinedLineItemResultsWithTitle extends CombinedLineItemResults {
  title: string;
}

function getResultsByType(singleUseItems: ProjectInventory['singleUseItems']): SingleUseProductResults['resultsByType'] {
  const detailedResults = getDetailedLineItemResults(singleUseItems);

  const itemsByCategory = PRODUCT_CATEGORIES.map(category => {
    const items = detailedResults.filter(item => item.category === category.id);
    return { title: category.name, items };
  });

  const itemsByType = PRODUCT_TYPES.map(type => {
    const items = detailedResults.filter(item => item.type === type.id);
    return { title: type.name, items };
  });

  const materialRows = MATERIALS.map(material => {
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
  }
};

// combine the results of a group of line items
function combineLineItemResults(title: string, items: SingleUseDetailedResult[]): CombinedLineItemResultsWithTitle {
  return items.reduce(
    (result, item) => {
      const baselineCost = result.cost.baseline + item.annualCost;
      const forecastCost = result.cost.forecast + item.forecastAnnualCost;
      let cost = getChangeSummaryRow(baselineCost, forecastCost);
      let annualWeight = item.annualWeight;
      let forecastAnnualWeight = item.forecastAnnualWeight;
      let itemGasEmissions = item.primaryGas;
      // calculate box weight for cardboard
      if (title === CORRUGATED_CARDBOARD_NAME) {
        annualWeight = item.annualBoxWeight;
        forecastAnnualWeight = item.forecastAnnualBoxWeight;
        cost = result.cost; // no cost for cardboard
        itemGasEmissions = item.shippingBoxGas;
      }

      const baselineWeight = result.weight.baseline + annualWeight;
      const forecastWeight = result.weight.forecast + forecastAnnualWeight;
      const weight = getChangeSummaryRow(baselineWeight, forecastWeight);

      const baselineGas = result.gasEmissions.baseline + itemGasEmissions.baseline;
      const forecastGas = result.gasEmissions.forecast + itemGasEmissions.forecast;
      const gasEmissions = getChangeSummaryRowRounded(baselineGas, forecastGas, 2);

      return {
        title,
        cost,
        gasEmissions,
        weight
      };
    },
    {
      title,
      ...emptyCombinedResults
    }
  );
}

function combineResultsByCategory(items: { title: string; items: SingleUseDetailedResult[] }[]): { totals: CombinedLineItemResults; rows: CombinedLineItemResultsWithTitle[] } {
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

    return {
      cost,
      gasEmissions,
      weight
    };
  }, emptyCombinedResults);

  const nonEmptyRows = rows.filter(
    row => row.cost.baseline !== 0 || row.cost.forecast !== 0 || row.weight.baseline !== 0 || row.weight.forecast !== 0 || row.gasEmissions.baseline !== 0 || row.gasEmissions.forecast !== 0
  );

  return {
    rows: nonEmptyRows,
    totals
  };
}
