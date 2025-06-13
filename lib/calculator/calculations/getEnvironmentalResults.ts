import type { ProjectInventory } from 'lib/inventory/types/projects';

import type { AnnualGasEmissionChanges } from './ghg/getAnnualGasEmissionChanges';
import { getAnnualGasEmissionChanges } from './ghg/getAnnualGasEmissionChanges';
import type { AnnualWasteResults } from './waste/getAnnualWasteChanges';
import { getAnnualWasteChanges } from './waste/getAnnualWasteChanges';
import type { AnnualWaterResults } from './water/getAnnualWaterUsageChanges';
import { getAnnualWaterUsageChanges } from './water/getAnnualWaterUsageChanges';
import type { EventProjectWaste } from './waste/getEventProjectWaste';
import { getEventProjectWaste } from './waste/getEventProjectWaste';

interface EnvironmentalResults {
  annualGasEmissionChanges: AnnualGasEmissionChanges;
  annualWasteChanges: AnnualWasteResults;
  annualWaterUsageChanges: AnnualWaterResults;
  eventProjectWaste: EventProjectWaste;
}

export function getEnvironmentalResults(project: ProjectInventory): EnvironmentalResults {
  const annualGasEmissionChanges = getAnnualGasEmissionChanges(project);
  const annualWasteChanges = getAnnualWasteChanges(project);
  const annualWaterUsageChanges = getAnnualWaterUsageChanges(project);
  const eventProjectWaste = getEventProjectWaste(project);

  return {
    annualGasEmissionChanges,
    annualWasteChanges,
    annualWaterUsageChanges,
    eventProjectWaste
  };
}
