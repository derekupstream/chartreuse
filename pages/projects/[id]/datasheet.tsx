import { ArrowLeftOutlined, DownloadOutlined } from '@ant-design/icons';
import { Alert, Button, Table, Tag, Typography } from 'antd';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';

import { BaseLayout } from 'layouts/BaseLayout';
import type { DashboardUser } from 'interfaces';
import { getUserFromContext } from 'lib/middleware';
import { ACCESS_DENIED_REDIRECT, checkIsUpstream } from 'lib/middleware/requireUpstream';
import { getProjectInventory } from 'lib/inventory/getProjectInventory';
import { getProjectDatasheet } from 'lib/calculator/trace/getProjectDatasheet';
import type { ProjectDatasheet, DatasheetRow } from 'lib/calculator/trace/getProjectDatasheet';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';

type Props = {
  user: DashboardUser;
  projectName: string;
  projectId: string;
  datasheet: ProjectDatasheet;
};

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return ACCESS_DENIED_REDIRECT;
  if (!(await checkIsUpstream(user.org.id))) return ACCESS_DENIED_REDIRECT;

  const projectId = context.query.id as string;
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { name: true } });
  if (!project) return { notFound: true };

  const inventory = await getProjectInventory(projectId);
  const datasheet = getProjectDatasheet(inventory);

  return { props: serializeJSON({ user, projectName: project.name, projectId, datasheet }) };
};

/** Column groups mirror how a model is built in a spreadsheet, left to right. */
const GROUPS: {
  title: string;
  color: string;
  cols: { key: keyof DatasheetRow; label: string; decimals?: number }[];
}[] = [
  {
    title: 'What was entered',
    color: '#e6f4ff',
    cols: [
      { key: 'unitsPerCase', label: 'units/case' },
      { key: 'casesPurchased', label: 'cases' },
      { key: 'caseCost', label: 'cost/case', decimals: 2 },
      { key: 'frequency', label: 'frequency' },
      { key: 'forecastCases', label: 'forecast cases' },
      { key: 'annualItems', label: 'annual items' },
      { key: 'forecastItems', label: 'forecast items' }
    ]
  },
  {
    title: 'From the product catalog',
    color: '#f6ffed',
    cols: [
      { key: 'primaryMaterial', label: 'primary material' },
      { key: 'primaryLbPerItem', label: 'primary lb/item', decimals: 6 },
      { key: 'secondaryMaterial', label: 'secondary material' },
      { key: 'secondaryLbPerItem', label: 'secondary lb/item', decimals: 6 },
      { key: 'itemWeightLb', label: 'item weight lb', decimals: 6 },
      { key: 'boxLbPerCase', label: 'box lb/case', decimals: 6 },
      { key: 'boxLbPerItem', label: 'box lb/item', decimals: 6 }
    ]
  },
  {
    title: 'Factors applied',
    color: '#fff7e6',
    cols: [
      { key: 'primaryGhgFactor', label: 'primary GHG/lb', decimals: 6 },
      { key: 'secondaryGhgFactor', label: 'secondary GHG/lb', decimals: 6 },
      { key: 'cardboardGhgFactor', label: 'cardboard GHG/lb', decimals: 6 },
      { key: 'freightGhgFactor', label: 'freight GHG/lb', decimals: 8 },
      { key: 'primaryWaterFactor', label: 'primary gal/lb', decimals: 4 },
      { key: 'secondaryWaterFactor', label: 'secondary gal/lb', decimals: 4 }
    ]
  },
  {
    title: 'Mass (lb)',
    color: '#f9f0ff',
    cols: [
      { key: 'productMassLb', label: 'product', decimals: 1 },
      { key: 'boxMassLb', label: 'shipping box', decimals: 1 },
      { key: 'boxMassLbPerItemMethod', label: 'box (per-item method)', decimals: 1 },
      { key: 'massBaselineLb', label: 'baseline total', decimals: 1 },
      { key: 'massForecastLb', label: 'forecast total', decimals: 1 }
    ]
  },
  {
    title: 'GHG (MTCO2e)',
    color: '#fff1f0',
    cols: [
      { key: 'ghgPrimaryBaseline', label: 'primary', decimals: 4 },
      { key: 'ghgSecondaryBaseline', label: 'secondary', decimals: 4 },
      { key: 'ghgShippingBoxBaseline', label: 'shipping box', decimals: 4 },
      { key: 'ghgBaseline', label: 'baseline total', decimals: 4 },
      { key: 'ghgForecast', label: 'forecast total', decimals: 4 }
    ]
  },
  {
    title: 'Water (gal)',
    color: '#e6fffb',
    cols: [
      { key: 'waterPrimaryBaseline', label: 'primary', decimals: 0 },
      { key: 'waterSecondaryBaseline', label: 'secondary', decimals: 0 },
      { key: 'waterShippingBoxBaseline', label: 'shipping box', decimals: 0 },
      { key: 'waterBaseline', label: 'baseline total', decimals: 0 },
      { key: 'waterForecast', label: 'forecast total', decimals: 0 }
    ]
  },
  { title: 'Cost', color: '#fafafa', cols: [{ key: 'annualCost', label: 'annual cost', decimals: 2 }] }
];

