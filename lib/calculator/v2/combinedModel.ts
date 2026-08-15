/**
 * The 2.0 calculation model — a faithful implementation of Madhavi's "Combined Data &
 * Calculation Model" workbook (Calc_SU, Calc_Reuse, Dishwashing, Additional_Costs,
 * Dashboard), taking the Data Release tables as plain data.
 *
 * Pure functions, no database access: callers load the tables (from the Databases area or
 * from scripts/data/cr2-release-2.0.json) and pass them in. This is what makes the golden
 * test possible — the same code runs in jest against the committed payload and in the app
 * against the live tables.
 *
 * Column-for-column with the workbook on purpose, including its quirk: the box-material
 * lookup in Calc_Reuse's impact formulas does not filter by scope, and the Water Factors
 * table carries corrugated cardboard under BOTH scopes, so the workbook double-counts
 * reusable box water. `replicateWorkbookBoxLookup: true` reproduces that (needed to match
 * her Dashboard exactly); the default resolves the material once, which is the corrected
 * behaviour she'll adopt. See docs/CR2-CALC-MODEL.md, review feedback #1.
 */

export type FrequencyRow = { Frequency: string; Annual_Factor: number };
export type FactorRow = Record<string, unknown>; // scoped material factor rows
export type TransportRow = { GHG_Factor: number; Distance_Miles: number };
export type UtilityRow = {
  state: string;
  electric_rate_usd_per_kwh: number;
  gas_rate_usd_per_therm: number;
  water_rate_usd_per_1000_gal: number;
};
export type DishwasherRow = {
  temperature: string;
  machine_type: string;
  water_gal_per_rack_conventional: number;
  water_gal_per_rack_energy_star: number;
};
export type ProductRow = Record<string, unknown>;

export type ModelTables = {
  ghgFactors: FactorRow[];
  waterFactors: FactorRow[];
  transportFactors: TransportRow[];
  purchaseFrequency: FrequencyRow[];
  utilityRates: UtilityRow[];
  dishwasherFactors: DishwasherRow[];
  singleUseProducts: ProductRow[];
  reusableProducts: ProductRow[];
};

export type SingleUseLine = {
  productId: number;
  baselineFrequency: string;
  baselineCasesPerFrequency: number;
  baselineUnitsPerCase: number;
  baselineCostPerCase: number;
  forecastFrequency: string;
  forecastCasesPerFrequency: number;
  forecastUnitsPerCase: number;
  forecastCostPerCase: number;
};

export type ReusableLine = {
  productId: number;
  initialCases: number;
  unitsPerCase: number;
  costPerCase: number;
  annualRepurchaseRate: number; // fraction, e.g. 0.1
};

export type DishwashingInputs = {
  state: string;
  customRates?: { electric: number; gas: number; waterPer1000Gal: number };
  machineType: string;
  temperature: 'Low' | 'High';
  energyStar: boolean;
  buildingHeaterFuel: 'Electric' | 'Gas';
  boosterHeaterFuel: 'Electric' | 'Gas';
  operatingDaysPerYear: number;
  racksPerDay: number;
};

export type AdditionalCostLine = { frequency: string; amount: number };

export type ModelInputs = {
  singleUse: SingleUseLine[];
  reusables: ReusableLine[];
  dishwashing?: DishwashingInputs;
  additionalCosts?: AdditionalCostLine[]; // frequency 'One Time' = one-time
  wasteHauling?: { baselineMonthly: number; forecastMonthly: number };
};

export type ModelOptions = {
  /** Reproduce the workbook's unscoped box-material lookup (sums duplicate rows). */
  replicateWorkbookBoxLookup?: boolean;
};

export type MetricTriple = {
  baseline: number;
  forecastAnnual: number;
  reduction: number;
  reductionPct: number;
  forecastFirstYear: number;
  firstYearReduction: number;
};

export type ModelOutputs = {
  financial: {
    baselineSingleUseAnnualCost: number;
    forecastAnnualOperatingCost: number;
    annualSavings: number;
    oneTimeStartupCost: number;
    annualSavingsROI: number;
    paybackMonths: number | null;
  };
  singleUseUnits: MetricTriple;
  wasteLb: MetricTriple;
  ghgMtco2e: MetricTriple;
  waterGal: MetricTriple;
  dishwashing: {
    annualWaterGal: number;
    totalElectricityKwh: number;
    totalGasTherms: number;
    utilityCost: number;
    ghgMtco2e: number;
  } | null;
};

