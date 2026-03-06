import { useEffect, useState } from 'react';

import { Input, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

dayjs.extend(relativeTime);

interface Period {
  id: string;
  createdAt: string;
  status: string;
  dateMin: string | null;
  dateMax: string | null;
  clientExternalId: string | null;
  co2AvoidedKg: number | null;
  waterSavedGallons: number | null;
  wasteDivertedLbs: number | null;
  supersededById: string | null;
  productCount: number;
  org: { id: string; name: string };
  submittedByKey: { id: string; keyPrefix: string } | null;
  latestComputeRun: { id: string; status: string; runType: string } | null;
}

interface PeriodsResponse {
  periods: Period[];
  total: number;
  page: number;
  pageSize: number;
}

interface FeedPanelProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'green',
  superseded: 'orange',
  failed: 'red',
  needs_review: 'blue'
};

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'superseded', label: 'Superseded' },
  { value: 'failed', label: 'Failed' },
  { value: 'needs_review', label: 'Needs Review' }
];

const COMPUTE_STATUS_OPTIONS = [
  { value: '', label: 'Any Compute' },
  { value: 'success', label: 'Compute OK' },
  { value: 'failed', label: 'Compute Failed' }
];

export function FeedPanel({ selectedId, onSelect }: FeedPanelProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [computeStatusFilter, setComputeStatusFilter] = useState<string | undefined>(undefined);

  // Debounce search input → search state
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const params = new URLSearchParams({ page: String(page), pageSize: '20' });
  if (search) params.set('search', search);
  if (statusFilter) params.set('status', statusFilter);
  if (computeStatusFilter) params.set('computeStatus', computeStatusFilter);

  const { data, isLoading } = useSWR<PeriodsResponse>(`/api/admin/data-map/periods?${params}`, fetcher);

  // Auto-select first row when data loads and nothing is selected
  useEffect(() => {
    if (data?.periods?.length && !selectedId) {
      onSelect(data.periods[0].id);
    }
  }, [data]);

  const columns: ColumnsType<Period> = [
    {
      title: 'Date Range',
      key: 'dateRange',
      render: (_, record) => {
        if (!record.dateMin && !record.dateMax) return '—';
        const from = record.dateMin ? dayjs(record.dateMin).format('MMM D, YYYY') : '?';
        const to = record.dateMax ? dayjs(record.dateMax).format('MMM D, YYYY') : '?';
        return `${from} – ${to}`;
      }
    },
    {
      title: 'RSP Org',
      key: 'org',
      render: (_, record) => record.org.name
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => <Tag color={STATUS_COLORS[record.status] ?? 'default'}>{record.status}</Tag>
    },
    {
      title: 'Impact',
      key: 'impact',
      render: (_, record) => (record.co2AvoidedKg != null ? `${record.co2AvoidedKg} kg CO₂` : '—')
    },
    {
      title: 'Ingested',
      key: 'ingested',
      render: (_, record) => dayjs(record.createdAt).fromNow()
    },
    {
      title: 'Products',
      key: 'productCount',
      render: (_, record) => record.productCount
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Space style={{ marginBottom: 12, flexWrap: 'wrap' }}>
        <Input.Search
          placeholder='Search org or client ID...'
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onSearch={val => {
            setSearchInput(val);
            setSearch(val);
            setPage(1);
          }}
          style={{ width: 220 }}
          allowClear
        />
        <Select
          value={statusFilter ?? ''}
          options={STATUS_OPTIONS}
          onChange={val => {
            setStatusFilter(val || undefined);
            setPage(1);
          }}
          style={{ width: 150 }}
        />
        <Select
          value={computeStatusFilter ?? ''}
          options={COMPUTE_STATUS_OPTIONS}
          onChange={val => {
            setComputeStatusFilter(val || undefined);
            setPage(1);
          }}
          style={{ width: 150 }}
        />
      </Space>
      <Table<Period>
        columns={columns}
        dataSource={data?.periods ?? []}
        rowKey='id'
        loading={isLoading}
        size='small'
        rowClassName={record => (record.id === selectedId ? 'ant-table-row-selected' : '')}
        onRow={record => ({ onClick: () => onSelect(record.id) })}
        pagination={{
          current: page,
          pageSize: 20,
          total: data?.total ?? 0,
          onChange: p => setPage(p),
          showSizeChanger: false
        }}
        style={{ cursor: 'pointer' }}
      />
    </div>
  );
}
