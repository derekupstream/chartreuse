import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Descriptions, Drawer, Space, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Node } from 'reactflow';

// ---- New node type interfaces for actuals/projections graphs ----

interface ProjectNodeData {
  id: string;
  name: string;
  category: string;
  orgId: string;
}

interface MilestoneNodeData {
  id: string;
  snapshotDate: string;
  label: string | null;
  source: string;
  co2AvoidedMtco2e: number | null;
  waterSavedGallons: number | null;
  wasteDivertedLbs: number | null;
  annualCostSavings: number | null;
  paybackMonths: number | null;
}

interface SingleUseItem {
  id: string;
  productId: string;
  caseCost: number;
  casesPurchased: number;
  frequency: string;
}

interface ReusableItem {
  id: string;
  productName: string | null;
  caseCost: number;
  casesPurchased: number;
}

interface NodeDrawerProps {
  node: Node | null;
  onClose: () => void;
}

function ApiRequestContent({ period }: { period: Record<string, unknown> }) {
  return (
    <>
      <Typography.Text strong>Raw Payload</Typography.Text>
      <pre style={{ background: '#f6f6f6', padding: 12, overflow: 'auto', maxHeight: 400, marginTop: 8 }}>
        {JSON.stringify(period?.rawPayload, null, 2)}
      </pre>
    </>
  );
}

function ValidationContent({ period }: { period: Record<string, unknown> }) {
  const dateMin = period?.dateMin as string | null;
  const dateMax = period?.dateMax as string | null;
  const products = (period?.products as unknown[]) ?? [];

  const checks = [
    { label: 'dateMin present', pass: !!dateMin },
    { label: 'dateMax present', pass: !!dateMax },
    { label: 'At least one product', pass: products.length > 0 },
    {
      label: 'dateMin before dateMax',
      pass: !!(dateMin && dateMax && new Date(dateMin) < new Date(dateMax))
    }
  ];

  return (
    <Space direction='vertical' style={{ width: '100%' }}>
      {checks.map(c => (
        <Space key={c.label}>
          {c.pass ? (
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
          ) : (
            <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
          )}
          <Typography.Text>{c.label}</Typography.Text>
        </Space>
      ))}
    </Space>
  );
}

function DedupContent({
  priorPeriod
}: {
  priorPeriod: { id: string; dateMin: string | null; dateMax: string | null } | null;
}) {
  if (priorPeriod) {
    return (
      <Typography.Text>
        Overlapping period found: <Typography.Text code>{priorPeriod.id}</Typography.Text>
        {', '}
        {priorPeriod.dateMin ?? '?'}&ndash;{priorPeriod.dateMax ?? '?'}. Decision: <strong>superseded</strong>.
      </Typography.Text>
    );
  }
  return (
    <Typography.Text>
      No overlapping period found. Decision: <strong>accepted (fresh submission)</strong>.
    </Typography.Text>
  );
}

function UsagePeriodContent({ period }: { period: Record<string, unknown> }) {
  const org = period?.org as { name: string } | undefined;
  return (
    <Descriptions column={1} size='small' bordered>
      <Descriptions.Item label='ID'>{String(period?.id ?? '—')}</Descriptions.Item>
      <Descriptions.Item label='Status'>{String(period?.status ?? '—')}</Descriptions.Item>
      <Descriptions.Item label='Date Min'>{String(period?.dateMin ?? '—')}</Descriptions.Item>
      <Descriptions.Item label='Date Max'>{String(period?.dateMax ?? '—')}</Descriptions.Item>
      <Descriptions.Item label='Client External ID'>{String(period?.clientExternalId ?? '—')}</Descriptions.Item>
      <Descriptions.Item label='CO₂ Avoided (kg)'>{String(period?.co2AvoidedKg ?? '—')}</Descriptions.Item>
      <Descriptions.Item label='Water Saved (gal)'>{String(period?.waterSavedGallons ?? '—')}</Descriptions.Item>
      <Descriptions.Item label='Waste Diverted (lbs)'>{String(period?.wasteDivertedLbs ?? '—')}</Descriptions.Item>
      <Descriptions.Item label='Org'>{org?.name ?? '—'}</Descriptions.Item>
    </Descriptions>
  );
}

interface Product {
  id: string;
  reusableType: string | null;
  inCount: number | null;
  outCount: number | null;
  co2Kg: number | null;
  waterGal: number | null;
  wasteLbs: number | null;
}

