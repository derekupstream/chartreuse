/**
 * Madhavi's Validation tab, executed — not displayed.
 *
 * Her workbook's Validation tab lists nine checks with a Status column. Here each check is
 * a real computation over the live Data Release tables and the v2 engine: duplicate-key
 * scans, factor sanity, and the reconciliation identities (a total must equal the sum of
 * its parts). PASS means the check ran and held, with the evidence attached; it is never
 * a stored label.
 *
 * Pure functions — the same code runs in jest against the committed payload and in the
 * Validation tool against the live tables.
 */
import { computeCombinedModel } from './combinedModel';
import type { FactorRow, ModelInputs, ModelTables, TransportRow } from './combinedModel';
import { GOLDEN_EXPECTED, GOLDEN_INPUTS, GOLDEN_REL_TOLERANCE } from './goldenDataset';

export type CheckResult = {
  check: string;
  purpose: string;
  pass: boolean;
  /** What was actually computed — the numbers behind the verdict */
  evidence: string;
};

export type GoldenMetricResult = {
  key: string;
  label: string;
  expected: number;
  computed: number;
  digits: number;
  pass: boolean;
};

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const close = (a: number, b: number, tolerance = GOLDEN_REL_TOLERANCE) =>
  Math.abs(a - b) / Math.max(1, Math.abs(b)) < tolerance;

/** The 15 Dashboard metrics computed live and compared to the workbook's expected values. */
export function runGoldenVerification(tables: ModelTables): GoldenMetricResult[] {
  const outputs = computeCombinedModel(GOLDEN_INPUTS, tables, { replicateWorkbookBoxLookup: true });
  const byKey: Record<string, number> = {
    baselineCost: outputs.financial.baselineSingleUseAnnualCost,
    forecastCost: outputs.financial.forecastAnnualOperatingCost,
    savings: outputs.financial.annualSavings,
    oneTime: outputs.financial.oneTimeStartupCost,
    unitsBase: outputs.singleUseUnits.baseline,
    unitsFcst: outputs.singleUseUnits.forecastAnnual,
    wasteBase: outputs.wasteLb.baseline,
    wasteFcst: outputs.wasteLb.forecastAnnual,
    wasteFy: outputs.wasteLb.forecastFirstYear,
    ghgBase: outputs.ghgMtco2e.baseline,
    ghgFcst: outputs.ghgMtco2e.forecastAnnual,
    ghgFy: outputs.ghgMtco2e.forecastFirstYear,
    waterBase: outputs.waterGal.baseline,
    waterFcst: outputs.waterGal.forecastAnnual,
    waterFy: outputs.waterGal.forecastFirstYear
  };
  return GOLDEN_EXPECTED.map(e => ({
    key: e.key,
    label: e.label,
    expected: e.value,
    computed: byKey[e.key],
    digits: e.digits,
    pass: close(byKey[e.key], e.value)
  }));
}

function duplicateIds(rows: Record<string, unknown>[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const row of rows) {
    const id = String(row.product_id ?? '');
    if (!id) continue;
    if (seen.has(id)) dupes.add(id);
    seen.add(id);
  }
  return Array.from(dupes);
}

/** GHG factor values zeroed — leaves only the transport term in every line's GHG. */
function withZeroedGhgFactors(tables: ModelTables): ModelTables {
  const zero = (rows: FactorRow[]): FactorRow[] => rows.map(row => ({ ...row, ghg_factor_mtco2e_per_lb: 0 }));
  return { ...tables, ghgFactors: zero(tables.ghgFactors) };
}

/** Transport factors zeroed — leaves only the material term. */
function withZeroedTransport(tables: ModelTables): ModelTables {
  const zero = (rows: TransportRow[]): TransportRow[] => rows.map(row => ({ ...row, GHG_Factor: 0 }));
  return { ...tables, transportFactors: zero(tables.transportFactors) };
}

/**
 * Her nine Validation-tab checks, computed. Reconciliations run the engine three times
 * (full / material-only / transport-only) and require the parts to sum to the whole —
 * the same additive identity her SUMIF checks assert in the workbook.
 */
