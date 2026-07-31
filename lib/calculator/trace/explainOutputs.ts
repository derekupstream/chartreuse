/**
 * Explains each headline output of a calculator: not just the number, but what produced it —
 * which user inputs, which factors, which database supplied those factors, and which line
 * items contributed how much.
 *
 * This is the "why" layer. `getProjectDatasheet` shows a project row by row; this shows the
 * dashboard's own numbers and lets each one be opened up.
 *
 * Values come from the real engine (`getProjectionsFromInventory`) — nothing is recomputed
 * here — so an explanation can never disagree with the dashboard it explains.
 */
import { getProjectionsFromInventory } from '../getProjections';
import { getProjectDatasheet } from './getProjectDatasheet';
import { MATERIAL_MAP } from '../constants/materials';
import { getMaterialFactorOverride } from '../factors/materialFactorOverrides';
import { CORRUGATED_CARDBOARD_GAS } from '../constants/materials';
import { TRANSPORTATION_CO2_EMISSIONS_FACTOR } from '../constants/carbon-dioxide-emissions';
import type { ProjectInventory } from 'lib/inventory/types/projects';

/** Where a number came from — the question the Factors and Databases areas exist to answer. */
export type FactorProvenance = {
  name: string;
  value: number;
  unit: string;
  /** 'database' when an uploaded table supplied it, 'code' when it came from the source */
  origin: 'database' | 'code';
  /** Which database, when origin is 'database' */
  database?: string;
};

export type Contributor = {
  label: string;
  detail: string;
  value: number;
  /** Share of the output this line accounts for, 0-1 */
  share: number;
};

export type OutputExplanation = {
  key: string;
  label: string;
  group: 'Financial' | 'Environmental' | 'Operational';
  value: number;
  unit: string;
  /** One-line statement of how the number is formed */
  formula: string;
  /** The user-entered values it depends on */
  inputsUsed: { label: string; value: string }[];
  factorsUsed: FactorProvenance[];
  contributors: Contributor[];
  /** Anything the reviewer should know about this number */
  caveats: string[];
};

export type CalculatorExplanation = {
  outputs: OutputExplanation[];
  /** Databases currently feeding the calculator */
  activeDatabases: string[];
};

