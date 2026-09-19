/**
 * Products — the things Chart-Reuse ships, as first-class pages (Derek + Madhavi review,
 * 2026-09-18): two live products today, each gathering what already exists — its settings
 * page, validation, methodology — plus "Add new product" into the designer. The full
 * registry (drafts, archived, experiments) stays at /admin/data-science/data-products.
 */
import { AppstoreOutlined, ArrowRightOutlined, PlusOutlined, ToolOutlined } from '@ant-design/icons';
import { Badge, Button, Card, Input, Modal, Tag, Typography, message } from 'antd';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { getUserFromContext } from 'lib/middleware';
import { ACCESS_DENIED_REDIRECT, checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';
import type { PageProps } from 'pages/_app';

const { Title, Text, Paragraph } = Typography;

type ProductCard = {
  id: string | null;
  title: string;
  description: string;
  status: string | null;
  projectCount: number;
  projectLabel: string;
  /** The product's own page — settings, golden data, outputs. */
  href: string;
  links: { label: string; href: string }[];
};

type ComposedProductRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  description: string | null;
  screenCount: number;
  submissionCount: number;
};

type Props = { user: DashboardUser; products: ProductCard[]; registryCount: number; composed: ComposedProductRow[] };

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return ACCESS_DENIED_REDIRECT;
  if (!(await checkIsUpstream(user.org.id))) return ACCESS_DENIED_REDIRECT;

  const [projections, actuals, projectionProjects, eventProjects, registryCount, composedRows] = await Promise.all([
    prisma.dataProductDefinition.findUnique({ where: { slug: 'annual-projections-2-0' } }),
    prisma.dataProductDefinition.findUnique({ where: { slug: 'actuals-event-model' } }),
    prisma.project.count({ where: { category: 'default' } }),
    prisma.project.count({ where: { category: 'event' } }),
    prisma.dataProductDefinition.count(),
    prisma.dataProductDefinition.findMany({
      where: { screensJson: { not: undefined }, status: { not: 'archived' } },
      include: { _count: { select: { submissions: true } } },
      orderBy: { updatedAt: 'desc' }
    })
  ]);

  const composed: ComposedProductRow[] = composedRows
    .filter(p => p.screensJson !== null)
    .map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      status: p.status,
      description: p.description,
      screenCount: ((p.screensJson as any)?.screens ?? []).length,
      submissionCount: p._count.submissions
    }));

  const products: ProductCard[] = [
    {
      id: projections?.id ?? null,
      title: 'Annual Projections Calculator',
      description:
        'The core product: projects the annual cost and environmental savings of switching from single-use to reusable foodware. Methodology 2.0 — golden-tested against the Combined Model workbook.',
      status: projections?.status ?? null,
      projectCount: projectionProjects,
      projectLabel: 'projection projects',
      href: '/admin/data-science/data-products/annual-projections-2',
      links: [
        { label: 'Validation', href: '/admin/data-science/quality' },
        { label: 'Methodology', href: '/admin/data-science/methodology-hub' },
        { label: 'Model Console', href: '/admin/data-science/console' }
      ]
    },
    {
      id: actuals?.id ?? null,
      title: 'Event Actuals Dashboard',
      description:
        'Measured results instead of projections: what an event or reuse program actually used, returned, and saved — including usage pushed by reuse service providers through the RSP API.',
      status: actuals?.status ?? null,
      projectCount: eventProjects,
      projectLabel: 'event projects',
      href: actuals ? `/admin/data-science/data-products/${actuals.id}` : '/admin/data-science/data-products',
      links: [
        { label: 'RSP Hub', href: '/admin/rsp' },
        { label: 'Methodology', href: '/admin/data-science/methodology-hub' }
      ]
    }
  ];

  return { props: serializeJSON({ user, products, registryCount, composed }) };
};