export function runValidationChecks(tables: ModelTables): CheckResult[] {
  const results: CheckResult[] = [];

  // 1–2 · stable keys
  const suDupes = duplicateIds(tables.singleUseProducts);
  results.push({
    check: 'No duplicate single-use product IDs',
    purpose: 'Stable keys',
    pass: suDupes.length === 0,
    evidence: `${tables.singleUseProducts.length} rows scanned${suDupes.length ? `; duplicates: ${suDupes.join(', ')}` : ', all product_id values unique'}`
  });
  const reuseDupes = duplicateIds(tables.reusableProducts);
  results.push({
    check: 'No duplicate reusable product IDs',
    purpose: 'Stable keys',
    pass: reuseDupes.length === 0,
    evidence: `${tables.reusableProducts.length} rows scanned${reuseDupes.length ? `; duplicates: ${reuseDupes.join(', ')}` : ', all product_id values unique'}`
  });

  // 3 · factor and distance
  const badTransport = tables.transportFactors.filter(t => num(t.GHG_Factor) <= 0 || num(t.Distance_Miles) <= 0);
  results.push({
    check: 'Transportation factor positive',
    purpose: 'Factor and distance',
    pass: tables.transportFactors.length > 0 && badTransport.length === 0,
    evidence: tables.transportFactors.length
      ? tables.transportFactors.map(t => `factor ${num(t.GHG_Factor)} × ${num(t.Distance_Miles)} mi`).join('; ')
      : 'no transport factor rows loaded'
  });

  // 4–5 · scenario checks on the golden inputs
  const golden = computeCombinedModel(GOLDEN_INPUTS, tables, { replicateWorkbookBoxLookup: true });
  results.push({
    check: 'Baseline cost nonnegative',
    purpose: 'Scenario check',
    pass: golden.financial.baselineSingleUseAnnualCost >= 0,
    evidence: `golden scenario baseline = $${golden.financial.baselineSingleUseAnnualCost.toLocaleString()}`
  });
  results.push({
    check: 'Forecast operating cost nonnegative',
    purpose: 'Scenario check',
    pass: golden.financial.forecastAnnualOperatingCost >= 0,
    evidence: `golden scenario forecast = $${golden.financial.forecastAnnualOperatingCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
  });

  // 6 · single-use GHG = material + transport (baseline, single-use lines only)
  const suOnly: ModelInputs = { singleUse: GOLDEN_INPUTS.singleUse, reusables: [] };
  const suFull = computeCombinedModel(suOnly, tables).ghgMtco2e.baseline;
  const suMaterial = computeCombinedModel(suOnly, withZeroedTransport(tables)).ghgMtco2e.baseline;
  const suTransport = computeCombinedModel(suOnly, withZeroedGhgFactors(tables)).ghgMtco2e.baseline;
  results.push({
    check: 'SU GHG equals material + transport',
    purpose: 'Reconciliation',
    pass: close(suMaterial + suTransport, suFull),
    evidence: `material ${suMaterial.toFixed(6)} + transport ${suTransport.toFixed(6)} = ${(suMaterial + suTransport).toFixed(6)} vs total ${suFull.toFixed(6)} MTCO₂e`
  });

  // 7 · reusable recurring GHG = material + transport (reusable line only, annual recurring)
  const reuseOnly: ModelInputs = { singleUse: [], reusables: GOLDEN_INPUTS.reusables };
  const reuseFull = computeCombinedModel(reuseOnly, tables).ghgMtco2e.forecastAnnual;
  const reuseMaterial = computeCombinedModel(reuseOnly, withZeroedTransport(tables)).ghgMtco2e.forecastAnnual;
  const reuseTransport = computeCombinedModel(reuseOnly, withZeroedGhgFactors(tables)).ghgMtco2e.forecastAnnual;
  results.push({
    check: 'Reusable recurring GHG equals material + transport',
    purpose: 'Reconciliation',
    pass: close(reuseMaterial + reuseTransport, reuseFull),
    evidence: `material ${reuseMaterial.toFixed(6)} + transport ${reuseTransport.toFixed(6)} = ${(reuseMaterial + reuseTransport).toFixed(6)} vs total ${reuseFull.toFixed(6)} MTCO₂e`
  });

  // 8–9 · dashboard reductions reconcile: reduction = baseline − forecast
  const ghgDelta = golden.ghgMtco2e.baseline - golden.ghgMtco2e.forecastAnnual;
  results.push({
    check: 'Dashboard GHG reduction reconciles',
    purpose: 'Dashboard',
    pass: close(golden.ghgMtco2e.reduction, ghgDelta),
    evidence: `baseline ${golden.ghgMtco2e.baseline.toFixed(4)} − forecast ${golden.ghgMtco2e.forecastAnnual.toFixed(4)} = ${ghgDelta.toFixed(4)}; reported reduction ${golden.ghgMtco2e.reduction.toFixed(4)}`
  });
  const waterDelta = golden.waterGal.baseline - golden.waterGal.forecastAnnual;
  results.push({
    check: 'Dashboard water reduction reconciles',
    purpose: 'Dashboard',
    pass: close(golden.waterGal.reduction, waterDelta),
    evidence: `baseline ${golden.waterGal.baseline.toFixed(2)} − forecast ${golden.waterGal.forecastAnnual.toFixed(2)} = ${waterDelta.toFixed(2)}; reported reduction ${golden.waterGal.reduction.toFixed(2)}`
  });

  return results;
}
