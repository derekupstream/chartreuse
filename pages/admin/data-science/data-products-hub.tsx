import type { GetServerSideProps } from 'next';

import { ToolHub } from 'components/admin/ToolHub';
import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { getUserFromContext } from 'lib/middleware';
import { ACCESS_DENIED_REDIRECT, checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';
import type { PageProps } from 'pages/_app';

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return ACCESS_DENIED_REDIRECT;
  if (!(await checkIsUpstream(user.org.id))) return ACCESS_DENIED_REDIRECT;
  return { props: serializeJSON({ user }) };
};

export default function DataProductsHub(_: { user: DashboardUser }) {
  return (
    <ToolHub
      title='Data Products'
      purpose='The experiences built on top of the platform: calculators, dashboards, and scenarios that consume the databases and calculations underneath. The "What if you switch to reusables?" dashboard is one of these — an experience on the platform, not the product itself.'
      tools={[
        {
          title: 'Data Products',
          href: '/admin/data-science/data-products',
          description:
            'The registry: every calculator, dashboard, and scenario product, with its status, audience, and definition.',
          primary: true,
          tag: 'registry'
        },
        {
          title: 'Designer',
          href: '/admin/data-science/data-product-designer-v2',
          description:
            'Design a product interactively: editable inputs on the left, live outputs on the right, click any number for its equation. Parked mid-rework — see backlog #37.'
        },
        {
          title: 'Calculations (Smart Fields)',
          href: '/admin/data-science/smart-fields',
          description:
            'Named, reusable calculated fields — each one an equation whose every variable traces to a database cell.'
        },
        {
          title: 'Functions',
          href: '/admin/data-science/calculations',
          description:
            'The calculator engine functions as they exist in code, with source viewing. The lowest-level view of the intelligence layer.'
        }
      ]}
    />
  );
}

DataProductsHub.getLayout = (page: React.ReactNode, pageProps: PageProps) => (
  <AdminLayout {...(pageProps as any)} selectedMenuItem='data-science/data-products-hub' title='Data Products'>
    {page}
  </AdminLayout>
);