// ── constants from the workbook's Dishwashing sheet (heater energy method) ─────────────────
const BUILDING_KWH_PER_GAL = 0.1717918076;
const BUILDING_THERM_PER_GAL = 0.007182486631;
const BOOSTER_KWH_PER_GAL = 0.09816674719;
const BOOSTER_THERM_PER_GAL = 0.004104278075;
const ELECTRIC_LB_CO2E_PER_KWH = 1.56;
const LB_PER_METRIC_TON = 2204.62262;

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

function frequencyFactor(tables: ModelTables, frequency: string): number {
  const row = tables.purchaseFrequency.find(f => f.Frequency === frequency);
  return row ? num(row.Annual_Factor) : 0;
}

/**
 * Scoped factor lookup, mirroring the workbook's SUMIFS. `scope: null` reproduces the
 * unscoped box lookup: SUMIFS sums every row whose material matches (case-insensitively).
 * The corrected variant resolves the material to one value (first match).
 */
function materialFactor(rows: FactorRow[], valueKey: string, scope: string | null, material: string): number {
  if (!material) return 0;
  const matches = rows.filter(row => {
    const rowMaterial = String(row.material ?? '').toLowerCase();
    if (rowMaterial !== material.toLowerCase()) return false;
    if (scope === null) return true;
    const rowScope = String(row.scope ?? row.application_scope ?? '');
    return rowScope === scope;
  });
  if (scope === null) return matches.reduce((sum, row) => sum + num(row[valueKey]), 0);
  return matches.length ? num(matches[0][valueKey]) : 0;
}

/** Corrected box lookup: the material resolves once, whatever scope carries it. */
function boxFactor(rows: FactorRow[], valueKey: string, material: string, replicate: boolean): number {
  if (replicate) return materialFactor(rows, valueKey, null, material);
  const values = rows
    .filter(row => String(row.material ?? '').toLowerCase() === material.toLowerCase())
    .map(row => num(row[valueKey]));
  return values.length ? values[0] : 0;
}

function product(rows: ProductRow[], productId: number): ProductRow | undefined {
  return rows.find(row => num(row.product_id) === productId);
}

