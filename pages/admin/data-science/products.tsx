/**
 * Products — the things Chart-Reuse ships, as first-class pages (Derek + Madhavi review,
 * 2026-09-18): two live products today, each gathering what already exists — its settings
 * page, validation, methodology — plus "Add new product" into the designer. The full
 * registry (drafts, archived, experiments) stays at /admin/data-science/data-products.
 */
import { AppstoreOutlined, ArrowRightOutlined, PlusOutlined } from '@ant-design/icons';
import { Badge, Button, Card, Tag, Typography } from 'antd';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';

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

type Props = { user: DashboardUser; products: ProductCard[]; registryCount: number };

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return ACCESS_DENIED_REDIRECT;
  if (!(await checkIsUpstream(user.org.id))) return ACCESS_DENIED_REDIRECT;

  const [projections, actuals, projectionProjects, eventProjects, registryCount] = await Promise.all([
    prisma.dataProductDefinition.findUnique({ where: { slug: 'annual-projections-2-0' } }),
    prisma.dataProductDefinition.findUnique({ where: { slug: 'actuals-event-model' } }),
    prisma.project.count({ where: { category: 'default' } }),
    prisma.project.count({ where: { category: 'event' } }),
    prisma.dataProductDefinition.count()
  ]);

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

  return { props: serializeJSON({ user, products, registryCount }) };
};

export default function ProductsPage({ products, registryCount }: Props) {
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
        <Link href='/admin/data-science/data-products/new'>
          <Button type='primary' icon={<PlusOutlined />}>
            Add new product
          </Button>
        </Link>
      </div>

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
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 14, flexWrap: 'wrap' }}>
              <Link href={product.href}>
                <Button type='primary' ghost>
                  Open product <ArrowRightOutlined />
                </Button>
              </Link>
              {product.links.map(link => (
                <Link key={link.href} href={link.href}>
                  <Tag style={{ cursor: 'pointer' }}>{link.label}</Tag>
                </Link>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Text type='secondary' style={{ fontSize: 12, display: 'block', marginTop: 18 }}>
        Drafts, experiments, and archived products live in the{' '}
        <Link href='/admin/data-science/data-products'>full registry ({registryCount})</Link>; the designer opens from
        “Add new product”.
      </Text>
    </>
  );
}

ProductsPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => (
  <AdminLayout {...(pageProps as any)} selectedMenuItem='data-science/products' title='Products'>
    {page}
  </AdminLayout>
);
