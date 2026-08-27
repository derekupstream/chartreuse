/**
 * Data Dictionary — the contract between the app and the model, as a readable reference
 * page (not a spreadsheet, not a popup). Every field the 2.0 model consumes or produces:
 * what it means, its type and unit, who is authoritative for it, and whether it's required.
 *
 * Content comes from the loaded "Data Dictionary" database (Madhavi's Data_Dictionary tab),
 * so a workbook upload updates this page with no code change. Corrections to the
 * definitions themselves go through the workbook or Advanced → All Databases.
 */
import { ReadOutlined } from '@ant-design/icons';
import { Card, Input, Table, Tag, Typography } from 'antd';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { getUserFromContext } from 'lib/middleware';
import { ACCESS_DENIED_REDIRECT, checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';
import type { PageProps } from 'pages/_app';

const { Title, Text, Paragraph } = Typography;

type DictionaryEntry = {
  field: string;
  type: string;
  unit: string;
  authority: string;
  requirement: string;
  definition: string;
};

type Props = { user: DashboardUser; entries: DictionaryEntry[]; version: string | null; databaseId: string | null };

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return ACCESS_DENIED_REDIRECT;
  if (!(await checkIsUpstream(user.org.id))) return ACCESS_DENIED_REDIRECT;

  const database = await prisma.factorDatabase.findUnique({
    where: { name: 'Data Dictionary' },
    include: { rows: { orderBy: { rowIndex: 'asc' } } }
  });

  const entries: DictionaryEntry[] = (database?.rows ?? []).map(r => {
    const d = r.data as Record<string, string | null>;
    return {
      field: d.Field ?? '',
      type: d.Type ?? '',
      unit: d.Unit ?? '',
      authority: d.Authority ?? '',
      requirement: d.Requirement ?? '',
      definition: d['Role / Definition'] ?? ''
    };
  });

  return {
    props: serializeJSON({ user, entries, version: database?.version ?? null, databaseId: database?.id ?? null })
  };
};

/** Who is authoritative for a field — the color groups related sources. */
function authorityColor(authority: string): string | undefined {
  const a = authority.toLowerCase();
  if (a.startsWith('user')) return 'blue';
  if (a.includes('funding')) return 'gold';
  if (a.includes('rate')) return 'cyan';
  if (a.includes('derived')) return 'purple';
  return 'green'; // database / factor database — Upstream-maintained
}

export default function DataDictionaryPage({ entries, version, databaseId }: Props) {
  const [search, setSearch] = useState('');

  const visible = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter(e => [e.field, e.definition, e.authority, e.type].join(' ').toLowerCase().includes(q));
  }, [entries, search]);

  return (
    <>
      <Title level={2} style={{ marginBottom: 0 }}>
        <ReadOutlined /> Data Dictionary
      </Title>
      <Paragraph type='secondary' style={{ maxWidth: 740 }}>
        The contract between the app and the 2.0 model: every field it consumes or produces, what it means, and who is
        authoritative for it. Sourced from the workbook&apos;s Data_Dictionary tab
        {version ? ` (version ${version})` : ''} — a workbook upload updates this page automatically.
      </Paragraph>

      <Card size='small'>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
          <Input.Search
            placeholder='Find a field…'
            allowClear
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 300 }}
          />
          <Text type='secondary'>
            {visible.length} of {entries.length} fields
          </Text>
        </div>
        <Table
          size='small'
          rowKey='field'
          pagination={false}
          dataSource={visible}
          columns={[
            {
              title: 'Field',
              dataIndex: 'field',
              width: 210,
              render: (v: string) => <Text code>{v}</Text>
            },
            {
              title: 'Definition',
              dataIndex: 'definition',
              render: (v: string) => v || <Text type='secondary'>—</Text>
            },
            {
              title: 'Type · unit',
              width: 150,
              render: (_: unknown, e: DictionaryEntry) => (
                <Text type='secondary' style={{ fontSize: 12 }}>
                  {e.type}
                  {e.unit && e.unit !== 'none' ? ` · ${e.unit}` : ''}
                </Text>
              )
            },
            {
              title: 'Authority',
              dataIndex: 'authority',
              width: 170,
              filters: Array.from(new Set(entries.map(e => e.authority))).map(a => ({ text: a, value: a })),
              onFilter: (value, e) => e.authority === value,
              render: (v: string) => <Tag color={authorityColor(v)}>{v}</Tag>
            },
            {
              title: 'Required',
              dataIndex: 'requirement',
              width: 110,
              render: (v: string) =>
                v.toLowerCase() === 'required' ? (
                  <Tag color='red'>required</Tag>
                ) : (
                  <Text type='secondary'>{v || '—'}</Text>
                )
            }
          ]}
        />
        <Text type='secondary' style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
          Definitions are data, not code — to correct one, re-upload the workbook or edit{' '}
          {databaseId ? (
            <Link href={`/admin/data-science/databases/${databaseId}`}>the underlying database</Link>
          ) : (
            'the underlying database'
          )}
          .
        </Text>
      </Card>
    </>
  );
}

DataDictionaryPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => (
  <AdminLayout {...(pageProps as any)} selectedMenuItem='data-science/data-dictionary' title='Data Dictionary'>
    {page}
  </AdminLayout>
);
