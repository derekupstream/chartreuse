/**
 * Server-side bridge from a stored project to the 2.0 Combined Model: loads the Data Release
 * tables from the Databases area and maps the project's line items into ModelInputs.
 *
 * Deliberate scope (mirrors docs/CR2-CALC-MODEL.md feedback #3): labor costs, other expenses
 * and waste hauling are NOT mapped — the 2.0 methodology hasn't defined them yet, and mapping
 * them by guesswork would produce numbers nobody signed off on. The UI says so wherever 2.0
 * results are shown. Lines whose product ids don't resolve in the 2.0 directories are counted
 * and reported, never silently dropped.
 */
import type { ModelInputs, ModelTables } from './combinedModel';
import prisma from 'lib/prisma';

const TABLE_NAMES: Record<keyof ModelTables, string> = {
  ghgFactors: 'GHG Factors',
  waterFactors: 'Water Factors',
  transportFactors: 'Transport Factors',
  purchaseFrequency: 'Purchase Frequency',
  utilityRates: 'Utility Rates',
  dishwasherFactors: 'Dishwasher Factors',
  singleUseProducts: 'Single-Use Products',
  reusableProducts: 'Reusable Products'
};

/** Null when the Data Release isn't loaded in this environment — callers fall back to v1. */
export async function loadModelTables(): Promise<ModelTables | null> {
  const names = Object.values(TABLE_NAMES);
  const databases = await prisma.factorDatabase.findMany({
    where: { name: { in: names }, isActive: true },
    include: { rows: { orderBy: { rowIndex: 'asc' } } }
  });
  if (databases.length < names.length) return null;

  const byName = new Map(databases.map(d => [d.name, d.rows.map(r => r.data as Record<string, unknown>)]));
  const tables = {} as Record<keyof ModelTables, unknown>;
  for (const [key, name] of Object.entries(TABLE_NAMES)) {
    tables[key as keyof ModelTables] = byName.get(name) ?? [];
  }
  return tables as unknown as ModelTables;
}

export type ProjectModelMapping = {
  inputs: ModelInputs;
  unmatchedSingleUse: number;
  unmatchedReusables: number;
  excluded: string[];
};

const FREQUENCIES = ['Daily', 'Weekly', 'Monthly', 'Annually'];
const normalizeFrequency = (f: string) =>
  FREQUENCIES.find(k => k.toLowerCase() === (f ?? '').trim().toLowerCase()) ?? 'Annually';

export async function buildModelInputs(projectId: string, tables: ModelTables): Promise<ProjectModelMapping | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      singleUseItems: true,
      reusableItems: true,
      dishwashers: true,
      laborCosts: { select: { id: true } },
      otherExpenses: { select: { id: true } },
      wasteHaulingCosts: { select: { id: true } }
    }
  });
  if (!project) return null;

  const suIds = new Set(tables.singleUseProducts.map(p => Number(p.product_id)));
  const reuseIds = new Set(tables.reusableProducts.map(p => Number(p.product_id)));

  let unmatchedSingleUse = 0;
  const singleUse = project.singleUseItems.flatMap(item => {
    const pid = Number(item.productId);
    if (!suIds.has(pid)) {
      unmatchedSingleUse += 1;
      return [];
    }
    const frequency = normalizeFrequency(item.frequency);
    return [
      {
        productId: pid,
        baselineFrequency: frequency,
        baselineCasesPerFrequency: item.casesPurchased,
        baselineUnitsPerCase: item.unitsPerCase,
        baselineCostPerCase: item.caseCost,
        forecastFrequency: frequency,
        forecastCasesPerFrequency: item.newCasesPurchased,
        forecastUnitsPerCase: item.unitsPerCase,
        forecastCostPerCase: item.newCaseCost
      }
    ];
  });

  let unmatchedReusables = 0;
  const reusables = project.reusableItems.flatMap(item => {
    const pid = Number(item.productId);
    if (!item.productId || !reuseIds.has(pid)) {
      unmatchedReusables += 1;
      return [];
    }
    return [
      {
        productId: pid,
        initialCases: item.casesPurchased,
        unitsPerCase: item.unitsPerCase,
        costPerCase: item.caseCost,
        annualRepurchaseRate: item.annualRepurchasePercentage
      }
    ];
  });

  const dish = project.dishwashers[0];
  const machineTypes = new Set(tables.dishwasherFactors.map(m => m.machine_type));
  const dishwashing =
    dish && machineTypes.has(dish.type)
      ? {
          state: project.USState ?? 'California',
          machineType: dish.type,
          temperature: (dish.temperature.toLowerCase().startsWith('h') ? 'High' : 'Low') as 'High' | 'Low',
          energyStar: dish.energyStarCertified,
          buildingHeaterFuel: (dish.buildingWaterHeaterFuelType.toLowerCase().startsWith('e') ? 'Electric' : 'Gas') as
            | 'Electric'
            | 'Gas',
          boosterHeaterFuel: ((dish.boosterWaterHeaterFuelType ?? 'Electric').toLowerCase().startsWith('e')
            ? 'Electric'
            : 'Gas') as 'Electric' | 'Gas',
          operatingDaysPerYear: dish.operatingDays,
          racksPerDay: dish.racksPerDay
        }
      : undefined;

  const excluded: string[] = [];
  if (project.laborCosts.length) excluded.push('labor costs');
  if (project.otherExpenses.length) excluded.push('other expenses');
  if (project.wasteHaulingCosts.length) excluded.push('waste hauling');

  return { inputs: { singleUse, reusables, dishwashing }, unmatchedSingleUse, unmatchedReusables, excluded };
}
