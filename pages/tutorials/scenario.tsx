import type { GetServerSideProps } from 'next';

import { TutorialPage } from 'components/tutorials/TutorialPage';
import { DashboardLayout as Template } from 'layouts/DashboardLayout/DashboardLayout';
import { checkLogin } from 'lib/middleware';

export const getServerSideProps: GetServerSideProps = async context => {
  return await checkLogin(context);
};

const ScenarioTutorial = () => (
  <TutorialPage
    eyebrow='Government analyst'
    title='Build a scenario'
    intro='Model policy outcomes across many venues. Hide projects, filter by segment, multiply locations, and see the cumulative impact over time.'
    accent='#722ed1'
    estimateMinutes={12}
    steps={[
      {
        title: 'Open Scenarios',
        body: (
          <>
            From the nav, open <strong>Scenarios</strong>. You&apos;ll start with every projection project in your org
            included by default. The four KPI cards at the top show the current scenario&apos;s total impact.
          </>
        ),
        tip: 'Your scenario doesn’t change any of the underlying projects. It’s a stored configuration that overlays on top of them.'
      },
      {
        title: 'Name your scenario',
        body: (
          <>
            Click the scenario title at the top to rename it — e.g. "Citywide reusables, 2027 target". A meaningful name
            makes saved scenarios easier to find when you compare them later.
          </>
        )
      },
      {
        title: 'Filter to the segment you care about',
        body: (
          <>
            Use the <strong>Filter by segment</strong> multi-select to narrow down to specific project types — e.g. just
            coffee shops, just schools, just events. Projects that don&apos;t match dim out in the list below.
          </>
        )
      },
      {
        title: 'Hide projects that don’t belong',
        body: (
          <>
            Each row in the project list has a checkbox — uncheck any project you don&apos;t want in this scenario.
            Hidden rows stay visible (dimmed) so you can re-add them later.
          </>
        )
      },
      {
        title: 'Multiply for "what if" scaling',
        body: (
          <>
            In the multiplier column, set <strong>×50</strong> on a coffee shop project to model "what if 50 coffee
            shops switched?" — the stat cards above update instantly to reflect the scaled impact.
          </>
        ),
        tip: 'You can mix multipliers freely — ×1 for one venue, ×10 for another, ×0 doesn’t work (use the checkbox instead to exclude).'
      },
      {
        title: 'Use the timeline to see break-even',
        body: (
          <>
            The chart at the bottom plots cumulative net savings over 1–20 years. Drag the slider beneath the chart to
            move the comparison marker — the readout shows single-use cost vs reusable cost at that year.
          </>
        )
      },
      {
        title: 'Save labeled annotations',
        body: (
          <>
            Click <strong>+ Annotate</strong> at any marker position to drop a labeled vertical line (e.g. "Policy
            implementation Q3 2027"). Saved annotations stay with the scenario; click a saved tag below the chart to
            jump the marker back to that year.
          </>
        )
      },
      {
        title: 'Save the scenario',
        body: (
          <>
            Click <strong>Save</strong> at the top to persist this scenario, or <strong>Save as new</strong> to fork it.
            Saved scenarios show up in the load dropdown and on the Analytics page&apos;s scenario picker for A/B
            comparison.
          </>
        )
      }
    ]}
    ctaLabel='Build my first scenario'
    ctaHref='/scenarios'
    whatYouCanDoAfterwards={[
      <>Build a second scenario and pick both on Analytics to compare A vs B side-by-side.</>,
      <>Share scenario annotations with stakeholders by exporting the chart.</>,
      <>Use scenarios as policy proposals — "if we converted these 40 venues, here&apos;s the impact by 2030."</>
    ]}
  />
);

ScenarioTutorial.getLayout = (page: React.ReactNode, pageProps: any) => (
  <Template {...pageProps} selectedMenuItem='scenarios' title='Tutorial — Build a scenario'>
    {page}
  </Template>
);

export default ScenarioTutorial;
