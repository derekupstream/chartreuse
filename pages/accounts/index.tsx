import type { GetServerSideProps } from 'next';

import { AccountsPage } from 'components/accounts/AccountsPage';
import { DashboardLayout as Template } from 'layouts/DashboardLayout/DashboardLayout';
import type { LoggedinProps } from 'lib/middleware';
import { checkLogin } from 'lib/middleware';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';
import type { PageProps } from 'pages/_app';

export type AccountStats = {
  id: string;
  projectCount: number;
  userCount: number;
  singleUseItemCount: number;
  reusableItemCount: number;
  eventFoodwareItemCount: number;
  usagePeriodCount: number;
  lastActivity: string | null;
  venueCategory: string | null;
};

export const getServerSideProps: GetServerSideProps = async context => {
  const response = await checkLogin(context);
  if (!response.props.user?.orgId) return response;

  const orgId = response.props.user.orgId;

  const [orgRow, accounts] = await Promise.all([
    prisma.org.findUnique({ where: { id: orgId }, select: { orgInviteCode: true } }),
    prisma.account.findMany({
      where: { orgId },
      select: {
        id: true,
        venueCategory: true,
        _count: { select: { projects: true, users: true, usagePeriods: true } },
        projects: {
          select: {
            updatedAt: true,
            _count: {
              select: {
                singleUseItems: true,
                reusableItems: true,
                eventFoodwareItems: true
              }
            }
          }
        }
      }
    })
  ]);

  const accountStats: AccountStats[] = accounts.map(a => {
    const lastActivity = a.projects.reduce<Date | null>((latest, p) => {
      const d = p.updatedAt ? new Date(p.updatedAt) : null;
      if (!d) return latest;
      return latest && latest > d ? latest : d;
    }, null);
    return {
      id: a.id,
      projectCount: a._count.projects,
      userCount: a._count.users,
      singleUseItemCount: a.projects.reduce((s, p) => s + p._count.singleUseItems, 0),
      reusableItemCount: a.projects.reduce((s, p) => s + p._count.reusableItems, 0),
      eventFoodwareItemCount: a.projects.reduce((s, p) => s + p._count.eventFoodwareItems, 0),
      usagePeriodCount: a._count.usagePeriods,
      lastActivity: lastActivity ? lastActivity.toISOString() : null,
      venueCategory: a.venueCategory
    };
  });

  return {
    props: serializeJSON({
      user: response.props.user,
      org: { orgInviteCode: orgRow?.orgInviteCode || null },
      accountStats
    })
  };
};

const Accounts = ({
  user,
  org,
  accountStats
}: LoggedinProps & { org: { orgInviteCode: string | null }; accountStats: AccountStats[] }) => {
  return <AccountsPage user={user} org={org} accountStats={accountStats} />;
};

Accounts.getLayout = (page: React.ReactNode, pageProps: PageProps) => {
  return (
    <Template {...pageProps} selectedMenuItem='accounts' title='Accounts'>
      {page}
    </Template>
  );
};

export default Accounts;