export default function ProductsPage({ products, registryCount, composed }: Props) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  // "Add new product" creates a composed product and opens the UX Builder on it —
  // the designer route (Product Studio spec §6).
  async function createComposed() {
    if (!newName.trim()) {
      message.warning('Name the product first');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/admin/data-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), productType: 'calculator', audience: 'client' })
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Could not create the product');
      const created = await res.json();
      // Seed an empty screens document so it registers as composed from the start.
      await fetch(`/api/admin/data-products/${created.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ screensJson: { screens: [] }, inputSchemaJson: { fields: [] } })
      });
      router.push(`/admin/data-science/products/${created.id}/builder`);
    } catch (e) {
      message.error((e as Error).message);
      setCreating(false);
    }
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <Title level={2} style={{ marginBottom: 0 }}>
            <AppstoreOutlined /> Products
          </Title>
          <Paragraph type='secondary' style={{ maxWidth: 700 }}>
            What Chart-Reuse ships, built on the databases and methodology underneath. Each product gathers its own
            settings, validation, and version history.
          </Paragraph>
        </div>
        <Button type='primary' icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          Add new product
        </Button>
      </div>

      <Modal
        open={createOpen}
        title='New product'
        okText='Create and open the builder'
        confirmLoading={creating}
        onCancel={() => setCreateOpen(false)}
        onOk={createComposed}
      >
        <Paragraph type='secondary' style={{ fontSize: 13 }}>
          A composed product: screens of questions and smart-field cards, built in the Product UX Builder and published
          to its own page.
        </Paragraph>
        <Input
          placeholder='Product name — e.g. Funding Estimator'
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onPressEnter={createComposed}
        />
      </Modal>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
        {products.map(product => (
          <Card key={product.title} style={{ flex: '1 1 380px', maxWidth: 560 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <Title level={4} style={{ marginTop: 0, marginBottom: 4 }}>
                {product.title}
              </Title>
              {product.status && (
                <Badge
                  status={product.status === 'published' ? 'success' : 'default'}
                  text={
                    <Text type='secondary' style={{ fontSize: 12 }}>
                      {product.status}
                    </Text>
                  }
                />
              )}
            </div>
            <Paragraph type='secondary' style={{ fontSize: 13 }}>
              {product.description}
            </Paragraph>
            <Text type='secondary' style={{ fontSize: 12 }}>
              {product.projectCount.toLocaleString()} {product.projectLabel}
            </Text>
            {/* Primary actions on the first row; the tool links on their own row below. */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 14, flexWrap: 'wrap' }}>
              <Link href={product.href}>
                <Button type='primary' ghost>
                  Open product <ArrowRightOutlined />
                </Button>
              </Link>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
              {product.links.map(link => (
                <Link key={link.href} href={link.href}>
                  <Tag style={{ cursor: 'pointer', margin: 0 }}>{link.label}</Tag>
                </Link>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {composed.length > 0 && (
        <>
          <Title level={4} style={{ marginTop: 28, marginBottom: 8 }}>
            Composed products
          </Title>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {composed.map(p => (
              <Card key={p.id} style={{ flex: '1 1 380px', maxWidth: 560 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <Title level={4} style={{ marginTop: 0, marginBottom: 4 }}>
                    {p.name}
                  </Title>
                  <Badge
                    status={p.status === 'published' ? 'success' : 'default'}
                    text={
                      <Text type='secondary' style={{ fontSize: 12 }}>
                        {p.status}
                      </Text>
                    }
                  />
                </div>
                <Paragraph type='secondary' style={{ fontSize: 13 }}>
                  {p.description ??
                    'A composed product: screens of questions and smart-field calculations, built in the Product UX Builder.'}
                </Paragraph>
                <Text type='secondary' style={{ fontSize: 12 }}>
                  {p.screenCount} screen{p.screenCount === 1 ? '' : 's'} · {p.submissionCount} submission
                  {p.submissionCount === 1 ? '' : 's'}
                </Text>
                {/* Primary actions on the first row; the tool links on their own row below. */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 14, flexWrap: 'wrap' }}>
                  {p.status === 'published' ? (
                    <Button type='primary' ghost href={`/p/${p.slug}`} target='_blank'>
                      Open live <ArrowRightOutlined />
                    </Button>
                  ) : (
                    <Button type='primary' ghost href={`/p/${p.slug}?draft=1`} target='_blank'>
                      Preview draft <ArrowRightOutlined />
                    </Button>
                  )}
                  <Link href={`/admin/data-science/products/${p.id}/builder`}>
                    <Button icon={<ToolOutlined />}>Builder</Button>
                  </Link>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
                  <Link href='/admin/data-science/quality'>
                    <Tag style={{ cursor: 'pointer', margin: 0 }}>Validation</Tag>
                  </Link>
                  <Link href='/admin/data-science/methodology-hub'>
                    <Tag style={{ cursor: 'pointer', margin: 0 }}>Methodology</Tag>
                  </Link>
                  <Link href='/admin/data-science/console'>
                    <Tag style={{ cursor: 'pointer', margin: 0 }}>Model Console</Tag>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <Text type='secondary' style={{ fontSize: 12, display: 'block', marginTop: 18 }}>
        Drafts, experiments, and archived products live in the{' '}
        <Link href='/admin/data-science/data-products'>full registry ({registryCount})</Link>.
      </Text>
    </>
  );
}

ProductsPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => (
  <AdminLayout {...(pageProps as any)} selectedMenuItem='data-science/products' title='Products'>
    {page}
  </AdminLayout>
);
