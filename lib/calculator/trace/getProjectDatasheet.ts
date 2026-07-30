/**
 * Project Datasheet — the project laid out the way a model is built in a spreadsheet:
 * one row per line item, columns walking left-to-right from what the user typed, through
 * the catalog values and factors that were looked up, to each intermediate and the outputs.
 *
 * IMPORTANT: every computed column calls the SAME engine functions the app uses
 * (getLineItemGasEmissions, getLineItemWaterUsage, annualLineItemCost, annualLineItemWeight),
 * invoked exactly the way the aggregate calculators invoke them — including the engine's own
 * rule that a reusable item contributes nothing to the BASELINE (its purchase is a forecast
 * cost), and its exclusion of bottle/water-station items from water. Nothing here re-implements
 * the math, so this view cannot drift from the dashboard. `reconciliation` proves it.
 */
import { getLineItemGasEmissions } from '../calculations/ghg/getAnnualGasEmissionChanges';
import { getLineItemWaterUsage } from '../calculations/water/getAnnualWaterUsageChanges';
import { annualLineItemCost, annualLineItemWeight } from '../calculations/foodware/lineItemUtils';
import { getProjectionsFromInventory } from '../getProjections';
import { MATERIAL_MAP, CORRUGATED_CARDBOARD_GAS } from '../constants/materials';
import { TRANSPORTATION_CO2_EMISSIONS_FACTOR } from '../constants/carbon-dioxide-emissions';
import { getAnnualOccurrence } from '../constants/frequency';
import type { ProjectInventory } from 'lib/inventory/types/projects';

export type DatasheetRow = {
  kind: 'Single-use' | 'Reusable';
  productId: string;
  description: string;
  note: string;

  // what the user typed
  unitsPerCase: number;
  casesPurchased: number;
  caseCost: number;
  frequency: string;
  annualOccurrence: number;
  forecastCases: number;
  annualItems: number;
  forecastItems: number;

  // what the catalog supplied
  primaryMaterial: string;
  primaryLbPerItem: number;
  secondaryMaterial: string;
  secondaryLbPerItem: number;
  itemWeightLb: number;
  boxLbPerCase: number;
  boxLbPerItem: number;

  // which factors were applied
  primaryGhgFactor: number;
  secondaryGhgFactor: number;
  cardboardGhgFactor: number;
  freightGhgFactor: number;
  primaryWaterFactor: number;
  secondaryWaterFactor: number;
  cardboardWaterFactor: number;

  // intermediates
  primaryMassLb: number;
  secondaryMassLb: number;
  productMassLb: number;
  boxMassLb: number;
  boxMassLbPerItemMethod: number; // alternative under review (DATA-REVIEW-AGENDA 3b)
  massBaselineLb: number;
  massForecastLb: number;

  // engine outputs for this row
  annualCost: number;
  ghgBaseline: number;
  ghgForecast: number;
  ghgPrimaryBaseline: number;
  ghgSecondaryBaseline: number;
  ghgShippingBoxBaseline: number;
  waterBaseline: number;
  waterForecast: number;
  waterPrimaryBaseline: number;
  waterSecondaryBaseline: number;
  waterShippingBoxBaseline: number;

  /** Per-column working: the expression with real numbers substituted, and which columns it reads. */
  formulas: Record<string, CellFormula>;
};

export type CellFormula = {
  /** e.g. "6,430 x 0.000915 + 6,430 x 0.00040467" */
  expression: string;
  /** column keys this cell reads, for highlighting */
  refs: string[];
  note?: string;
};

export type DatasheetReconciliation = { label: string; rowSum: number; engineTotal: number; matches: boolean };

export type ProjectDatasheet = {
  rows: DatasheetRow[];
  notes: string[];
  reconciliation: DatasheetReconciliation[];
};

const near = (a: number, b: number) => Math.abs(a - b) <= Math.max(0.02, Math.abs(b) * 0.001);
const isWaterStation = (item: any) => !!item.baselineWaterUsageGallons || !!item.forecastWaterUsageGallons;

