import type { GetServerSideProps } from 'next';

import { TutorialPage } from 'components/tutorials/TutorialPage';
import { DashboardLayout as Template } from 'layouts/DashboardLayout/DashboardLayout';
import { checkLogin } from 'lib/middleware';

export const getServerSideProps: GetServerSideProps = async context => {
  return await checkLogin(context);
};

const CalculatorTutorial = () => (
  <TutorialPage
    eyebrow='Food venue operator'
    title='Create a calculator'
    intro='Model the cost and environmental savings of switching from single-use to reusable foodware at your venue.'
    accent='#52c41a'
    estimateMinutes={10}
    steps={[
      {
        title: 'Set up the project',
        body: (
          <>
            From <strong>Calculators</strong>, click <strong>+ Start custom project</strong>. Give your project a name,
            pick the account it belongs to, and choose its location — that auto-fills the state utility rates we use for
            cost calculations.
          </>
        ),
        tip: 'Project name is what shows up in dashboards and reports. Use the venue name, not the date.'
      },
      {
        title: 'Pick a project type',
        body: (
          <>
            Choose the type that best describes your venue: cafe, coffee shop, food hall, live event, etc. The type
            controls which step defaults are applied — e.g. event projects skip ongoing labor cost setup.
          </>
        )
      },
      {
        title: 'Enter your single-use usage',
        body: (
          <>
            On the <strong>Usage</strong> step, add the foodware items you use today: cups, lids, plates, utensils.
            Specify the quantity per period — annual, monthly, or per event. This is the baseline we&apos;ll compare
            against.
          </>
        ),
        tip: 'You don’t need to be exact. Even rough estimates let the calculator surface meaningful savings.'
      },
      {
        title: 'Choose reusable replacements',
        body: (
          <>
            On the <strong>Reusables</strong> step, pick the reusable items that would replace each single-use item.
            We&apos;ll account for purchase price, expected lifetime, dishwashing energy and water, and return rate.
          </>
        )
      },
      {
        title: 'Review projections',
        body: (
          <>
            On the <strong>Projections</strong> step you&apos;ll see annual cost savings, single-use items avoided, GHG
            avoided, water saved, and break-even time. Adjust the inputs upstream if the answer looks wrong — the
            calculator updates live.
          </>
        )
      },
      {
        title: 'Share or save a snapshot',
        body: (
          <>
            Click <strong>Save snapshot</strong> to capture today&apos;s numbers as a point-in-time record (useful for
            comparing projections to actuals later). Use the share button to generate a public-facing link, or export
            the data to CSV.
          </>
        )
      }
    ]}
    ctaLabel='Start my first calculator'
    ctaHref='/projects/new?dataType=projection'
    whatYouCanDoAfterwards={[
      <>
        Use the project in a <strong>scenario</strong> to model "what if 50 of my venues switched?"
      </>,
      <>
        Track the venue&apos;s real impact on the <strong>Dashboards</strong> page once you start recording actuals.
      </>,
      <>Share a polished projections dashboard with stakeholders via the share link.</>
    ]}
  />
);

CalculatorTutorial.getLayout = (page: React.ReactNode, pageProps: any) => (
  <Template {...pageProps} selectedMenuItem='projects' title='Tutorial — Create a calculator'>
    {page}
  </Template>
);

export default CalculatorTutorial;
