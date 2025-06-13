import prisma from './prisma';

const madhaviOrgId = '52490efb-743d-40a4-9b45-dcee0eba40be';
const eugeneOrgId = '3f42a5c7-0fdd-436a-983b-6067a3804ef4';

export function isEventProjectsEnabled({ id, isUpstream }: { id: string; isUpstream: boolean }) {
  if (id === eugeneOrgId || id === madhaviOrgId) {
    return true;
  }
  return isUpstream;
}

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
