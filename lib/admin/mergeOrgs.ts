import type { PrismaClient } from '@prisma/client';

export type MergeResult = {
  sourceOrgId: string;
  targetOrgId: string;
  moved: Record<string, number>;
};

/**
 * Reattaches every Org-scoped row from `sourceOrgId` to `targetOrgId`, then deletes the source org.
 * Wrapped in a transaction so a failure leaves no partial moves.
 *
 * Models touched: User, Account, Account.rspOrgId, Project, Invite, ProjectTag,
 * RspApiKey, UsageTimePeriod, ComputeRun, MetricResult.
 */
export async function mergeOrg(prisma: PrismaClient, sourceOrgId: string, targetOrgId: string): Promise<MergeResult> {
  if (sourceOrgId === targetOrgId) {
    throw new Error('source and target must differ');
  }

  return prisma.$transaction(async tx => {
    const [source, target] = await Promise.all([
      tx.org.findUnique({ where: { id: sourceOrgId }, select: { id: true } }),
      tx.org.findUnique({ where: { id: targetOrgId }, select: { id: true } })
    ]);
    if (!source) throw new Error(`source org ${sourceOrgId} not found`);
    if (!target) throw new Error(`target org ${targetOrgId} not found`);

    const moved: Record<string, number> = {};
    moved.users = (await tx.user.updateMany({ where: { orgId: sourceOrgId }, data: { orgId: targetOrgId } })).count;
    moved.accounts = (
      await tx.account.updateMany({ where: { orgId: sourceOrgId }, data: { orgId: targetOrgId } })
    ).count;
    moved.projects = (
      await tx.project.updateMany({ where: { orgId: sourceOrgId }, data: { orgId: targetOrgId } })
    ).count;
    moved.invites = (await tx.invite.updateMany({ where: { orgId: sourceOrgId }, data: { orgId: targetOrgId } })).count;
    moved.projectTags = (
      await tx.projectTag.updateMany({ where: { orgId: sourceOrgId }, data: { orgId: targetOrgId } })
    ).count;
    moved.rspApiKeys = (
      await tx.rspApiKey.updateMany({ where: { orgId: sourceOrgId }, data: { orgId: targetOrgId } })
    ).count;
    moved.usagePeriods = (
      await tx.usageTimePeriod.updateMany({ where: { orgId: sourceOrgId }, data: { orgId: targetOrgId } })
    ).count;
    moved.computeRuns = (
      await tx.computeRun.updateMany({ where: { orgId: sourceOrgId }, data: { orgId: targetOrgId } })
    ).count;
    moved.metricResults = (
      await tx.metricResult.updateMany({ where: { orgId: sourceOrgId }, data: { orgId: targetOrgId } })
    ).count;
    moved.rspClientLinks = (
      await tx.account.updateMany({ where: { rspOrgId: sourceOrgId }, data: { rspOrgId: targetOrgId } })
    ).count;

    await tx.org.delete({ where: { id: sourceOrgId } });

    return { sourceOrgId, targetOrgId, moved };
  });
}

export async function deleteEmptyOrg(prisma: PrismaClient, orgId: string): Promise<void> {
  const counts = await prisma.org.findUnique({
    where: { id: orgId },
    select: { _count: { select: { users: true, accounts: true, projects: true, invites: true } } }
  });
  if (!counts) throw new Error(`org ${orgId} not found`);
  const c = counts._count;
  if (c.users > 0 || c.accounts > 0 || c.projects > 0 || c.invites > 0) {
    throw new Error(
      `org ${orgId} is not empty (users=${c.users}, accounts=${c.accounts}, projects=${c.projects}, invites=${c.invites})`
    );
  }
  await prisma.org.delete({ where: { id: orgId } });
}
