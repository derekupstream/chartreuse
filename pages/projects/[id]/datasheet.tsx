import { ArrowLeftOutlined, DownloadOutlined, FunctionOutlined } from '@ant-design/icons';
import { Alert, Button, Table, Tabs, Tag, Typography } from 'antd';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useState } from 'react';

import { BaseLayout } from 'layouts/BaseLayout';
import type { DashboardUser } from 'interfaces';
import { getUserFromContext } from 'lib/middleware';
import { ACCESS_DENIED_REDIRECT, checkIsUpstream } from 'lib/middleware/requireUpstream';
import { getProjectInventory } from 'lib/inventory/getProjectInventory';
import { getProjectDatasheet } from 'lib/calculator/trace/getProjectDatasheet';
import type { ProjectDatasheet, DatasheetRow, DishwasherRow, CostRow } from 'lib/calculator/trace/getProjectDatasheet';
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

const DISHWASHER_COLS: { key: keyof DishwasherRow; label: string; decimals?: number; group: string }[] = [
  { key: 'type', label: 'type', group: 'Machine' },
  { key: 'temperature', label: 'temperature', group: 'Machine' },
  { key: 'energyStar', label: 'Energy Star', group: 'Machine' },
  { key: 'buildingWaterHeater', label: 'water heater', group: 'Machine' },
  { key: 'boosterWaterHeater', label: 'booster', group: 'Machine' },
  { key: 'racksPerDay', label: 'racks/day', group: 'Use — baseline' },
  { key: 'operatingDays', label: 'days/year', group: 'Use — baseline' },
  { key: 'newRacksPerDay', label: 'racks/day', group: 'Use — forecast' },
  { key: 'newOperatingDays', label: 'days/year', group: 'Use — forecast' },
  { key: 'electricRate', label: 'electric $/kWh', decimals: 4, group: 'Rates' },
  { key: 'gasRate', label: 'gas $/therm', decimals: 4, group: 'Rates' },
  { key: 'waterRate', label: 'water $/gal', decimals: 6, group: 'Rates' },
  { key: 'electricUsageBaseline', label: 'electric kWh', decimals: 0, group: 'Usage — baseline' },
  { key: 'gasUsageBaseline', label: 'gas therms', decimals: 1, group: 'Usage — baseline' },
  { key: 'waterUsageBaseline', label: 'water gal', decimals: 0, group: 'Usage — baseline' },
  { key: 'electricUsageForecast', label: 'electric kWh', decimals: 0, group: 'Usage — forecast' },
  { key: 'gasUsageForecast', label: 'gas therms', decimals: 1, group: 'Usage — forecast' },
  { key: 'waterUsageForecast', label: 'water gal', decimals: 0, group: 'Usage — forecast' },
  { key: 'electricCostBaseline', label: 'electric $', decimals: 2, group: 'Cost — baseline' },
  { key: 'gasCostBaseline', label: 'gas $', decimals: 2, group: 'Cost — baseline' },
  { key: 'waterCostBaseline', label: 'water $', decimals: 2, group: 'Cost — baseline' },
  { key: 'electricCostForecast', label: 'electric $', decimals: 2, group: 'Cost — forecast' },
  { key: 'gasCostForecast', label: 'gas $', decimals: 2, group: 'Cost — forecast' },
  { key: 'waterCostForecast', label: 'water $', decimals: 2, group: 'Cost — forecast' },
  { key: 'co2BaselineLb', label: 'CO2e lb baseline', decimals: 1, group: 'Emissions' },
  { key: 'co2ForecastLb', label: 'CO2e lb forecast', decimals: 1, group: 'Emissions' }
];

