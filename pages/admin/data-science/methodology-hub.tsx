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

export default function MethodologyHub(_: { user: DashboardUser }) {
  return (
    <ToolHub
      title='Methodology'
      purpose='The intelligence layer: the factors, models, and documented methods that turn standardized data into trusted calculations. Everything here is Upstream IP, and everything here is versioned — a change is proposed, reviewed, and recorded, never just made.'
      tools={[
        {
          title: 'Factors',
          href: '/admin/data-science/constants',
          description:
            'Every factor with its value, unit, source, and full version history. Each links to the calculator constant it governs.',
          primary: true,
          tag: 'versioned'
        },
        {
          title: 'Change Requests',
          href: '/admin/data-science/change-requests',
          description:
            'Proposed factor changes awaiting review — the approval step between "someone thinks this value is wrong" and it changing.'
        },
        {
          title: 'Snapshots',
          href: '/admin/data-science/snapshots',
          description:
            'Named, publishable bundles of factor versions. The building block for data releases and calculation stamping.'
        },
        {
          title: 'Methodology Document',
          href: '/admin/methodology',
          description:
            'The written methodology — metric definitions, boundaries, and rules. Madhavi is updating this for the 2.0 model.'
        }
      ]}
    />
  );
}

MethodologyHub.getLayout = (page: React.ReactNode, pageProps: PageProps) => (
  <AdminLayout {...(pageProps as any)} selectedMenuItem='data-science/methodology-hub' title='Methodology'>
    {page}
  </AdminLayout>
);
