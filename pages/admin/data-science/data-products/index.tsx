import { CopyOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Badge, Button, message, Modal, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { HowTo } from 'components/admin/HowTo';
import { getUserFromContext } from 'lib/middleware';
import { ACCESS_DENIED_REDIRECT, checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';
import type { PageProps } from 'pages/_app';

const { Title, Paragraph } = Typography;

type DataProduct = {
  id: string;
  name: string;
  slug: string;
  productType: string;
  audience: string;
  status: string;
  version: number;
  updatedAt: string;
};

type Props = {
  user: DashboardUser;
  products: DataProduct[];
};

const typeColors: Record<string, string> = {
  calculator: 'orange',
  dashboard: 'blue',
  scenario: 'purple',
  report: 'green'
};

const statusMap: Record<string, { status: 'default' | 'processing' | 'success' | 'warning'; text: string }> = {
  draft: { status: 'default', text: 'Draft' },
  review: { status: 'processing', text: 'In Review' },
  published: { status: 'success', text: 'Published' },
  archived: { status: 'warning', text: 'Archived' }
};

export default function DataProductsListPage({ products: initial }: Props) {
  const router = useRouter();
  const [products, setProducts] = useState(initial);

  async function handleDuplicate(id: string) {
    try {
      const res = await fetch(`/api/admin/data-products/${id}/duplicate`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to duplicate');
      const copy = await res.json();
      setProducts(prev => [copy, ...prev]);
      message.success('Duplicated');
    } catch {
      message.error('Failed to duplicate');
    }
  }

  function handleArchive(id: string) {
    Modal.confirm({
      title: 'Archive this data product?',
      content: 'It will be hidden from the list but can be restored later.',
      okText: 'Archive',
      okType: 'danger',
      onOk: async () => {
        const res = await fetch(`/api/admin/data-products/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setProducts(prev => prev.filter(p => p.id !== id));
          message.success('Archived');
        }
      }
    });
  }

  const columns: ColumnsType<DataProduct> = [
    {
      title: 'Name',
      key: 'name',
      render: (_, r) => (
        // Products with a dedicated bench page open it directly; everything else opens the designer.
        <Link
          href={
            r.slug === 'annual-projections-2-0'
              ? '/admin/data-science/data-products/annual-projections-2'
              : `/admin/data-science/data-products/${r.id}`
          }
          style={{ fontWeight: 600 }}
        >
          {r.name}
        </Link>
      )
    },
    {
      title: 'Type',
      key: 'productType',
      width: 120,
      render: (_, r) => <Tag color={typeColors[r.productType] ?? 'default'}>{r.productType}</Tag>
    },
    {
      title: 'Audience',
      key: 'audience',
      width: 100,
      render: (_, r) => <Tag>{r.audience}</Tag>
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_, r) => {
        const s = statusMap[r.status] ?? { status: 'default' as const, text: r.status };
        return <Badge status={s.status} text={s.text} />;
      }
    },
    {
      title: 'Version',
      dataIndex: 'version',
      width: 80,
      render: v => `v${v}`
    },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      width: 160,
      render: v => new Date(v).toLocaleDateString()
    },
    {
      title: '',
      key: 'actions',
      width: 140,
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Button
            size='small'
            icon={<EditOutlined />}
            onClick={() => router.push(`/admin/data-science/data-products/${r.id}`)}
          />
          <Button size='small' icon={<CopyOutlined />} onClick={() => handleDuplicate(r.id)} />
          <Button size='small' icon={<DeleteOutlined />} danger onClick={() => handleArchive(r.id)} />
        </div>
      )
    }
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Data Products
          </Title>
          <Paragraph type='secondary' style={{ marginBottom: 0, marginTop: 4 }}>
            Governed flows combining inputs, factors, and calculations into user-facing tools.
          </Paragraph>
        </div>
        <Link href='/admin/data-science/data-products/new'>
          <Button type='primary' icon={<PlusOutlined />}>
            New Data Product
          </Button>
        </Link>
      </div>

      <Table
        dataSource={products}
        columns={columns}
        rowKey='id'
        size='small'
        pagination={{ defaultPageSize: 20 }}
        locale={{
          emptyText: (
            <div style={{ padding: 40 }}>
              <Title level={4} type='secondary'>
                No data products yet
              </Title>
              <Paragraph type='secondary'>
                Create your first data product to start assembling calculation flows.
              </Paragraph>
              <Link href='/admin/data-science/data-products/new'>
                <Button type='primary' icon={<PlusOutlined />}>
                  Create First Data Product
                </Button>
              </Link>
            </div>
          )
        }}
      />
    </>
  );
}

DataProductsListPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => (
  <AdminLayout {...(pageProps as any)} selectedMenuItem='data-science/data-products' title='Data Products'>
    <HowTo tool='data-products' />
    {page}
  </AdminLayout>
);

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return ACCESS_DENIED_REDIRECT;
  const isUpstream = await checkIsUpstream(user.org.id);
  if (!isUpstream) return ACCESS_DENIED_REDIRECT;

  const products = await prisma.dataProductDefinition.findMany({
    where: { status: { not: 'archived' } },
    orderBy: { updatedAt: 'desc' }
  });

  return { props: serializeJSON({ user, products }) };
};
