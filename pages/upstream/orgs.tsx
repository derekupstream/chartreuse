import type { Org } from '@prisma/client';
import type { GetServerSideProps } from 'next';

import Organizations from 'components/orgs';
import type { DashboardUser } from 'interfaces';
import { DashboardLayout as Template } from 'layouts/DashboardLayout/DashboardLayout';
import { checkIsUpstream, checkLogin } from 'lib/middleware';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';
import type { PageProps } from 'pages/_app';

export interface OrgSummary extends Org {
  _count: {
    accounts: number;
    projects: number;
    users: number;
  };
}

export const getServerSideProps: GetServerSideProps<{ user: DashboardUser; orgs: OrgSummary[] }> = async context => {
  const response = await checkLogin(context);
  if (response.props?.user?.org.isUpstream) {
    const isUpstream = await checkIsUpstream(response.props.user.org.id);

    if (!isUpstream) {
      return {
        notFound: true
      };
    }

    const orgs = await prisma.org.findMany({
      include: {
        _count: {
          select: {
            accounts: true,
            projects: true,
            users: true
          }
        }
      }
    });
    return {
      props: serializeJSON({
        user: response.props?.user,
        orgs
      })
    };
  } else {
    return {
      notFound: true
    };
  }
};

const OrganizationsPage = (props: { user: DashboardUser; orgs: OrgSummary[] }) => {
  return <Organizations {...props} />;
};

OrganizationsPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => {
  return (
    <Template {...pageProps} selectedMenuItem='upstream/orgs' title='Organizations'>
      {page}
    </Template>
  );
};

export default OrganizationsPage;
