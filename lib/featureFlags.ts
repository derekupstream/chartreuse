const madhaviOrgId = '52490efb-743d-40a4-9b45-dcee0eba40be';
const eugeneOrgId = '3f42a5c7-0fdd-436a-983b-6067a3804ef4';

export function isEventProjectsEnabled({ id, isUpstream }: { id: string; isUpstream: boolean }) {
  if (id === eugeneOrgId || id === madhaviOrgId) {
    return true;
  }
  return isUpstream || process.env.NODE_ENV === 'development';
}

export function isEugeneOrg({ id }: { id: string }) {
  if (id === eugeneOrgId) {
    return true;
  }
  return false; // process.env.NODE_ENV === 'development';
}
