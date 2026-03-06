import { useEffect, useState } from 'react';

import { Input, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import useSWR from 'swr';

dayjs.extend(relativeTime);

export interface ProjectRow {
  id: string;
  name: string;
  category: string;
  updatedAt: string;
  org: { id: string; name: string };
  _count: { singleUseItems: number; reusableItems: number; milestones: number };
}

interface ProjectsResponse {
  projects: ProjectRow[];
  total: number;
  page: number;
  pageSize: number;
}

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** 'projections' shows line-item counts; 'actuals' shows milestone count */
  mode: 'projections' | 'actuals';
}

const CATEGORY_COLORS: Record<string, string> = {
  default: 'blue',
  event: 'purple',
  eugene: 'orange'
};

export function ProjectsFeedPanel({ selectedId, onSelect, mode }: Props) {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const params = new URLSearchParams({ page: String(page), pageSize: '25' });
  if (search) params.set('search', search);

  const { data, isLoading, error } = useSWR<ProjectsResponse>(`/api/admin/data-map/projects?${params}`);

  // Auto-select first row when data loads and nothing is selected
  useEffect(() => {
    if (data?.projects?.length && !selectedId) {
      onSelect(data.projects[0].id);
    }
  }, [data]);

  const columns: ColumnsType<ProjectRow> = [
    {
      title: 'Project',
      key: 'name',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: 12 }}>{r.name}</div>
          <div style={{ fontSize: 11, color: '#888' }}>{r.org.name}</div>
        </div>
      )
    },
    {
      title: 'Type',
      key: 'category',
      width: 70,
      render: (_, r) => (
        <Tag color={CATEGORY_COLORS[r.category] ?? 'default'} style={{ fontSize: 10 }}>
          {r.category}
        </Tag>
      )
    },
    {
      title: mode === 'projections' ? 'Items' : 'Snapshots',
      key: 'counts',
      width: 70,
      render: (_, r) =>
        mode === 'projections' ? `${r._count.singleUseItems + r._count.reusableItems}` : `${r._count.milestones}`
    },
    {
      title: 'Updated',
      key: 'updatedAt',
      width: 80,
      render: (_, r) => dayjs(r.updatedAt).fromNow()
    }
  ];

  // If the API returned an error body (e.g. 401/403), surface it
  const apiError = (data as any)?.error;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {(error || apiError) && (
        <div
          style={{
            marginBottom: 8,
            padding: '8px 12px',
            background: '#fff2f0',
            border: '1px solid #ffccc7',
            borderRadius: 4,
            fontSize: 12,
            color: '#cf1322'
          }}
        >
          API error: {apiError ?? error?.message ?? 'Unknown error'} — check browser console &amp; server logs
        </div>
      )}
      <Space style={{ marginBottom: 12 }}>
        <Input.Search
          placeholder='Search project or org...'
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onSearch={val => {
            setSearchInput(val);
            setSearch(val);
            setPage(1);
          }}
          style={{ width: 240 }}
          allowClear
        />
      </Space>
      <Table<ProjectRow>
        columns={columns}
        dataSource={data?.projects ?? []}
        rowKey='id'
        loading={isLoading}
        size='small'
        rowClassName={record => (record.id === selectedId ? 'ant-table-row-selected' : '')}
        onRow={record => ({ onClick: () => onSelect(record.id) })}
        pagination={{
          current: page,
          pageSize: 25,
          total: data?.total ?? 0,
          onChange: p => setPage(p),
          showSizeChanger: false,
          size: 'small'
        }}
        style={{ cursor: 'pointer', flex: 1 }}
        scroll={{ y: 'calc(100vh - 64px - 46px - 46px - 80px)' }}
      />
    </div>
  );
}