function buildRow(kind: DatasheetRow['kind'], lineItem: any, inventory: ProjectInventory): DatasheetRow | null {
  const product = lineItem.product;
  if (!product) return null;

  const isReusable = kind === 'Reusable';
  const frequency = isReusable ? 'Annually' : lineItem.frequency || 'Annually';
  const annualOccurrence = getAnnualOccurrence(frequency as any);
  const annualItems = lineItem.casesPurchased * lineItem.unitsPerCase * annualOccurrence;
  const forecastItems = (lineItem.newCasesPurchased ?? 0) * lineItem.unitsPerCase * annualOccurrence;

  const primMat = MATERIAL_MAP[product.primaryMaterial];
  const secMat = product.secondaryMaterial != null ? MATERIAL_MAP[product.secondaryMaterial] : undefined;

  // Mirror the aggregate calculators: reusables contribute 0 to the baseline.
  const engineLineItem = isReusable ? { ...lineItem, casesPurchased: 0 } : lineItem;
  const gas = getLineItemGasEmissions({
    frequency: frequency as any,
    lineItem: engineLineItem,
    isEventProject: inventory.isEventProject
  });
  const water = getLineItemWaterUsage({
    frequency: frequency as any,
    lineItem: engineLineItem,
    isEventProject: inventory.isEventProject
  });

  const annualCost = annualLineItemCost({
    caseCost: lineItem.caseCost,
    casesPurchased: lineItem.casesPurchased,
    frequency: frequency as any
  });

  const cardboardWaterFactor = MATERIAL_MAP[1]?.waterUsageGalPerLb ?? 0;
  const primaryMassLb = annualLineItemWeight(
    isReusable ? 0 : lineItem.casesPurchased,
    annualOccurrence,
    lineItem.unitsPerCase,
    product.primaryMaterialWeightPerUnit
  );
  const secondaryMassLb = annualLineItemWeight(
    isReusable ? 0 : lineItem.casesPurchased,
    annualOccurrence,
    lineItem.unitsPerCase,
    product.secondaryMaterialWeightPerUnit || 0
  );

  // Waste uses the product's total item weight (not primary + secondary).
  const productMassLb = annualLineItemWeight(
    lineItem.casesPurchased,
    annualOccurrence,
    lineItem.unitsPerCase,
    product.itemWeight
  );
  const boxMassLb = product.boxWeight * lineItem.casesPurchased * annualOccurrence;
  const forecastProductMass = annualLineItemWeight(
    lineItem.newCasesPurchased ?? 0,
    annualOccurrence,
    lineItem.unitsPerCase,
    product.itemWeight
  );
  const forecastBoxMass = product.boxWeight * (lineItem.newCasesPurchased ?? 0) * annualOccurrence;

  const notes: string[] = [];
  if (isReusable) notes.push('reusable: excluded from baseline by the engine');
  if (isWaterStation(lineItem)) notes.push('water station: excluded from water totals');

  const num = (v: number, d = 6) => v.toLocaleString(undefined, { maximumFractionDigits: d });
  const zeroedNote = isReusable ? 'Reusables are excluded from the baseline, so cases count as 0 here.' : undefined;
  const casesTerm = isReusable ? '0 (reusable)' : num(lineItem.casesPurchased, 0);
  const occ = annualOccurrence;

  const formulas: Record<string, CellFormula> = {
    annualItems: {
      expression: `${num(lineItem.casesPurchased, 0)} cases x ${num(lineItem.unitsPerCase, 0)} units/case x ${occ} = ${num(annualItems, 0)}`,
      refs: ['casesPurchased', 'unitsPerCase', 'annualOccurrence']
    },
    forecastItems: {
      expression: `${num(lineItem.newCasesPurchased ?? 0, 0)} forecast cases x ${num(lineItem.unitsPerCase, 0)} x ${occ} = ${num(forecastItems, 0)}`,
      refs: ['forecastCases', 'unitsPerCase', 'annualOccurrence']
    },
    annualCost: {
      expression: `$${num(lineItem.caseCost, 2)} x ${num(lineItem.casesPurchased, 0)} cases x ${occ} = $${num(annualCost, 2)}`,
      refs: ['caseCost', 'casesPurchased', 'annualOccurrence']
    },
    primaryMassLb: {
      expression: `${num(product.primaryMaterialWeightPerUnit)} lb/item x ${casesTerm === '0 (reusable)' ? '0 items' : num(annualItems, 0) + ' items'} = ${num(primaryMassLb, 1)} lb`,
      refs: ['primaryLbPerItem', 'annualItems'],
      note: zeroedNote
    },
    secondaryMassLb: {
      expression: `${num(product.secondaryMaterialWeightPerUnit || 0)} lb/item x ${casesTerm === '0 (reusable)' ? '0 items' : num(annualItems, 0) + ' items'} = ${num(secondaryMassLb, 1)} lb`,
      refs: ['secondaryLbPerItem', 'annualItems'],
      note: zeroedNote
    },
    productMassLb: {
      expression: `${num(product.itemWeight)} lb/item x ${num(annualItems, 0)} items = ${num(productMassLb, 1)} lb`,
      refs: ['itemWeightLb', 'annualItems']
    },
    boxMassLb: {
      expression: `${num(product.boxWeight)} lb/case x ${num(lineItem.casesPurchased, 0)} cases x ${occ} = ${num(boxMassLb, 1)} lb`,
      refs: ['boxLbPerCase', 'casesPurchased', 'annualOccurrence'],
      note: 'Units-per-case is NOT part of this formula — see the per-item column beside it (agenda 3b).'
    },
    boxMassLbPerItemMethod: {
      expression: `${num(product.boxWeightPerItem ?? 0)} lb/item x ${num(annualItems, 0)} items = ${num((product.boxWeightPerItem ?? 0) * annualItems, 1)} lb`,
      refs: ['boxLbPerItem', 'annualItems'],
      note: 'The alternative method under review. Not currently used by the calculator.'
    },
    massBaselineLb: {
      expression: isReusable
        ? '0 — reusables contribute nothing to the baseline'
        : `${num(productMassLb, 1)} product + ${num(boxMassLb, 1)} box = ${num(productMassLb + boxMassLb, 1)} lb`,
      refs: isReusable ? [] : ['productMassLb', 'boxMassLb']
    },
    massForecastLb: {
      expression: `${num(product.itemWeight)} x ${num(forecastItems, 0)} items + ${num(product.boxWeight)} x ${num(lineItem.newCasesPurchased ?? 0, 0)} cases = ${num(forecastProductMass + forecastBoxMass, 1)} lb`,
      refs: ['itemWeightLb', 'forecastItems', 'boxLbPerCase', 'forecastCases']
    },
    ghgPrimaryBaseline: {
      expression: `${num(primaryMassLb, 1)} lb x (${num(primMat?.mtco2ePerLb ?? 0)} material + ${num(TRANSPORTATION_CO2_EMISSIONS_FACTOR, 8)} freight) = ${num(gas.primaryGas.baseline, 4)}`,
      refs: ['primaryMassLb', 'primaryGhgFactor', 'freightGhgFactor'],
      note: zeroedNote
    },
    ghgSecondaryBaseline: {
      expression: `${num(secondaryMassLb, 1)} lb x (${num(secMat?.mtco2ePerLb ?? 0)} material + ${num(TRANSPORTATION_CO2_EMISSIONS_FACTOR, 8)} freight) = ${num(gas.secondaryGas.baseline, 4)}`,
      refs: ['secondaryMassLb', 'secondaryGhgFactor', 'freightGhgFactor'],
      note: zeroedNote
    },
    ghgShippingBoxBaseline: {
      expression: `${num(boxMassLb, 1)} lb x (${num(CORRUGATED_CARDBOARD_GAS)} cardboard + ${num(TRANSPORTATION_CO2_EMISSIONS_FACTOR, 8)} freight) = ${num(gas.shippingBoxGas.baseline, 4)}`,
      refs: ['boxMassLb', 'cardboardGhgFactor', 'freightGhgFactor'],
      note: 'Ocean freight is applied here AND to product mass — under review (agenda 3c).'
    },
    ghgBaseline: {
      expression: `${num(gas.primaryGas.baseline, 4)} primary + ${num(gas.secondaryGas.baseline, 4)} secondary + ${num(gas.shippingBoxGas.baseline, 4)} box = ${num(gas.total.baseline, 4)}`,
      refs: ['ghgPrimaryBaseline', 'ghgSecondaryBaseline', 'ghgShippingBoxBaseline']
    },
    waterPrimaryBaseline: {
      expression: `${num(primaryMassLb, 1)} lb x ${num(primMat?.waterUsageGalPerLb ?? 0, 4)} gal/lb = ${num(water.primaryWater.baseline, 0)} gal`,
      refs: ['primaryMassLb', 'primaryWaterFactor'],
      note: zeroedNote
    },
    waterSecondaryBaseline: {
      expression: `${num(secondaryMassLb, 1)} lb x ${num(secMat?.waterUsageGalPerLb ?? 0, 4)} gal/lb = ${num(water.secondaryWater.baseline, 0)} gal`,
      refs: ['secondaryMassLb', 'secondaryWaterFactor'],
      note: zeroedNote
    },
    waterShippingBoxBaseline: {
      expression: `${num(boxMassLb, 1)} lb x ${num(cardboardWaterFactor, 4)} gal/lb = ${num(water.shippingBoxWater.baseline, 0)} gal`,
      refs: ['boxMassLb', 'cardboardWaterFactor']
    },
    waterBaseline: {
      expression: `${num(water.primaryWater.baseline, 0)} primary + ${num(water.secondaryWater.baseline, 0)} secondary + ${num(water.shippingBoxWater.baseline, 0)} box = ${num(water.total.baseline, 0)} gal`,
      refs: ['waterPrimaryBaseline', 'waterSecondaryBaseline', 'waterShippingBoxBaseline']
    }
  };

  return {
    kind,
    productId: String(product.id),
    description: (product.description || '').trim(),
    note: notes.join('; '),
    formulas,
    unitsPerCase: lineItem.unitsPerCase,
    casesPurchased: lineItem.casesPurchased,
    caseCost: lineItem.caseCost,
    frequency,
    annualOccurrence,
    forecastCases: lineItem.newCasesPurchased ?? 0,
    annualItems,
    forecastItems,
    primaryMaterial: primMat?.name ?? `(id ${product.primaryMaterial})`,
    primaryLbPerItem: product.primaryMaterialWeightPerUnit,
    secondaryMaterial: secMat?.name ?? '',
    secondaryLbPerItem: product.secondaryMaterialWeightPerUnit || 0,
    itemWeightLb: product.itemWeight,
    boxLbPerCase: product.boxWeight,
    boxLbPerItem: product.boxWeightPerItem ?? 0,
    primaryGhgFactor: primMat?.mtco2ePerLb ?? 0,
    secondaryGhgFactor: secMat?.mtco2ePerLb ?? 0,
    cardboardGhgFactor: CORRUGATED_CARDBOARD_GAS,
    freightGhgFactor: TRANSPORTATION_CO2_EMISSIONS_FACTOR,
    primaryWaterFactor: primMat?.waterUsageGalPerLb ?? 0,
    secondaryWaterFactor: secMat?.waterUsageGalPerLb ?? 0,
    cardboardWaterFactor,
    primaryMassLb,
    secondaryMassLb,
    productMassLb,
    boxMassLb,
    boxMassLbPerItemMethod: (product.boxWeightPerItem ?? 0) * annualItems,
    massBaselineLb: isReusable ? 0 : productMassLb + boxMassLb,
    massForecastLb: forecastProductMass + forecastBoxMass,
    annualCost,
    ghgBaseline: gas.total.baseline,
    ghgForecast: gas.total.forecast,
    ghgPrimaryBaseline: gas.primaryGas.baseline,
    ghgSecondaryBaseline: gas.secondaryGas.baseline,
    ghgShippingBoxBaseline: gas.shippingBoxGas.baseline,
    waterBaseline: water.total.baseline,
    waterForecast: water.total.forecast,
    waterPrimaryBaseline: water.primaryWater.baseline,
    waterSecondaryBaseline: water.secondaryWater.baseline,
    waterShippingBoxBaseline: water.shippingBoxWater.baseline
  };
}

