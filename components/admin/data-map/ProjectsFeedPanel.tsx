import { useEffect, useMemo, useState } from 'react';

import { Input, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export interface ProjectRow {
  id: string;
  name: string;
  category: string;
  updatedAt: string;
  org: { id: string; name: string };
  _count: { singleUseItems: number; reusableItems: number; milestones: number };
}

interface Props {
  projects: ProjectRow[];
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

export function ProjectsFeedPanel({ projects, selectedId, onSelect, mode }: Props) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const PAGE_SIZE = 25;

  // Client-side filter
  const filtered = useMemo(() => {
    if (!search.trim()) return projects;
    const q = search.toLowerCase();
    return projects.filter(p => p.name.toLowerCase().includes(q) || p.org.name.toLowerCase().includes(q));
  }, [projects, search]);

  // Auto-select first row on mount
  useEffect(() => {
    if (projects.length > 0 && !selectedId) {
      onSelect(projects[0].id);
    }
  }, [projects]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Space style={{ marginBottom: 12 }}>
        <Input.Search
          placeholder={`Search ${filtered.length} projects...`}
          value={search}
          onChange={e => setSearch(e.target.value)}
          onSearch={setSearch}
          style={{ width: 260 }}
          allowClear
        />
      </Space>
      <Table<ProjectRow>
        columns={columns}
        dataSource={paginated}
        rowKey='id'
        size='small'
        rowClassName={record => (record.id === selectedId ? 'ant-table-row-selected' : '')}
        onRow={record => ({ onClick: () => onSelect(record.id) })}
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          total: filtered.length,
          onChange: p => setPage(p),
          showSizeChanger: false,
          size: 'small',
          showTotal: total => `${total} projects`
        }}
        style={{ cursor: 'pointer', flex: 1 }}
        scroll={{ y: 'calc(100vh - 64px - 46px - 46px - 120px)' }}
      />
    </div>
  );
}