function ProductsContent({ products }: { products: Product[] }) {
  const columns: ColumnsType<Product> = [
    { title: 'Reusable Type', dataIndex: 'reusableType', key: 'reusableType', render: v => v ?? '—' },
    { title: 'In Count', dataIndex: 'inCount', key: 'inCount', render: v => v ?? '—' },
    { title: 'Out Count', dataIndex: 'outCount', key: 'outCount', render: v => v ?? '—' },
    { title: 'CO₂ (kg)', dataIndex: 'co2Kg', key: 'co2Kg', render: v => v ?? '—' },
    { title: 'Water (gal)', dataIndex: 'waterGal', key: 'waterGal', render: v => v ?? '—' },
    { title: 'Waste (lbs)', dataIndex: 'wasteLbs', key: 'wasteLbs', render: v => v ?? '—' }
  ];
  return <Table<Product> dataSource={products} columns={columns} rowKey='id' size='small' pagination={false} />;
}

interface ComputeRun {
  id: string;
  status: string;
  errorText: string | null;
  startedAt: string | null;
  finishedAt: string | null;
}

function ComputeRunContent({ computeRun }: { computeRun: ComputeRun | null }) {
  if (!computeRun) {
    return <Typography.Text type='secondary'>No compute run for this period.</Typography.Text>;
  }
  return (
    <Descriptions column={1} size='small' bordered>
      <Descriptions.Item label='ID'>{computeRun.id}</Descriptions.Item>
      <Descriptions.Item label='Status'>{computeRun.status}</Descriptions.Item>
      {computeRun.errorText && (
        <Descriptions.Item label='Error'>
          <Typography.Text type='danger'>{computeRun.errorText}</Typography.Text>
        </Descriptions.Item>
      )}
      <Descriptions.Item label='Started At'>{computeRun.startedAt ?? '—'}</Descriptions.Item>
      <Descriptions.Item label='Finished At'>{computeRun.finishedAt ?? '—'}</Descriptions.Item>
    </Descriptions>
  );
}

interface MetricResult {
  id: string;
  metricKey: string;
  value: number;
  units: string | null;
}

function MetricResultsContent({ metricResults }: { metricResults: MetricResult[] }) {
  const columns: ColumnsType<MetricResult> = [
    { title: 'Metric Key', dataIndex: 'metricKey', key: 'metricKey' },
    { title: 'Value', dataIndex: 'value', key: 'value' },
    { title: 'Units', dataIndex: 'units', key: 'units', render: v => v ?? '—' }
  ];
  return (
    <Table<MetricResult> dataSource={metricResults} columns={columns} rowKey='id' size='small' pagination={false} />
  );
}

function IntelligenceUpdateContent({ metadataJson }: { metadataJson: unknown }) {
  const meta = metadataJson as Record<string, unknown> | null | undefined;
  const refreshed = meta?.benchmarksRefreshed === true;
  const timestamp = meta?.benchmarksRefreshedAt as string | undefined;

  if (refreshed) {
    return (
      <Space>
        <CheckCircleOutlined style={{ color: '#52c41a' }} />
        <Typography.Text>Benchmarks refreshed{timestamp ? ` at ${timestamp}` : ''}.</Typography.Text>
      </Space>
    );
  }
  return <Typography.Text type='secondary'>Benchmarks not refreshed for this run.</Typography.Text>;
}

function ProjectNodeContent({ project }: { project: ProjectNodeData }) {
  return (
    <Descriptions column={1} size='small' bordered>
      <Descriptions.Item label='ID'>{project.id}</Descriptions.Item>
      <Descriptions.Item label='Name'>{project.name}</Descriptions.Item>
      <Descriptions.Item label='Category'>{project.category}</Descriptions.Item>
      <Descriptions.Item label='Org ID'>{project.orgId}</Descriptions.Item>
    </Descriptions>
  );
}

function MilestoneNodeContent({ milestone }: { milestone: MilestoneNodeData }) {
  return (
    <Descriptions column={1} size='small' bordered>
      <Descriptions.Item label='ID'>{milestone.id}</Descriptions.Item>
      <Descriptions.Item label='Snapshot Date'>{milestone.snapshotDate}</Descriptions.Item>
      <Descriptions.Item label='Label'>{milestone.label ?? '—'}</Descriptions.Item>
      <Descriptions.Item label='Source'>{milestone.source}</Descriptions.Item>
      <Descriptions.Item label='CO₂ Avoided (MTCO₂e)'>
        {milestone.co2AvoidedMtco2e != null ? String(milestone.co2AvoidedMtco2e) : '—'}
      </Descriptions.Item>
      <Descriptions.Item label='Annual Cost Savings'>
        {milestone.annualCostSavings != null ? `$${milestone.annualCostSavings.toLocaleString()}` : '—'}
      </Descriptions.Item>
      <Descriptions.Item label='Payback (months)'>
        {milestone.paybackMonths != null ? String(milestone.paybackMonths) : '—'}
      </Descriptions.Item>
      <Descriptions.Item label='Water Saved (gal)'>
        {milestone.waterSavedGallons != null ? String(milestone.waterSavedGallons) : '—'}
      </Descriptions.Item>
      <Descriptions.Item label='Waste Diverted (lbs)'>
        {milestone.wasteDivertedLbs != null ? String(milestone.wasteDivertedLbs) : '—'}
      </Descriptions.Item>
    </Descriptions>
  );
}

