import { Frequency, getAnnualOccurence } from "../constants/frequency";
import { ANNUAL_DISHWASHER_CONSUMPTION } from "../constants/dishwashers";
import { CalculatorInput } from "../input";
import { DishWasher, UtilitiesAndCosts } from "../models/projects";

interface FinancialResults {
  annualCostChanges: AnnualCostChanges;
  oneTimeCosts: OneTimeCosts;
  summary: FinancialSummary;
}

export function getFinancialResults(
  project: CalculatorInput
): FinancialResults {
  const annualCostChanges = calculateAnnualCosts(project);
  const oneTimeCosts = calculateOneTimeCosts(project);
  const summary = calculateSummary(project);

  return {
    annualCostChanges,
    oneTimeCosts,
    summary,
  };
}

/**
 * Annual Cost Changes: Calculate the difference in costs by the end of the first year
 */

// all values in dollars
interface AnnualCostChanges {
  additionalCosts: number;
  reusableProducts: number;
  singleUseProducts: number;
  utilities: number;
  wasteHauling: number;
  total: number; // E46
}

function calculateAnnualCosts(project: CalculatorInput): AnnualCostChanges {
  const additionalCosts = project.additionalCosts.reduce((sum, item) => {
    if (item.frequency === "One Time") {
      return sum;
    }
    const annualCost = item.cost * getAnnualOccurence(item.frequency);
    return sum + annualCost;
  }, 0);

  const reusableProducts = project.reusableItems.reduce((sum, item) => {
    const oneTimeCost = item.caseCost * item.caseCount;
    return sum + oneTimeCost * item.annualRepurchasePercentage;
  }, 0);

  // for each single use item, calculate difference in annual cost
  const { singleUseItems } = project;
  const baseSingleUseCosts = singleUseItems.reduce((sum, item) => {
    return (
      sum +
      singleUseAnnualCost({
        caseCost: item.caseCost,
        caseCount: item.caseCount,
        frequency: item.frequency,
      })
    );
  }, 0);

  const followUpSingleUseCosts = singleUseItems.reduce((sum, item) => {
    return (
      sum +
      singleUseAnnualCost({
        caseCost: item.newCaseCost,
        caseCount: item.newCaseCount,
        frequency: item.frequency,
      })
    );
  }, 0);
  const singleUseProducts = baseSingleUseCosts - followUpSingleUseCosts;

  let utilities = 0;
  if (project.dishwasher) {
    utilities = dishwasherAnnualCost(project.dishwasher, project.utilityRates);
  } else if (project.utilities && project.newUtilities) {
    utilities =
      utilitiesAnnualCost(project.newUtilities) -
      utilitiesAnnualCost(project.utilities);
  }

  const wasteHauling = wasteHaulingAnnualCost(project);

  const total =
    additionalCosts +
    reusableProducts +
    singleUseProducts +
    utilities +
    wasteHauling;

  return {
    additionalCosts,
    reusableProducts,
    singleUseProducts,
    utilities,
    wasteHauling,
    total,
  };
}

// =$J5*L5*INDEX(HIDDEN_Purchase_Frequency_Table,MATCH($I5,HIDDEN_Purchase_Frequency_Options,0),2)
function singleUseAnnualCost(item: {
  caseCost: number;
  caseCount: number;
  frequency: Frequency;
}) {
  const frequencyVal = getAnnualOccurence(item.frequency);
  return item.caseCost * item.caseCount * frequencyVal;
}

function utilitiesAnnualCost(utilities: UtilitiesAndCosts) {
  return (
    12 * (utilities.gasCost + utilities.electricCost + utilities.waterCost)
  );
}

function dishwasherAnnualCost(
  dishwasher: DishWasher,
  rates: CalculatorInput["utilityRates"]
) {
  // calculate HIDDEN: Dishwasher Calculations'!C85
  const usageConfig = ANNUAL_DISHWASHER_CONSUMPTION.find((conf) => {
    return (
      dishwasher.temperature === conf.temperature &&
      dishwasher.type === conf.type &&
      dishwasher.energyStarCertified === conf.energyStar
    );
  });
  const electricUsage = usageConfig ? usageConfig.electric : 0;
  const electricCost = electricUsage * rates.electric;
  const gasUsage = usageConfig ? usageConfig.gas : 0;
  const gasCost = gasUsage * rates.gas;
  const waterUsage = usageConfig ? usageConfig.water : 0;
  const waterCost = (waterUsage * rates.water) / 1000;

  return electricCost + gasCost + waterCost;
}

function wasteHaulingAnnualCost(project: CalculatorInput) {
  const baseWasteHaulingCost = project.wasteHauling.reduce(
    (sum, item) => sum + item.monthlyCost,
    0
  );
  const newWasteHaulingCost = project.wasteHauling.reduce(
    (sum, item) => sum + item.monthlyCost,
    0
  );
  return 12 * (newWasteHaulingCost - baseWasteHaulingCost);
}

/**
 * One time costs
 */

// all values in dollars
interface OneTimeCosts {
  additionalCosts: number;
  reusableProductCosts: number;
  total: number; // E38
}

function calculateOneTimeCosts(project: CalculatorInput): OneTimeCosts {
  const additionalCosts = project.additionalCosts
    .filter((cost) => cost.frequency === "One Time")
    .reduce((sum, item) => sum + item.cost, 0);

  const reusableProductCosts = project.reusableItems.reduce((sum, item) => {
    return sum + item.caseCost * item.caseCount;
  }, 0);

  return {
    additionalCosts,
    reusableProductCosts,
    total: additionalCosts + reusableProductCosts,
  };
}

/**
 * Financial Summary
 */

interface FinancialSummary {
  annualCost: number;
  annualROIPercent: number;
  oneTimeCost: number;
  paybackPeriodsMonths: number;
}

function calculateSummary(project: CalculatorInput): FinancialSummary {
  const annualCost = calculateAnnualCosts(project).total;
  const oneTimeCost = calculateOneTimeCosts(project).total;

  // =IF(E31<0,ROUND((E38/-E46)*12,1),"--")
  let paybackPeriodsMonths: number = -1; // Ask Sam: what should UI look like if payback period is -1?
  if (annualCost < 0) {
    paybackPeriodsMonths = (oneTimeCost / -1) * annualCost * 12;
  }

  // =IF(E38<>0,IF(E38+E46>0,"0%",(-E46-E38)/E38),"0%")
  let annualROIPercent: number;
  if (oneTimeCost !== 0) {
    if (oneTimeCost + annualCost > 0) {
      annualROIPercent = 0;
    } else {
      annualROIPercent = (-1 * annualCost - oneTimeCost) / oneTimeCost;
    }
  } else {
    annualROIPercent = 0;
  }
  return {
    annualCost,
    annualROIPercent,
    oneTimeCost,
    paybackPeriodsMonths,
  };
}