export function computeCombinedModel(
  inputs: ModelInputs,
  tables: ModelTables,
  options: ModelOptions = {}
): ModelOutputs {
  const replicate = !!options.replicateWorkbookBoxLookup;
  const transport = tables.transportFactors[0];
  const transportPerLb = transport ? num(transport.GHG_Factor) * num(transport.Distance_Miles) : 0;

  const ghgKey = 'ghg_factor_mtco2e_per_lb';
  const waterKey = 'water_factor_gal_per_lb';

  // ── Calc_SU ───────────────────────────────────────────────────────────────────────────
  let suBaseCost = 0;
  let suFcstCost = 0;
  let suBaseUnits = 0;
  let suFcstUnits = 0;
  let suBaseWaste = 0;
  let suFcstWaste = 0;
  let suBaseGhg = 0;
  let suFcstGhg = 0;
  let suBaseWater = 0;
  let suFcstWater = 0;

  for (const line of inputs.singleUse) {
    const p = product(tables.singleUseProducts, line.productId);
    if (!p) continue;
    const itemWt = num(p.item_weight_lbs);
    const secondaryPct = num(p.secondary_material_pct);
    const boxWtPerCase = num(p.box_weight_per_case_lbs);
    const primaryMaterial = String(p.primary_material ?? '');
    const secondaryMaterial = String(p.secondary_material ?? '');
    const boxMaterial = String(p.box_material ?? '');

    const baseCases = line.baselineCasesPerFrequency * frequencyFactor(tables, line.baselineFrequency);
    const fcstCases = line.forecastCasesPerFrequency * frequencyFactor(tables, line.forecastFrequency);
    const baseUnits = baseCases * line.baselineUnitsPerCase;
    const fcstUnits = fcstCases * line.forecastUnitsPerCase;

    suBaseCost += baseCases * line.baselineCostPerCase;
    suFcstCost += fcstCases * line.forecastCostPerCase;
    suBaseUnits += baseUnits;
    suFcstUnits += fcstUnits;

    const masses = (units: number, cases: number) => ({
      primary: units * itemWt * (1 - secondaryPct),
      secondary: units * itemWt * secondaryPct,
      box: cases * boxWtPerCase
    });
    const impacts = (m: { primary: number; secondary: number; box: number }) => {
      const shipped = m.primary + m.secondary + m.box;
      const ghgMaterial =
        m.primary * materialFactor(tables.ghgFactors, ghgKey, 'Single-Use', primaryMaterial) +
        m.secondary * materialFactor(tables.ghgFactors, ghgKey, 'Single-Use', secondaryMaterial) +
        m.box * materialFactor(tables.ghgFactors, ghgKey, 'Single-Use', boxMaterial);
      const water =
        m.primary * materialFactor(tables.waterFactors, waterKey, 'Single-Use', primaryMaterial) +
        m.secondary * materialFactor(tables.waterFactors, waterKey, 'Single-Use', secondaryMaterial) +
        m.box * materialFactor(tables.waterFactors, waterKey, 'Single-Use', boxMaterial);
      return { shipped, ghg: ghgMaterial + shipped * transportPerLb, water };
    };

    const base = impacts(masses(baseUnits, baseCases));
    const fcst = impacts(masses(fcstUnits, fcstCases));
    suBaseWaste += base.shipped;
    suFcstWaste += fcst.shipped;
    suBaseGhg += base.ghg;
    suFcstGhg += fcst.ghg;
    suBaseWater += base.water;
    suFcstWater += fcst.water;
  }

  // ── Calc_Reuse ────────────────────────────────────────────────────────────────────────
  let reuseInitialCost = 0;
  let reuseRecurringCost = 0;
  let reuseInitialMass = 0;
  let reuseRecurringMass = 0;
  let reuseInitialGhg = 0;
  let reuseRecurringGhg = 0;
  let reuseInitialWater = 0;
  let reuseRecurringWater = 0;

  for (const line of inputs.reusables) {
    const p = product(tables.reusableProducts, line.productId);
    if (!p) continue;
    const itemWt = num(p.item_weight_lbs);
    const secondaryPct = num(p.secondary_material_pct);
    const boxWtPerCase = num(p.box_weight_per_case_lbs);
    const primaryMaterial = String(p.primary_material ?? '');
    const secondaryMaterial = String(p.secondary_material ?? '');
    const boxMaterial = String(p.box_material ?? '');

    const initialUnits = line.initialCases * line.unitsPerCase;
    const rep = line.annualRepurchaseRate;

    reuseInitialCost += line.initialCases * line.costPerCase;
    reuseRecurringCost += line.initialCases * line.costPerCase * rep;

    const initial = {
      primary: initialUnits * itemWt * (1 - secondaryPct),
      secondary: initialUnits * itemWt * secondaryPct,
      box: line.initialCases * boxWtPerCase
    };
    const recurring = { primary: initial.primary * rep, secondary: initial.secondary * rep, box: initial.box * rep };

    const impacts = (m: { primary: number; secondary: number; box: number }) => {
      const shipped = m.primary + m.secondary + m.box;
      const ghgMaterial =
        m.primary * materialFactor(tables.ghgFactors, ghgKey, 'Reusable', primaryMaterial) +
        m.secondary * materialFactor(tables.ghgFactors, ghgKey, 'Reusable', secondaryMaterial) +
        m.box * boxFactor(tables.ghgFactors, ghgKey, boxMaterial, replicate);
      const water =
        m.primary * materialFactor(tables.waterFactors, waterKey, 'Reusable', primaryMaterial) +
        m.secondary * materialFactor(tables.waterFactors, waterKey, 'Reusable', secondaryMaterial) +
        m.box * boxFactor(tables.waterFactors, waterKey, boxMaterial, replicate);
      return { shipped, ghg: ghgMaterial + shipped * transportPerLb, water };
    };

    const initialImpact = impacts(initial);
    const recurringImpact = impacts(recurring);
    reuseInitialMass += initialImpact.shipped;
    reuseRecurringMass += recurringImpact.shipped;
    reuseInitialGhg += initialImpact.ghg;
    reuseRecurringGhg += recurringImpact.ghg;
    reuseInitialWater += initialImpact.water;
    reuseRecurringWater += recurringImpact.water;
  }

  // ── Dishwashing ───────────────────────────────────────────────────────────────────────
  let dishwashing: ModelOutputs['dishwashing'] = null;
  if (inputs.dishwashing) {
    const d = inputs.dishwashing;
    const rateRow = tables.utilityRates.find(r => r.state === d.state);
    const electricRate = d.customRates?.electric ?? num(rateRow?.electric_rate_usd_per_kwh);
    const gasRate = d.customRates?.gas ?? num(rateRow?.gas_rate_usd_per_therm);
    const waterRate = d.customRates?.waterPer1000Gal ?? num(rateRow?.water_rate_usd_per_1000_gal);

    const machine = tables.dishwasherFactors.find(
      m => m.temperature === d.temperature && m.machine_type === d.machineType
    );
    const galPerRack = machine
      ? d.energyStar
        ? num(machine.water_gal_per_rack_energy_star)
        : num(machine.water_gal_per_rack_conventional)
      : 0;

    const annualWaterGal = galPerRack * d.operatingDaysPerYear * d.racksPerDay;
    const buildingKwh = d.buildingHeaterFuel === 'Electric' ? annualWaterGal * BUILDING_KWH_PER_GAL : 0;
    const buildingTherm = d.buildingHeaterFuel === 'Gas' ? annualWaterGal * BUILDING_THERM_PER_GAL : 0;
    const boosterKwh =
      d.temperature === 'High' && d.boosterHeaterFuel === 'Electric' ? annualWaterGal * BOOSTER_KWH_PER_GAL : 0;
    const boosterTherm =
      d.temperature === 'High' && d.boosterHeaterFuel === 'Gas' ? annualWaterGal * BOOSTER_THERM_PER_GAL : 0;

    const totalElectricityKwh = buildingKwh + boosterKwh;
    const totalGasTherms = buildingTherm + boosterTherm;
    dishwashing = {
      annualWaterGal,
      totalElectricityKwh,
      totalGasTherms,
      utilityCost: totalElectricityKwh * electricRate + totalGasTherms * gasRate + (annualWaterGal * waterRate) / 1000,
      ghgMtco2e: (totalElectricityKwh * ELECTRIC_LB_CO2E_PER_KWH) / LB_PER_METRIC_TON
    };
  }

  // ── Additional costs & hauling ─────────────────────────────────────────────────────────
  const additional = inputs.additionalCosts ?? [];
  const additionalAnnual = additional
    .filter(line => line.frequency !== 'One Time')
    .reduce((sum, line) => sum + line.amount * frequencyFactor(tables, line.frequency), 0);
  const additionalOneTime = additional
    .filter(line => line.frequency === 'One Time')
    .reduce((sum, line) => sum + line.amount, 0);
  const haulingDelta = inputs.wasteHauling
    ? 12 * (inputs.wasteHauling.forecastMonthly - inputs.wasteHauling.baselineMonthly)
    : 0;

  // ── Dashboard ─────────────────────────────────────────────────────────────────────────
  const forecastOperating =
    suFcstCost + reuseRecurringCost + (dishwashing?.utilityCost ?? 0) + additionalAnnual + haulingDelta;
  const annualSavings = suBaseCost - forecastOperating;
  const oneTime = reuseInitialCost + additionalOneTime;

  const triple = (baseline: number, forecastAnnual: number, forecastFirstYear: number): MetricTriple => ({
    baseline,
    forecastAnnual,
    reduction: baseline - forecastAnnual,
    reductionPct: baseline === 0 ? 0 : (baseline - forecastAnnual) / baseline,
    forecastFirstYear,
    firstYearReduction: baseline - forecastFirstYear
  });

  const fcstWaste = suFcstWaste + reuseRecurringMass;
  const fcstGhg = suFcstGhg + reuseRecurringGhg + (dishwashing?.ghgMtco2e ?? 0);
  const fcstWater = suFcstWater + reuseRecurringWater + (dishwashing?.annualWaterGal ?? 0);

  return {
    financial: {
      baselineSingleUseAnnualCost: suBaseCost,
      forecastAnnualOperatingCost: forecastOperating,
      annualSavings,
      oneTimeStartupCost: oneTime,
      annualSavingsROI: oneTime === 0 ? 0 : annualSavings / oneTime,
      paybackMonths: annualSavings <= 0 ? null : (oneTime / annualSavings) * 12
    },
    singleUseUnits: triple(suBaseUnits, suFcstUnits, suFcstUnits),
    wasteLb: triple(suBaseWaste, fcstWaste, fcstWaste + reuseInitialMass),
    ghgMtco2e: triple(suBaseGhg, fcstGhg, fcstGhg + reuseInitialGhg),
    waterGal: triple(suBaseWater, fcstWater, fcstWater + reuseInitialWater),
    dishwashing
  };
}