const money = (n: number) => `$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const num = (n: number, d = 2) => n.toLocaleString(undefined, { maximumFractionDigits: d });

/** Reports where a material's factors came from, so a reviewer can trace an odd number. */
function materialProvenance(materialId: number, kind: 'ghg' | 'water'): FactorProvenance | null {
  const material = MATERIAL_MAP[materialId];
  if (!material) return null;
  const override = getMaterialFactorOverride(material.name);
  const suppliedByDatabase =
    kind === 'ghg' ? override?.mtco2ePerLb !== undefined : override?.waterUsageGalPerLb !== undefined;
  return {
    name: material.name,
    value: kind === 'ghg' ? material.mtco2ePerLb : (material.waterUsageGalPerLb ?? 0),
    unit: kind === 'ghg' ? 'MTCO2e/lb' : 'gal/lb',
    origin: suppliedByDatabase ? 'database' : 'code',
    database: suppliedByDatabase ? override?.source : undefined
  };
}

function topContributors(
  rows: { description: string; productId: string; kind: string }[],
  values: number[],
  limit = 6
): Contributor[] {
  const total = values.reduce((s, v) => s + Math.abs(v), 0);
  return rows
    .map((row, i) => ({
      label: row.description || `Product ${row.productId}`,
      detail: `${row.kind} · product id ${row.productId}`,
      value: values[i],
      share: total === 0 ? 0 : Math.abs(values[i]) / total
    }))
    .filter(c => c.value !== 0)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, limit);
}

export function explainOutputs(inventory: ProjectInventory): CalculatorExplanation {
  const projections = getProjectionsFromInventory(inventory);
  const datasheet = getProjectDatasheet(inventory);
  const rows = datasheet.rows;

  const summary = projections.annualSummary;
  const env = projections.environmentalResults;
  const fin = projections.financialResults;

  // Every material actually referenced by this project, with where its factors came from.
  const materialIds = Array.from(
    new Set(
      inventory.singleUseItems
        .concat(inventory.reusableItems as any[])
        .flatMap((item: any) => [item.product?.primaryMaterial, item.product?.secondaryMaterial])
        .filter((id: unknown): id is number => typeof id === 'number')
    )
  );
  const ghgFactors = materialIds.map(id => materialProvenance(id, 'ghg')).filter(Boolean) as FactorProvenance[];
  const waterFactors = materialIds.map(id => materialProvenance(id, 'water')).filter(Boolean) as FactorProvenance[];

  const cardboardGhg: FactorProvenance = {
    name: 'Corrugated Cardboard (shipping box)',
    value: CORRUGATED_CARDBOARD_GAS,
    unit: 'MTCO2e/lb',
    origin: getMaterialFactorOverride('Corrugated Cardboard')?.mtco2ePerLb !== undefined ? 'database' : 'code',
    database: getMaterialFactorOverride('Corrugated Cardboard')?.source
  };
  const freight: FactorProvenance = {
    name: 'Ocean freight',
    value: TRANSPORTATION_CO2_EMISSIONS_FACTOR,
    unit: 'MTCO2e/lb',
    origin: 'code'
  };

  const singleUseInputs = inventory.singleUseItems.slice(0, 8).map((item: any) => ({
    label: item.product?.description?.trim() || `Product ${item.productId}`,
    value: `${num(item.casesPurchased, 0)} cases × ${num(item.unitsPerCase, 0)}/case @ ${money(item.caseCost)}`
  }));

  const outputs: OutputExplanation[] = [
    {
      key: 'annualCostChange',
      label: 'Annual cost change',
      group: 'Financial',
      value: summary.dollarCost.change,
      unit: '$/year',
      formula:
        'single-use purchasing avoided − (reusable restocking + labor + dishwashing utilities + waste hauling + other expenses)',
      inputsUsed: singleUseInputs,
      factorsUsed: [
        {
          name: 'Electricity rate',
          value: inventory.utilityRates.electric,
          unit: '$/kWh',
          origin: 'code',
          database: undefined
        },
        { name: 'Gas rate', value: inventory.utilityRates.gas, unit: '$/therm', origin: 'code' }
      ],
      contributors: [
        {
          label: 'Single-use purchasing',
          detail: 'what stops being bought',
          value: summary.dollarCost.singleUseProductChange,
          share: 1
        },
        { label: 'Labor', detail: 'dishwashing and handling', value: summary.dollarCost.laborCosts, share: 1 },
        {
          label: 'Reusable restocking',
          detail: 'replacing what does not come back',
          value: summary.dollarCost.reusableProductCosts,
          share: 1
        },
        {
          label: 'Dishwashing utilities',
          detail: 'electricity, gas and water',
          value: summary.dollarCost.utilities,
          share: 1
        },
        {
          label: 'Waste hauling',
          detail: 'entered monthly bills × 12',
          value: summary.dollarCost.wasteHauling,
          share: 1
        }
      ].filter(c => c.value !== 0),
      caveats: ['Waste hauling uses the monthly bills entered on the project, not a volume calculation.']
    },
    {
      key: 'singleUseUnits',
      label: 'Single-use items avoided',
      group: 'Operational',
      value: summary.singleUseProductCount.change,
      unit: 'items/year',
      formula: 'baseline items − forecast items, where items = cases × units per case × times per year',
      inputsUsed: singleUseInputs,
      factorsUsed: [],
      contributors: topContributors(
        rows.filter(r => r.kind === 'Single-use'),
        rows.filter(r => r.kind === 'Single-use').map(r => r.forecastItems - r.annualItems)
      ),
      caveats: []
    },
    {
      key: 'wasteWeight',
      label: 'Waste avoided',
      group: 'Environmental',
      value: summary.wasteWeight.change,
      unit: 'lb/year',
      formula: 'Σ (item weight × items) + (shipping box weight per case × cases), baseline vs forecast',
      inputsUsed: singleUseInputs,
      factorsUsed: [],
      contributors: topContributors(
        rows.filter(r => r.kind === 'Single-use'),
        rows.filter(r => r.kind === 'Single-use').map(r => r.massForecastLb - r.massBaselineLb)
      ),
      caveats: [
        'Shipping box weight is the catalog weight per case multiplied by your case count — it does not scale with units per case.'
      ]
    },
    {
      key: 'ghgTotal',
      label: 'GHG avoided',
      group: 'Environmental',
      value: summary.greenhouseGasEmissions.total.change,
      unit: 'MTCO2e/year',
      formula:
        'Σ (material mass × material factor) + (box mass × cardboard factor) + ocean freight on both + dishwashing energy',
      inputsUsed: singleUseInputs,
      factorsUsed: [...ghgFactors, cardboardGhg, freight],
      contributors: topContributors(
        rows,
        rows.map(r => r.ghgForecast - r.ghgBaseline)
      ),
      caveats: [
        'Ocean freight is applied to product mass AND again to shipping-box mass.',
        'Dishwashing electricity uses one flat carbon factor for every region.'
      ]
    },
    {
      key: 'waterTotal',
      label: 'Water avoided',
      group: 'Environmental',
      value: env.annualWaterUsageChanges.total.change,
      unit: 'gal/year',
      formula: 'Σ (material mass × material water factor) + (box mass × cardboard water factor) + dishwashing water',
      inputsUsed: singleUseInputs,
      factorsUsed: waterFactors,
      contributors: topContributors(
        rows,
        rows.map(r => r.waterForecast - r.waterBaseline)
      ),
      caveats: ['Bottle/water-station items are excluded from these totals by the calculator.']
    },
    {
      key: 'paybackMonths',
      label: 'Payback period',
      group: 'Financial',
      value: fin.summary.paybackPeriodsMonths,
      unit: 'months',
      formula: 'one-time costs ÷ monthly net savings',
      inputsUsed: [
        { label: 'One-time costs', value: money(fin.oneTimeCosts.total) },
        { label: 'Annual net savings', value: money(Math.abs(summary.dollarCost.change)) }
      ],
      factorsUsed: [],
      contributors: [
        {
          label: 'Reusables purchase',
          detail: 'initial fleet',
          value: fin.oneTimeCosts.reusableProductCosts,
          share: 1
        },
        {
          label: 'Equipment and installation',
          detail: 'dishwasher, racks, bus tubs',
          value: fin.oneTimeCosts.additionalCosts,
          share: 1
        }
      ].filter(c => c.value !== 0),
      caveats: []
    }
  ];

  const activeDatabases = Array.from(
    new Set(
      [...ghgFactors, ...waterFactors, cardboardGhg]
        .filter(f => f.origin === 'database' && f.database)
        .map(f => f.database as string)
    )
  );

  return { outputs, activeDatabases };
}
