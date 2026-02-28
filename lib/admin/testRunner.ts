import type { GoldenDataset } from '@prisma/client';
import type { ProjectInventory } from 'lib/inventory/types/projects';
import { getAnnualSummary } from 'lib/calculator/calculations/getAnnualSummary';
import { getEnvironmentalResults } from 'lib/calculator/calculations/getEnvironmentalResults';
import { getFinancialResults } from 'lib/calculator/calculations/getFinancialResults';
import { getSingleUseResults } from 'lib/calculator/calculations/foodware/getSingleUseResults';
import { getReusableResults } from 'lib/calculator/calculations/foodware/getReusableResults';
import { getBottleStationResults } from 'lib/calculator/calculations/foodware/getBottleStationResults';

export interface MetricDiff {
  path: string;
  expected: number;
  actual: number;
  absoluteDiff: number;
  percentDiff: number;
  passed: boolean;
}

export interface TestRunnerResult {
  datasetId: string;
  passed: boolean;
  actualOutputs: object;
  diff: MetricDiff[];
  errorMessage?: string;
}

function flattenObject(obj: unknown, prefix = ''): Record<string, number> {
  const result: Record<string, number> = {};
  if (typeof obj !== 'object' || obj === null) return result;
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'number') {
      result[path] = value;
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, path));
    } else if (Array.isArray(value)) {
      value.forEach((v, i) => {
        if (typeof v === 'number') result[`${path}[${i}]`] = v;
        else Object.assign(result, flattenObject(v, `${path}[${i}]`));
      });
    }
  }
  return result;
}

export function runDatasetTest(dataset: GoldenDataset): TestRunnerResult {
  try {
    const inventory = dataset.inputs as unknown as ProjectInventory;
    const expectedOutputs = dataset.expectedOutputs as Record<string, unknown>;
    const tolerance = dataset.tolerance;

    const actualOutputs = {
      annualSummary: getAnnualSummary(inventory),
      environmentalResults: getEnvironmentalResults(inventory),
      financialResults: getFinancialResults(inventory),
      singleUseResults: getSingleUseResults(inventory),
      reusableResults: getReusableResults(inventory),
      bottleStationResults: getBottleStationResults(inventory)
    };

    const expectedFlat = flattenObject(expectedOutputs);
    const actualFlat = flattenObject(actualOutputs);

    const diff: MetricDiff[] = [];
    let allPassed = true;

    for (const [path, expected] of Object.entries(expectedFlat)) {
      const actual = actualFlat[path] ?? 0;
      const absoluteDiff = Math.abs(actual - expected);
      const percentDiff = expected === 0 ? (actual === 0 ? 0 : Infinity) : absoluteDiff / Math.abs(expected);
      const passed = percentDiff <= tolerance;
      if (!passed) allPassed = false;
      diff.push({ path, expected, actual, absoluteDiff, percentDiff, passed });
    }

    return {
      datasetId: dataset.id,
      passed: allPassed,
      actualOutputs,
      diff
    };
  } catch (err: any) {
    return {
      datasetId: dataset.id,
      passed: false,
      actualOutputs: {},
      diff: [],
      errorMessage: err?.message || 'Unknown error'
    };
  }
}
