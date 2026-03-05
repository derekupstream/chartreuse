import { useState } from 'react';

import { Tabs, Typography } from 'antd';
import type { GetServerSideProps } from 'next';

import { FeedPanel } from 'components/admin/data-map/FeedPanel';
import { PlaygroundPanel } from 'components/admin/data-map/PlaygroundPanel';
import { TraceGraph } from 'components/admin/data-map/TraceGraph';
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
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('feed');

  function handleIngest(newPeriodId: string) {
    setSelectedPeriodId(newPeriodId);
    setActiveTab('feed');
  }

  const feedContent = (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px - 46px)', overflow: 'hidden' }}>
      {/* Left feed panel — 40% */}
      <div
        style={{
          width: '40%',
          borderRight: '1px solid #f0f0f0',
          overflow: 'auto',
          padding: '16px'
        }}
      >
        <Typography.Title level={4} style={{ marginTop: 0 }}>
          RSP Ingestion Feed
        </Typography.Title>
        <FeedPanel selectedId={selectedPeriodId} onSelect={setSelectedPeriodId} />
      </div>
      {/* Right graph panel — 60% */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {selectedPeriodId ? (
          <TraceGraph selectedId={selectedPeriodId} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography.Text type='secondary'>Select an ingestion from the feed to view its trace</Typography.Text>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <AdminLayout title='Data Map' selectedMenuItem='data-science/data-map' user={user}>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{ height: '100%' }}
        tabBarStyle={{ marginBottom: 0, paddingLeft: 16 }}
        items={[
          {
            key: 'feed',
            label: 'RSP Ingestion Feed',
            children: feedContent
          },
          {
            key: 'playground',
            label: 'API Playground',
            children: <PlaygroundPanel onIngest={handleIngest} />
          }
        ]}
      />
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