export function getProjectDatasheet(inventory: ProjectInventory): ProjectDatasheet {
  const rows: DatasheetRow[] = [];
  for (const item of inventory.singleUseItems) {
    const row = buildRow('Single-use', item, inventory);
    if (row) rows.push(row);
  }
  for (const item of inventory.reusableItems) {
    const row = buildRow('Reusable', item, inventory);
    if (row) rows.push(row);
  }

  const notes = [
    'Every computed column calls the same engine functions that produce the dashboard, invoked the same way — this view cannot drift from the app.',
    'A reusable item contributes nothing to the BASELINE: the engine treats its purchase as a forecast cost, so its baseline GHG, water and mass are zero by design. Its forecast column is populated.',
    'Bottle/water-station items are excluded from the water totals by the engine; such rows are flagged in the Note column.',
    'GHG includes ocean freight applied to BOTH product mass and shipping-box mass (0.00040467 MTCO2e/lb = 0.000000021 x 19,270 nautical miles). Under review — see docs/DATA-REVIEW-AGENDA.md section 3c.',
    'Shipping-box mass = catalog box weight PER CASE x your case count, which ignores units-per-case. The "box (per-item method)" column shows the alternative under review — see section 3b.',
    "Mass uses the product's total item weight, not primary + secondary material weights (those two disagree slightly in the catalog — see section 3f)."
  ];

  const projections = getProjectionsFromInventory(inventory);
  const env = projections.environmentalResults;
  const suRows = rows.filter(r => r.kind === 'Single-use');
  const waterRows = rows.filter(r => !r.note.includes('water station'));

  const reconciliation: DatasheetReconciliation[] = [
    {
      label: 'Single-use annual cost ($)',
      rowSum: suRows.reduce((s, r) => s + r.annualCost, 0),
      engineTotal: projections.singleUseResults.summary.annualCost.baseline
    },
    {
      label: 'Single-use annual units',
      rowSum: suRows.reduce((s, r) => s + r.annualItems, 0),
      engineTotal: projections.singleUseResults.summary.annualUnits.baseline
    },
    {
      label: 'Baseline waste mass — product + box (lb)',
      rowSum: rows.reduce((s, r) => s + r.massBaselineLb, 0),
      engineTotal: env.annualWasteChanges.summary.baseline
    },
    {
      label: 'Baseline GHG — line items + boxes (MTCO2e)',
      rowSum: rows.reduce((s, r) => s + r.ghgBaseline, 0),
      engineTotal:
        env.annualGasEmissionChanges.landfillWaste.baseline + env.annualGasEmissionChanges.shippingBox.baseline
    },
    {
      label: 'Baseline water — line items (gal)',
      rowSum: waterRows.reduce((s, r) => s + r.waterBaseline, 0),
      engineTotal: env.annualWaterUsageChanges.landfillWaste.baseline
    }
  ].map(r => ({ ...r, matches: near(r.rowSum, r.engineTotal) }));

  return { rows, notes, reconciliation };
}
