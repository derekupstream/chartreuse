import type { GetServerSideProps } from 'next';

import { HowTo } from 'components/admin/HowTo';
import { SmartFieldBuilder } from 'components/admin/SmartFieldBuilder';
import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { getUserFromContext } from 'lib/middleware';
import { ACCESS_DENIED_REDIRECT, checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return ACCESS_DENIED_REDIRECT;
  if (!(await checkIsUpstream(user.org.id))) return ACCESS_DENIED_REDIRECT;
  return { props: serializeJSON({ user }) };
};

export default function SmartFieldsPage({ user }: { user: DashboardUser }) {
  return (
    <AdminLayout title='Smart Fields' selectedMenuItem='data-science/smart-fields' user={user}>
      <HowTo tool='smart-fields' />
      <SmartFieldBuilder />
    </AdminLayout>
  );
}