function SingleUseItemsContent({ items }: { items: SingleUseItem[] }) {
  const columns: ColumnsType<SingleUseItem> = [
    { title: 'Product ID', dataIndex: 'productId', key: 'productId', ellipsis: true },
    { title: 'Case Cost', dataIndex: 'caseCost', key: 'caseCost', render: v => `$${v}` },
    { title: 'Cases Purchased', dataIndex: 'casesPurchased', key: 'casesPurchased' },
    { title: 'Frequency', dataIndex: 'frequency', key: 'frequency' }
  ];
  return <Table<SingleUseItem> dataSource={items} columns={columns} rowKey='id' size='small' pagination={false} />;
}

function ReusableItemsContent({ items }: { items: ReusableItem[] }) {
  const columns: ColumnsType<ReusableItem> = [
    { title: 'Product Name', dataIndex: 'productName', key: 'productName', render: v => v ?? '—' },
    { title: 'Case Cost', dataIndex: 'caseCost', key: 'caseCost', render: v => `$${v}` },
    { title: 'Cases Purchased', dataIndex: 'casesPurchased', key: 'casesPurchased' }
  ];
  return <Table<ReusableItem> dataSource={items} columns={columns} rowKey='id' size='small' pagination={false} />;
}

function PriorPeriodContent({ priorPeriod }: { priorPeriod: Record<string, unknown> }) {
  return (
    <>
      <Descriptions column={1} size='small' bordered>
        <Descriptions.Item label='ID'>{String(priorPeriod?.id ?? '—')}</Descriptions.Item>
        <Descriptions.Item label='Status'>{String(priorPeriod?.status ?? '—')}</Descriptions.Item>
        <Descriptions.Item label='Date Min'>{String(priorPeriod?.dateMin ?? '—')}</Descriptions.Item>
        <Descriptions.Item label='Date Max'>{String(priorPeriod?.dateMax ?? '—')}</Descriptions.Item>
      </Descriptions>
      <Typography.Text type='secondary' style={{ marginTop: 12, display: 'block' }}>
        View this period at{' '}
        <Typography.Text code>/admin/data-science/data-map?period={String(priorPeriod?.id)}</Typography.Text>
      </Typography.Text>
    </>
  );
}

function NodeContent({ node }: { node: Node }) {
  const { type } = node.data as { type: string };

  switch (type) {
    case 'api-request':
      return <ApiRequestContent period={node.data.period as Record<string, unknown>} />;

    case 'validation':
      return <ValidationContent period={node.data.period as Record<string, unknown>} />;

    case 'dedup':
      return (
        <DedupContent
          priorPeriod={node.data.priorPeriod as { id: string; dateMin: string | null; dateMax: string | null } | null}
        />
      );

    case 'usage-period':
      return <UsagePeriodContent period={node.data.period as Record<string, unknown>} />;

    case 'products':
      return <ProductsContent products={(node.data.products as Product[]) ?? []} />;

    case 'compute-run':
      return <ComputeRunContent computeRun={node.data.computeRun as ComputeRun | null} />;

    case 'metric-results':
      return <MetricResultsContent metricResults={(node.data.metricResults as MetricResult[]) ?? []} />;

    case 'intelligence-update':
      return <IntelligenceUpdateContent metadataJson={node.data.metadataJson} />;

    case 'prior-period':
      return <PriorPeriodContent priorPeriod={node.data.priorPeriod as Record<string, unknown>} />;

    case 'project':
      return <ProjectNodeContent project={node.data.project as ProjectNodeData} />;

    case 'milestone':
      return <MilestoneNodeContent milestone={node.data.milestone as MilestoneNodeData} />;

    case 'single-use-items':
      return <SingleUseItemsContent items={(node.data.singleUseItems as SingleUseItem[]) ?? []} />;

    case 'reusable-items':
      return <ReusableItemsContent items={(node.data.reusableItems as ReusableItem[]) ?? []} />;

    default:
      return <Typography.Text type='secondary'>No details available.</Typography.Text>;
  }
}

export function NodeDrawer({ node, onClose }: NodeDrawerProps) {
  const nodeType = (node?.data as { type?: string } | undefined)?.type ?? '';

  return (
    <Drawer open={!!node} onClose={onClose} width={480} title={nodeType}>
      {node && <NodeContent node={node} />}
    </Drawer>
  );
}
