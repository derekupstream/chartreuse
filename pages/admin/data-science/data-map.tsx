import { useState } from 'react';

import { Segmented, Tabs, Typography } from 'antd';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';

import { ActualsGraph } from 'components/admin/data-map/ActualsGraph';
import { FeedPanel } from 'components/admin/data-map/FeedPanel';
import { PlaygroundPanel } from 'components/admin/data-map/PlaygroundPanel';
import type { ProjectRow } from 'components/admin/data-map/ProjectsFeedPanel';
import { ProjectionsGraph } from 'components/admin/data-map/ProjectionsGraph';
import { SystemGraph } from 'components/admin/data-map/SystemGraph';
import { TraceGraph } from 'components/admin/data-map/TraceGraph';
import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { getUserFromContext } from 'lib/middleware';
import { ACCESS_DENIED_REDIRECT, checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';
import type { PageProps } from 'pages/_app';

type DataMapMode = 'system' | 'rsp' | 'actuals' | 'projections';

type Props = {
  user: DashboardUser;
  projects: ProjectRow[];
};

export default function DataMapPage({ user, projects }: Props) {
  const router = useRouter();
  const mode = ((router.query.mode as DataMapMode | undefined) ?? 'system') as DataMapMode;

  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [rspActiveTab, setRspActiveTab] = useState('feed');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  function handleIngest(newPeriodId: string) {
    setSelectedPeriodId(newPeriodId);
    setRspActiveTab('feed');
  }

  function setMode(m: DataMapMode) {
    void router.push({ query: { ...router.query, mode: m } }, undefined, { shallow: true });
    setSelectedPeriodId(null);
    setSelectedProjectId(null);
  }

  const feedContent = (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px - 46px - 46px)', overflow: 'hidden' }}>
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
      <div style={{ padding: '8px 16px', borderBottom: '1px solid #f0f0f0' }}>
        <Segmented
          value={mode}
          onChange={v => setMode(v as DataMapMode)}
          options={[
            { label: 'System', value: 'system' },
            { label: 'RSP API', value: 'rsp' },
            { label: 'Actuals', value: 'actuals' },
            { label: 'Projections', value: 'projections' }
          ]}
        />
      </div>
      {mode === 'system' && <SystemGraph />}
      {mode === 'rsp' && (
        <Tabs
          activeKey={rspActiveTab}
          onChange={setRspActiveTab}
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
      )}
      {mode === 'actuals' && (
        <ActualsGraph
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
        />
      )}
      {mode === 'projections' && (
        <ProjectionsGraph
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
        />
      )}
    </AdminLayout>
  );
}

DataMapPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => page;

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return ACCESS_DENIED_REDIRECT;
  const isUpstream = await checkIsUpstream(user.org.id);
  if (!isUpstream) return ACCESS_DENIED_REDIRECT;

  const rawProjects = await prisma.project.findMany({
    where: { NOT: { isTemplate: true } },
    select: {
      id: true,
      name: true,
      category: true,
      updatedAt: true,
      org: { select: { id: true, name: true } },
      _count: { select: { singleUseItems: true, reusableItems: true, milestones: true } }
    },
    orderBy: { updatedAt: 'desc' },
    take: 1000
  });

  return { props: serializeJSON({ user, projects: rawProjects }) };
};
