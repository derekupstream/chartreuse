/**
 * Methodology — literal versions, not a hub of links.
 *
 * The methodologies Chart-Reuse has shipped, each with the database versions it stands on
 * and the append-only log of every edit and change beneath it. Version 1.0 is the legacy
 * engine (what production runs today); version 2.0 is the Combined Data & Calculation
 * Model. Snapshots are cut automatically whenever a factors table changes.
 */
import { BranchesOutlined } from '@ant-design/icons';
import { Card, Col, Row, Table, Tag, Typography } from 'antd';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';

import { LocalDate } from 'components/common/LocalDate';
import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { getUserFromContext } from 'lib/middleware';
import { ACCESS_DENIED_REDIRECT, checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';
import type { PageProps } from 'pages/_app';

const { Title, Text, Paragraph } = Typography;

type DbVersion = { name: string; version: string; kind: string };
type SnapshotRow = {
  id: string;
  name: string;
  notes: string | null;
  status: string;
  createdAt: string;
  databaseVersions: DbVersion[] | null;
};
type ChangeRow = {
  id: string;
  createdAt: string;
  databaseName: string;
  action: string;
  versionBefore: string | null;
  versionAfter: string;
  rowsAdded: number;
  rowsUpdated: number;
  rowsRemoved: number;
  sourceNote: string | null;
};

type Props = {
  user: DashboardUser;
  currentDatabases: DbVersion[];
  projectsOn10: number;
  projectsOn20: number;
  snapshots: SnapshotRow[];
  changes: ChangeRow[];
};

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return ACCESS_DENIED_REDIRECT;
  if (!(await checkIsUpstream(user.org.id))) return ACCESS_DENIED_REDIRECT;

  const [databases, snapshots, changes, projectsOn10, projectsOn20] = await Promise.all([
    prisma.factorDatabase.findMany({
      select: { name: true, version: true, kind: true },
      orderBy: [{ kind: 'desc' }, { name: 'asc' }]
    }),
    prisma.methodologySnapshot.findMany({
      orderBy: { createdAt: 'desc' },
      take: 25,
      select: { id: true, name: true, notes: true, status: true, createdAt: true, databaseVersionsJson: true }
    }),
    prisma.factorDatabaseChange.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { database: { select: { name: true } } }
    }),
    prisma.project.count({ where: { methodologyVersion: '1.0' } }),
    prisma.project.count({ where: { methodologyVersion: { not: '1.0' } } })
  ]);

  return {
    props: serializeJSON({
      user,
      currentDatabases: databases,
      projectsOn10,
      projectsOn20,
      snapshots: snapshots.map(s => ({
        id: s.id,
        name: s.name,
        notes: s.notes,
        status: s.status,
        createdAt: s.createdAt.toISOString(),
        databaseVersions: Array.isArray(s.databaseVersionsJson) ? s.databaseVersionsJson : null
      })),
      changes: changes.map(c => ({
        id: c.id,
        createdAt: c.createdAt.toISOString(),
        databaseName: c.database.name,
        action: c.action,
        versionBefore: c.versionBefore,
        versionAfter: c.versionAfter,
        rowsAdded: c.rowsAdded,
        rowsUpdated: c.rowsUpdated,
        rowsRemoved: c.rowsRemoved,
        sourceNote: c.sourceNote
      }))
    })
  };
};

