import prisma from 'lib/prisma';

export type IssueInput = {
  issueType: string;
  severity: 'error' | 'warning';
  entity: string; // 'Project' | 'SingleUseLineItem' | 'ReusableLineItem'
  entityId: string; // UUID of the affected record
  details?: Record<string, unknown>;
};

type CheckFn = () => Promise<IssueInput[]>;

// Error checks

async function checkMissingUSState(): Promise<IssueInput[]> {
  const rows = await prisma.project.findMany({
    where: { USState: null },
    select: { id: true }
  });
  return rows.map(row => ({
    issueType: 'missing_us_state',
    severity: 'error',
    entity: 'Project',
    entityId: row.id
  }));
}

async function checkMissingSingleUseItems(): Promise<IssueInput[]> {
  const rows = await prisma.project.findMany({
    where: { singleUseItems: { none: {} } },
    select: { id: true }
  });
  return rows.map(row => ({
    issueType: 'missing_single_use_items',
    severity: 'error',
    entity: 'Project',
    entityId: row.id
  }));
}

async function checkMissingReusableItems(): Promise<IssueInput[]> {
  const rows = await prisma.project.findMany({
    where: { reusableItems: { none: {} } },
    select: { id: true }
  });
  return rows.map(row => ({
    issueType: 'missing_reusable_items',
    severity: 'error',
    entity: 'Project',
    entityId: row.id
  }));
}

async function checkZeroUnitLineItems(): Promise<IssueInput[]> {
  const rows = await prisma.singleUseLineItem.findMany({
    where: { unitsPerCase: 0 },
    select: { id: true }
  });
  return rows.map(row => ({
    issueType: 'zero_unit_line_item',
    severity: 'error',
    entity: 'SingleUseLineItem',
    entityId: row.id
  }));
}

// Warning checks

async function checkReturnRateOver100(): Promise<IssueInput[]> {
  const rows = await prisma.reusableLineItem.findMany({
    where: { annualRepurchasePercentage: { gt: 100 } },
    select: { id: true, annualRepurchasePercentage: true }
  });
  return rows.map(row => ({
    issueType: 'return_rate_over_100',
    severity: 'warning',
    entity: 'ReusableLineItem',
    entityId: row.id,
    details: { annualRepurchasePercentage: row.annualRepurchasePercentage }
  }));
}

async function checkReusableNegativeCaseCost(): Promise<IssueInput[]> {
  const rows = await prisma.reusableLineItem.findMany({
    where: { caseCost: { lt: 0 } },
    select: { id: true, caseCost: true }
  });
  return rows.map(row => ({
    issueType: 'reusable_negative_case_cost',
    severity: 'warning',
    entity: 'ReusableLineItem',
    entityId: row.id,
    details: { caseCost: row.caseCost }
  }));
}

async function checkUnrealisticCaseCost(): Promise<IssueInput[]> {
  const rows = await prisma.reusableLineItem.findMany({
    where: { caseCost: { gt: 1_000_000_000 } },
    select: { id: true, caseCost: true }
  });
  return rows.map(row => ({
    issueType: 'unrealistic_case_cost',
    severity: 'warning',
    entity: 'ReusableLineItem',
    entityId: row.id,
    details: { caseCost: row.caseCost }
  }));
}

async function checkSingleUseNegativeCaseCost(): Promise<IssueInput[]> {
  const rows = await prisma.singleUseLineItem.findMany({
    where: { caseCost: { lt: 0 } },
    select: { id: true, caseCost: true }
  });
  return rows.map(row => ({
    issueType: 'single_use_negative_case_cost',
    severity: 'warning',
    entity: 'SingleUseLineItem',
    entityId: row.id,
    details: { caseCost: row.caseCost }
  }));
}

async function checkNegativeQuantity(): Promise<IssueInput[]> {
  const rows = await prisma.reusableLineItem.findMany({
    where: { casesPurchased: { lt: 0 } },
    select: { id: true, casesPurchased: true }
  });
  return rows.map(row => ({
    issueType: 'negative_quantity',
    severity: 'warning',
    entity: 'ReusableLineItem',
    entityId: row.id,
    details: { casesPurchased: row.casesPurchased }
  }));
}

const CHECKS: CheckFn[] = [
  checkMissingUSState,
  checkMissingSingleUseItems,
  checkMissingReusableItems,
  checkZeroUnitLineItems,
  checkReturnRateOver100,
  checkReusableNegativeCaseCost,
  checkUnrealisticCaseCost,
  checkSingleUseNegativeCaseCost,
  checkNegativeQuantity
];

export async function runDataHealthScan(): Promise<IssueInput[]> {
  const results = await Promise.all(CHECKS.map(fn => fn()));
  return results.flat();
}
