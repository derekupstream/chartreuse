import type { GetServerSideProps } from 'next';

import { AccountsPage } from 'components/accounts/AccountsPage';
import { DashboardLayout as Template } from 'layouts/DashboardLayout/DashboardLayout';
import type { LoggedinProps } from 'lib/middleware';
import { checkLogin } from 'lib/middleware';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';
import type { PageProps } from 'pages/_app';

export type AccountProductStat = {
  /** reusable_type as the RSP sends it, lowercased */
  type: string;
  outEvents: number;
  inEvents: number;
};

export type AccountStats = {
  id: string;
  createdAt: string;
  usagePeriodCount: number;
  /** Latest of: a project edit, or an RSP submission arriving */
  lastActivity: string | null;
  venueCategory: string | null;
  /** Per reusable type, from active RSP periods */
  products: AccountProductStat[];
  totals: {
    outEvents: number;
    inEvents: number;
    wasteDivertedLbs: number;
    waterSavedGallons: number;
    co2AvoidedKg: number;
  };
  /** Span of RSP data coverage */
  serviceStart: string | null;
  serviceEnd: string | null;
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
        createdAt: true,
        venueCategory: true,
        projects: { select: { updatedAt: true } },
        // Active only — superseded periods were replaced by a re-send and would double-count.
        usagePeriods: {
          where: { status: 'active' },
          select: {
            createdAt: true,
            dateMin: true,
            dateMax: true,
            co2AvoidedKg: true,
            waterSavedGallons: true,
            wasteDivertedLbs: true,
            products: { select: { reusableType: true, inWarehouseEvents: true, outWarehouseEvents: true } }
          }
        }
      }
    })
  ]);

  const accountStats: AccountStats[] = accounts.map(a => {
    // An account is "active" when someone edits a project OR its RSP sends data.
    const dates: Date[] = [
      ...a.projects.map(p => p.updatedAt).filter(Boolean),
      ...a.usagePeriods.map(p => p.createdAt)
    ].map(d => new Date(d));
    const lastActivity = dates.length ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;

    const byType = new Map<string, AccountProductStat>();
    a.usagePeriods.forEach(period =>
      period.products.forEach(product => {
        const type = product.reusableType.trim().toLowerCase();
        const entry = byType.get(type) ?? { type, outEvents: 0, inEvents: 0 };
        entry.outEvents += product.outWarehouseEvents;
        entry.inEvents += product.inWarehouseEvents;
        byType.set(type, entry);
      })
    );
    const products = Array.from(byType.values()).sort((x, y) => y.outEvents - x.outEvents);

    const serviceStart = a.usagePeriods.reduce<Date | null>((e, p) => (!e || p.dateMin < e ? p.dateMin : e), null);
    const serviceEnd = a.usagePeriods.reduce<Date | null>((l, p) => (!l || p.dateMax > l ? p.dateMax : l), null);

    return {
      id: a.id,
      createdAt: a.createdAt.toISOString(),
      usagePeriodCount: a.usagePeriods.length,
      lastActivity: lastActivity ? lastActivity.toISOString() : null,
      venueCategory: a.venueCategory,
      products,
      totals: {
        outEvents: products.reduce((s, p) => s + p.outEvents, 0),
        inEvents: products.reduce((s, p) => s + p.inEvents, 0),
        wasteDivertedLbs: a.usagePeriods.reduce((s, p) => s + p.wasteDivertedLbs, 0),
        waterSavedGallons: a.usagePeriods.reduce((s, p) => s + p.waterSavedGallons, 0),
        co2AvoidedKg: a.usagePeriods.reduce((s, p) => s + p.co2AvoidedKg, 0)
      },
      serviceStart: serviceStart ? serviceStart.toISOString().slice(0, 10) : null,
      serviceEnd: serviceEnd ? serviceEnd.toISOString().slice(0, 10) : null
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
