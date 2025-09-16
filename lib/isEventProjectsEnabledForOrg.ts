import prisma from './prisma';
import { isEventProjectsEnabled } from './featureFlags';

export async function isEventProjectsEnabledForOrg({ orgId }: { orgId: string }) {
  const org = await prisma.org.findUnique({
    where: {
      id: orgId
    }
  });
  if (!org) {
    return false;
  }
  return isEventProjectsEnabled({ id: org.id, isUpstream: org.isUpstream });
}
