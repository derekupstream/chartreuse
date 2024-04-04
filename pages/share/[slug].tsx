import type { GetServerSideProps } from 'next';

import { SharedPage } from 'components/share/SharedPage';
import { SharedPageLayout } from 'layouts/SharedPageLayout';
import { serializeJSON } from 'lib/objects';
import { getSharedProjections } from 'lib/share/getSharedProjections';
import { isTruthy } from 'lib/types';

/**
 *
 * This page is used to render a public version of projections for an Org or Project
 * The first use case is for Pepsi, where we will pull in data from 3 separate projects
 */

type ServerSideProps = Awaited<ReturnType<typeof getSharedProjections>>;

export const getServerSideProps: GetServerSideProps = async context => {
  try {
    const props = await getSharedProjections(context.query.slug as string);
    // console.log(props.projects);
    return {
      props: serializeJSON(props)
    };
  } catch (e) {
    console.log('Error retrieving shared page: ' + context.query.slug, e);
    return { notFound: true };
  }
};

function ProjectionsPage({ projects, org }: ServerSideProps) {
  const title = `${org.name} | Projections`;
  return (
    <SharedPageLayout title={title}>
      <SharedPage orgName={org.name} pageTitle={title} projections={projects.filter(isTruthy)} />
    </SharedPageLayout>
  );
}

export default ProjectionsPage;
