import type { ProjectInventory } from '../../inventory/types/projects';

import type { AnnualGasEmissionChanges } from './environmental-results-gas';
import { getAnnualGasEmissionChanges } from './environmental-results-gas';
import type { AnnualWasteResults } from './environmental-results-waste';
import { getAnnualWasteChanges } from './environmental-results-waste';
import type { AnnualWaterResults } from './environmental-results-water';
import { getannualWaterUsageChanges } from './environmental-results-water';

interface EnvironmentalResults {
  annualGasEmissionChanges: AnnualGasEmissionChanges;
  annualWasteChanges: AnnualWasteResults;
  annualWaterUsageChanges: AnnualWaterResults;
}

export function getEnvironmentalResults(project: ProjectInventory): EnvironmentalResults {
  const annualGasEmissionChanges = getAnnualGasEmissionChanges(project);
  const annualWasteChanges = getAnnualWasteChanges(project);
  const annualWaterUsageChanges = getannualWaterUsageChanges(project);

  return {
    annualGasEmissionChanges,
    annualWasteChanges,
    annualWaterUsageChanges
  };
}
