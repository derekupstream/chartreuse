import prisma from 'lib/prisma';

export async function getInputIssueCount(): Promise<number> {
  // Find project IDs with any data quality issue
  const [noStateProjects, noSingleUseProjects, noReusableProjects, zeroUnitProjects] = await Promise.all([
    // Projects with no USState set
    prisma.project.findMany({
      where: { USState: null },
      select: { id: true }
    }),
    // Projects with no single-use line items
    prisma.project.findMany({
      where: { singleUseItems: { none: {} } },
      select: { id: true }
    }),
    // Projects with no reusable line items
    prisma.project.findMany({
      where: { reusableItems: { none: {} } },
      select: { id: true }
    }),
    // Projects with at least one zero-unit single-use line item
    prisma.project.findMany({
      where: { singleUseItems: { some: { unitsPerCase: 0 } } },
      select: { id: true }
    })
  ]);

  const issueIds = new Set<string>([
    ...noStateProjects.map(p => p.id),
    ...noSingleUseProjects.map(p => p.id),
    ...noReusableProjects.map(p => p.id),
    ...zeroUnitProjects.map(p => p.id)
  ]);

  return issueIds.size;
}
