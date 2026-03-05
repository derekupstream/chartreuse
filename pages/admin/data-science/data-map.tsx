import { Typography } from 'antd';
import type { GetServerSideProps } from 'next';

import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { getUserFromContext } from 'lib/middleware';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';
import type { PageProps } from 'pages/_app';

type Props = {
  user: DashboardUser;
};

export default function DataMapPage({ user }: Props) {
  return (
    <AdminLayout title='Data Map' selectedMenuItem='data-science/data-map' user={user}>
      <div style={{ padding: '24px' }}>
        <Typography.Title level={2}>Data Map</Typography.Title>
        <Typography.Text type='secondary'>RSP ingestion feed and provenance graph</Typography.Text>
      </div>
    </AdminLayout>
  );
}

DataMapPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => page;

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return { notFound: true };
  const isUpstream = await checkIsUpstream(user.org.id);
  if (!isUpstream) return { notFound: true };
  return { props: serializeJSON({ user }) };
};