export default function MethodologyVersions({
  currentDatabases,
  projectsOn10,
  projectsOn20,
  snapshots,
  changes
}: Props) {
  const factorDbs = currentDatabases.filter(d => d.kind === 'factors');

  return (
    <>
      <Title level={2} style={{ marginBottom: 0 }}>
        <BranchesOutlined /> Methodology
      </Title>
      <Paragraph type='secondary' style={{ maxWidth: 740 }}>
        Chart-Reuse methodologies are versioned like software releases: MAJOR when the method changes, MINOR when factor
        values change, PATCH for corrections. Every projection is stamped with the version that produced it, and
        projects stay pinned to their version until deliberately upgraded (see <Text code>docs/VERSIONING.md</Text>).
      </Paragraph>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <Card
            size='small'
            title={
              <>
                Methodology <Text code>2.0</Text> — Combined Data &amp; Calculation Model{' '}
                <Tag color='green'>current on this branch</Tag>
              </>
            }
          >
            <Paragraph type='secondary' style={{ fontSize: 13 }}>
              Madhavi&apos;s Combined Model implemented as the v2 engine, computed from the versioned Data Release
              tables below. Verified continuously on <Link href='/admin/data-science/quality'>Validation</Link>.
            </Paragraph>
            <Table
              size='small'
              rowKey='name'
              pagination={false}
              dataSource={factorDbs}
              columns={[
                { title: 'Factors database', dataIndex: 'name' },
                {
                  title: 'Version',
                  dataIndex: 'version',
                  width: 90,
                  render: (v: string) => <Text strong>{v}</Text>
                }
              ]}
            />
            <Text type='secondary' style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
              {projectsOn20 ? `${projectsOn20} projects` : 'No projects yet'} on 2.0 · written methodology:{' '}
              <Link href='/admin/methodology'>Methodology Document</Link>
            </Text>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            size='small'
            title={
              <>
                Methodology <Text code>1.0</Text> — Legacy engine <Tag>production</Tag>
              </>
            }
          >
            <Paragraph type='secondary' style={{ fontSize: 13 }}>
              The original calculator (<Text code>lib/calculator/getProjections.ts</Text>), factors compiled into the
              code. Snapshotted as &quot;Methodology 1.0 — legacy engine&quot; so its state stays citable forever.
            </Paragraph>
            <Text style={{ fontSize: 13 }}>
              <strong>{projectsOn10}</strong> projects pinned to 1.0 — they keep producing identical numbers until each
              is deliberately upgraded, with the change disclosed.
            </Text>
          </Card>
        </Col>
      </Row>

      <Card
        size='small'
        title={`Change log — every recorded edit, newest first (${changes.length} shown)`}
        style={{ marginBottom: 16 }}
      >
        <Table
          size='small'
          rowKey='id'
          pagination={changes.length > 12 ? { pageSize: 12 } : false}
          dataSource={changes}
          columns={[
            {
              title: 'When',
              dataIndex: 'createdAt',
              width: 165,
              render: (v: string) => <LocalDate iso={v} />
            },
            { title: 'Database', dataIndex: 'databaseName', width: 190 },
            { title: 'Action', dataIndex: 'action', width: 90, render: (v: string) => <Tag>{v}</Tag> },
            {
              title: 'Version',
              width: 120,
              render: (_: unknown, c: ChangeRow) => (
                <Text code>
                  {c.versionBefore && c.versionBefore !== c.versionAfter
                    ? `${c.versionBefore} → ${c.versionAfter}`
                    : c.versionAfter}
                </Text>
              )
            },
            {
              title: 'Rows',
              render: (_: unknown, c: ChangeRow) =>
                [
                  c.rowsAdded ? `+${c.rowsAdded}` : null,
                  c.rowsUpdated ? `${c.rowsUpdated} updated` : null,
                  c.rowsRemoved ? `−${c.rowsRemoved}` : null
                ]
                  .filter(Boolean)
                  .join(' · ') || '—'
            },
            {
              title: 'Source',
              dataIndex: 'sourceNote',
              ellipsis: true,
              render: (v: string | null) => v ?? '—'
            }
          ]}
        />
      </Card>

      <Card size='small' title='Snapshots — the durable record cut automatically whenever factors change'>
        <Table
          size='small'
          rowKey='id'
          pagination={snapshots.length > 8 ? { pageSize: 8 } : false}
          dataSource={snapshots}
          columns={[
            {
              title: 'When',
              dataIndex: 'createdAt',
              width: 165,
              render: (v: string) => <LocalDate iso={v} />
            },
            { title: 'Snapshot', dataIndex: 'name' },
            {
              title: 'Databases captured',
              width: 160,
              render: (_: unknown, s: SnapshotRow) =>
                s.databaseVersions ? `${s.databaseVersions.length} versions recorded` : '—'
            },
            {
              title: 'Status',
              dataIndex: 'status',
              width: 100,
              render: (v: string) => <Tag color={v === 'published' ? 'green' : undefined}>{v}</Tag>
            }
          ]}
          expandable={{
            rowExpandable: s => !!s.notes || !!s.databaseVersions,
            expandedRowRender: s => (
              <>
                {s.notes && (
                  <Paragraph type='secondary' style={{ fontSize: 12 }}>
                    {s.notes}
                  </Paragraph>
                )}
                {s.databaseVersions && (
                  <Text type='secondary' style={{ fontSize: 12 }}>
                    {s.databaseVersions.map(d => `${d.name} ${d.version}`).join(' · ')}
                  </Text>
                )}
              </>
            )
          }}
        />
        <Text type='secondary' style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
          Pending value changes are reviewed in <Link href='/admin/data-science/change-requests'>Change Requests</Link>;
          raw snapshot management lives in <Link href='/admin/data-science/snapshots'>Snapshots</Link> under Advanced.
        </Text>
      </Card>
    </>
  );
}

MethodologyVersions.getLayout = (page: React.ReactNode, pageProps: PageProps) => (
  <AdminLayout {...(pageProps as any)} selectedMenuItem='data-science/methodology-hub' title='Methodology'>
    {page}
  </AdminLayout>
);