const COST_COLS: { key: keyof CostRow; label: string; decimals?: number }[] = [
  { key: 'frequency', label: 'frequency' },
  { key: 'amount', label: 'amount each', decimals: 2 },
  { key: 'annualOccurrence', label: 'times/year' },
  { key: 'annualBaseline', label: 'annual baseline $', decimals: 2 },
  { key: 'annualForecast', label: 'annual forecast $', decimals: 2 }
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
  const [tab, setTab] = useState('line-items');
  const [selected, setSelected] = useState<{ table: string; rowIndex: number; colKey: string } | null>(null);

  const sourceRows: { formulas: Record<string, any>; description?: string; label?: string; productId?: string }[] =
    selected?.table === 'dishwashers'
      ? datasheet.dishwashers
      : selected?.table === 'costs'
        ? datasheet.costs
        : datasheet.rows;
  const selectedRow = selected ? (sourceRows[selected.rowIndex] as any) : null;
  const selectedFormula = selected && selectedRow ? selectedRow.formulas?.[selected.colKey] : undefined;
  const highlightedRefs = new Set<string>(selectedFormula?.refs ?? []);
  const ALL_LABELS: Record<string, string> = {
    ...Object.fromEntries(GROUPS.flatMap(g => g.cols).map(c => [String(c.key), c.label])),
    ...Object.fromEntries(DISHWASHER_COLS.map(c => [String(c.key), c.label])),
    ...Object.fromEntries(COST_COLS.map(c => [String(c.key), c.label]))
  };
  const labelFor = (key: string) => ALL_LABELS[key] ?? String(key);

  /** Shared cell behaviour: click to show the formula, highlight the cells it reads. */
  const cellProps =
    (table: string, colKey: string, rows: any[], background?: string) => (_row: any, rowIndex?: number) => {
      const isSelected = selected?.table === table && selected?.rowIndex === rowIndex && selected?.colKey === colKey;
      const isRef = selected?.table === table && selected?.rowIndex === rowIndex && highlightedRefs.has(colKey);
      const hasFormula = !!rows[rowIndex ?? -1]?.formulas?.[colKey];
      return {
        onClick: () => setSelected(isSelected ? null : { table, rowIndex: rowIndex ?? 0, colKey }),
        style: {
          background: isSelected ? '#bae0ff' : isRef ? '#fff1b8' : background,
          outline: isSelected ? '2px solid #1677ff' : isRef ? '2px solid #faad14' : undefined,
          outlineOffset: '-2px',
          cursor: hasFormula ? 'cell' : 'default',
          fontWeight: isSelected || isRef ? 600 : undefined
        }
      };
    };

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
        onCell: cellProps('line-items', String(col.key), datasheet.rows, group.color),
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
      <div style={{ padding: '24px 32px 96px' }}>
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

        <div
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            padding: '12px 24px',
            borderTop: '2px solid #1677ff',
            boxShadow: '0 -2px 12px rgba(0,0,0,0.12)',
            background: selectedFormula ? '#f0f8ff' : '#ffffff',
            minHeight: 62
          }}
        >
          <FunctionOutlined style={{ fontSize: 18, color: '#1677ff', marginTop: 2 }} />
          {selectedFormula && selectedRow ? (
            <div style={{ flex: 1 }}>
              <Typography.Text type='secondary' style={{ fontSize: 12 }}>
                {selectedRow.description || selectedRow.label || selectedRow.productId} → {labelFor(selected!.colKey)}
              </Typography.Text>
              <div style={{ fontFamily: 'monospace', fontSize: 14, marginTop: 2 }}>{selectedFormula.expression}</div>
              {selectedFormula.refs.length > 0 && (
                <Typography.Text type='secondary' style={{ fontSize: 12 }}>
                  reads: {selectedFormula.refs.map(labelFor).join(', ')} — highlighted in amber
                </Typography.Text>
              )}
              {selectedFormula.note && (
                <div style={{ fontSize: 12, color: '#d46b08', marginTop: 2 }}>⚠ {selectedFormula.note}</div>
              )}
            </div>
          ) : (
            <Typography.Text type='secondary' style={{ paddingTop: 4 }}>
              Click any calculated cell to see the formula with real numbers, and highlight the cells it reads.
            </Typography.Text>
          )}
          {selectedFormula && (
            <Button size='small' onClick={() => setSelected(null)}>
              Clear
            </Button>
          )}
        </div>

        <Tabs
          activeKey={tab}
          onChange={key => {
            setTab(key);
            setSelected(null);
          }}
          items={[
            {
              key: 'line-items',
              label: `Single-use & reusables (${datasheet.rows.length})`,
              children: (
                <Table
                  size='small'
                  bordered
                  sticky
                  rowKey={(r: DatasheetRow, i?: number) => `${r.kind}-${r.productId}-${i}`}
                  columns={columns}
                  dataSource={datasheet.rows}
                  pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '25', '50', '100'] }}
                  scroll={{ x: 'max-content' }}
                />
              )
            },
            {
              key: 'dishwashers',
              label: `Dishwashing (${datasheet.dishwashers.length})`,
              children: datasheet.dishwashers.length ? (
                <Table
                  size='small'
                  bordered
                  sticky
                  rowKey='label'
                  dataSource={datasheet.dishwashers}
                  pagination={{ pageSize: 10, hideOnSinglePage: true }}
                  scroll={{ x: 'max-content' }}
                  columns={[
                    { title: 'Dishwasher', dataIndex: 'label', fixed: 'left' as const, width: 140 },
                    ...Array.from(new Set(DISHWASHER_COLS.map(c => c.group))).map(groupName => ({
                      title: groupName,
                      children: DISHWASHER_COLS.filter(c => c.group === groupName).map(col => ({
                        title: col.label,
                        dataIndex: col.key,
                        width: 130,
                        align: 'right' as const,
                        onCell: cellProps('dishwashers', String(col.key), datasheet.dishwashers),
                        render: (v: unknown) => fmt(v, col.decimals)
                      }))
                    }))
                  ]}
                />
              ) : (
                <Typography.Text type='secondary'>This project has no dishwashers configured.</Typography.Text>
              )
            },
            {
              key: 'costs',
              label: `Labor, expenses & hauling (${datasheet.costs.length})`,
              children: datasheet.costs.length ? (
                <Table
                  size='small'
                  bordered
                  sticky
                  rowKey={(r: CostRow, i?: number) => `${r.group}-${r.description}-${i}`}
                  dataSource={datasheet.costs}
                  pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '25', '50'] }}
                  scroll={{ x: 'max-content' }}
                  columns={[
                    {
                      title: 'type',
                      dataIndex: 'group',
                      fixed: 'left' as const,
                      width: 130,
                      render: (v: string) => (
                        <Tag color={v === 'Labor' ? 'blue' : v === 'Waste hauling' ? 'orange' : 'purple'}>{v}</Tag>
                      )
                    },
                    { title: 'description', dataIndex: 'description', fixed: 'left' as const, width: 260 },
                    ...COST_COLS.map(col => ({
                      title: col.label,
                      dataIndex: col.key,
                      width: 150,
                      align: 'right' as const,
                      onCell: cellProps('costs', String(col.key), datasheet.costs),
                      render: (v: unknown) => fmt(v, col.decimals)
                    }))
                  ]}
                />
              ) : (
                <Typography.Text type='secondary'>
                  This project has no labor, other expenses or waste-hauling entries.
                </Typography.Text>
              )
            }
          ]}
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
