import type { GetServerSideProps } from 'next';

import { TutorialPage } from 'components/tutorials/TutorialPage';
import { DashboardLayout as Template } from 'layouts/DashboardLayout/DashboardLayout';
import { checkLogin } from 'lib/middleware';

export const getServerSideProps: GetServerSideProps = async context => {
  return await checkLogin(context);
};

const ReportTutorial = () => (
  <TutorialPage
    eyebrow='Reuse Service Provider'
    title='Generate a report'
    intro="Turn your clients' real ingestion data into a polished impact report — GHG, water, waste, and cost — that you can share or export."
    accent='#1677ff'
    estimateMinutes={8}
    steps={[
      {
        title: 'Confirm your RSP profile is set up',
        body: (
          <>
            Reports pull from <strong>UsageTimePeriod</strong> rows ingested via your API key. Go to{' '}
            <strong>Settings → API Integration</strong> to confirm your key is active and that recent ingestions are
            showing up.
          </>
        ),
        tip: 'No data yet? See the RSP API docs in Settings — your client can POST usage data to /api/rsp/usage.'
      },
      {
        title: 'Link accounts to client orgs',
        body: (
          <>
            Each of your client venues is an Account in Chart-Reuse. Open the <strong>Accounts</strong> page and link
            each account to its client org via the <strong>RSP linkage</strong> setting — this is what associates
            ingested data with the right venue.
          </>
        )
      },
      {
        title: 'Open Analytics',
        body: (
          <>
            From the nav, open <strong>Analytics</strong>. The Your Impact cards aggregate across every project you can
            see — savings, single-use reduction, waste, and GHG.
          </>
        )
      },
      {
        title: 'Filter to the time window and client',
        body: (
          <>
            Use the filter row to narrow by date range, project type, or tag. The cards and underlying charts update
            instantly. To focus on a single client, filter by tag (if you tag projects by client) or by account.
          </>
        )
      },
      {
        title: 'Click a stat card to see the spread',
        body: (
          <>
            Click any KPI card to open the drill-down drawer. You&apos;ll see which projects are driving most of the
            savings (concentrated vs spread) and a per-segment breakdown — great for client conversations about where to
            expand next.
          </>
        )
      },
      {
        title: 'Share or export the report',
        body: (
          <>
            Use the <strong>Share</strong> button to publish a public link that updates live, or the{' '}
            <strong>Export</strong>
            menu to pull projections / actuals as CSV. Both work with the current filter set, so what you see is what
            your client gets.
          </>
        ),
        tip: 'Save your filter set as a named view (Save view button) to re-open the same report next month.'
      }
    ]}
    ctaLabel='Open Analytics'
    ctaHref='/dashboard'
    whatYouCanDoAfterwards={[
      <>Set up a recurring snapshot (manual today, automated soon) so each month is captured as a milestone.</>,
      <>Compare two saved scenarios on the Analytics page to model "what if this client adds 3 more venues?"</>,
      <>White-label the public report URL for your client to access directly.</>
    ]}
  />
);

ReportTutorial.getLayout = (page: React.ReactNode, pageProps: any) => (
  <Template {...pageProps} selectedMenuItem='dashboard' title='Tutorial — Generate a report'>
    {page}
  </Template>
);

export default ReportTutorial;
