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

export default function QualityHub(_: { user: DashboardUser }) {
  return (
    <ToolHub
      title='Quality'
      purpose='Governance runs vertically through every layer: proof the calculations are right, a record of every run, and the checks that catch bad data before a user sees it.'
      tools={[
        {
          title: 'Test Runs & Golden Datasets',
          href: '/admin/data-science/test-runs',
          description:
            'Known inputs with expected outputs, run against the real engine. A failing golden dataset is a review artifact, not a nuisance.',
          primary: true,
          tag: 'proof'
        },
        {
          title: 'Calculation Log',
          href: '/admin/data-science/runs',
          description:
            'Every recorded compute run — what ran, over what, under which methodology snapshot, and whether it succeeded.'
        },
        {
          title: 'Legacy Inputs Browser',
          href: '/admin/data-science/inputs',
          description:
            'The old raw-inputs explorer. Superseded by the project Datasheet and Data Map; kept for reference.'
        }
      ]}
    />
  );
}

QualityHub.getLayout = (page: React.ReactNode, pageProps: PageProps) => (
  <AdminLayout {...(pageProps as any)} selectedMenuItem='data-science/quality' title='Quality'>
    {page}
  </AdminLayout>
);