const fmt = (v: unknown, decimals?: number) =>
  typeof v === 'number' ? v.toLocaleString(undefined, { maximumFractionDigits: decimals ?? 0 }) : String(v ?? '');

function toCsv(datasheet: ProjectDatasheet): string {
  const flat = GROUPS.flatMap(g => g.cols.map(c => ({ ...c, group: g.title })));
  const header1 = ['', '', ''].concat(flat.map(c => c.group));
  const header2 = ['type', 'product id', 'description'].concat(flat.map(c => c.label));
  const lines = [header1, header2].map(r => r.map(v => `"${v}"`).join(','));
  for (const row of datasheet.rows) {
    lines.push(
      [row.kind, row.productId, row.description]
        .concat(flat.map(c => String(row[c.key] ?? '')))
        .map(v => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
  }
  return lines.join('\n');
}

export default function DatasheetPage({ user, projectName, projectId, datasheet }: Props) {
  const columns: any[] = [
    {
      title: 'Line item',
      fixed: 'left' as const,
      children: [
        {
          title: 'type',
          dataIndex: 'kind',
          fixed: 'left' as const,
          width: 100,
          render: (v: string) => <Tag color={v === 'Reusable' ? 'green' : 'blue'}>{v}</Tag>
        },
        { title: 'id', dataIndex: 'productId', fixed: 'left' as const, width: 60 },
        { title: 'description', dataIndex: 'description', fixed: 'left' as const, width: 200 },
        {
          title: 'note',
          dataIndex: 'note',
          width: 150,
          render: (v: string) =>
            v ? (
              <Typography.Text type='secondary' style={{ fontSize: 11 }}>
                {v}
              </Typography.Text>
            ) : null
        }
      ]
    },
    ...GROUPS.map(group => ({
      title: group.title,
      children: group.cols.map(col => ({
        title: col.label,
        dataIndex: col.key,
        width: 130,
        align: 'right' as const,
        onCell: () => ({ style: { background: group.color } }),
        render: (v: unknown) => fmt(v, col.decimals)
      }))
    }))
  ];

  function download() {
    const blob = new Blob([toCsv(datasheet)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-datasheet.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <BaseLayout user={user} selectedMenuItem='admin/projects' title={`${projectName} — Datasheet`}>
      <div style={{ padding: '24px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div>
            <Link href={`/projects/${projectId}/projections`}>
              <Typography.Text type='secondary'>
                <ArrowLeftOutlined /> Back to dashboard
              </Typography.Text>
            </Link>
            <Typography.Title level={2} style={{ margin: '4px 0 0' }}>
              {projectName} — Datasheet
            </Typography.Title>
            <Typography.Text type='secondary'>
              Every line item, laid out left to right: what was entered → what the catalog supplied → which factors were
              applied → each intermediate → the outputs.
            </Typography.Text>
          </div>
          <Button icon={<DownloadOutlined />} onClick={download}>
            Download CSV
          </Button>
        </div>

        <Alert
          type='success'
          showIcon
          style={{ margin: '16px 0' }}
          message='These columns come from the calculator itself'
          description={
            <>
              Each computed column calls the same functions that produce the dashboard (
              <code>getLineItemGasEmissions</code>, <code>getLineItemWaterUsage</code>, <code>annualLineItemCost</code>,{' '}
              <code>annualLineItemWeight</code>), so this view cannot drift from the real results. The check below
              confirms the rows still sum to the engine&apos;s project totals.
            </>
          }
        />

        <Table
          size='small'
          bordered
          rowKey={(r: DatasheetRow, i?: number) => `${r.kind}-${r.productId}-${i}`}
          columns={columns}
          dataSource={datasheet.rows}
          pagination={false}
          scroll={{ x: 'max-content' }}
        />

        <Typography.Title level={4} style={{ marginTop: 32 }}>
          Reconciliation
        </Typography.Title>
        <Typography.Paragraph type='secondary' style={{ marginTop: 0 }}>
          Sum of the rows above vs. what the calculator reports for the whole project.
        </Typography.Paragraph>
        <Table
          size='small'
          bordered
          rowKey='label'
          pagination={false}
          dataSource={datasheet.reconciliation}
          columns={[
            { title: 'Metric', dataIndex: 'label' },
            {
              title: 'Sum of rows',
              dataIndex: 'rowSum',
              align: 'right' as const,
              render: (v: number) => fmt(v, 2)
            },
            {
              title: 'Calculator total',
              dataIndex: 'engineTotal',
              align: 'right' as const,
              render: (v: number) => fmt(v, 2)
            },
            {
              title: '',
              dataIndex: 'matches',
              width: 110,
              render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? 'matches' : 'differs'}</Tag>
            }
          ]}
        />

        <Typography.Title level={4} style={{ marginTop: 32 }}>
          Notes on the method
        </Typography.Title>
        <ul style={{ color: 'rgba(0,0,0,0.65)', maxWidth: 900 }}>
          {datasheet.notes.map(note => (
            <li key={note} style={{ marginBottom: 6 }}>
              {note}
            </li>
          ))}
        </ul>
      </div>
    </BaseLayout>
  );
}
