import type { GetServerSideProps } from 'next';
import prisma from 'lib/prisma';

import { serializeJSON } from 'lib/objects';
import { ProjectSetup } from 'components/projects/[id]/edit/ProjectSetup';
import type { DashboardProps } from 'layouts/DashboardLayout/DashboardLayout';
import { DashboardLayout as Template } from 'layouts/DashboardLayout/DashboardLayout';
import { checkLogin } from 'lib/middleware';
import { createProjectFromTemplate } from 'lib/projects/templates/createProjectFromTemplate';
import type { Project, ProjectDataType } from '@prisma/client';
import { categoryByType } from 'lib/projects/categories';
type PageProps = DashboardProps & {
  project?: Project;
  template?: Pick<Project, 'name'>;
  defaultDataType?: ProjectDataType;
};

export const getServerSideProps: GetServerSideProps = async context => {
  const props = await checkLogin(context);
  if (context.query.templateId && props.props.user) {
    const projectFromTemplate = await createProjectFromTemplate({
      orgId: props.props.user.orgId,
      projectId: context.query.templateId as string
    });
    const pageProps = props.props as PageProps;
    pageProps.project = projectFromTemplate;
    // pass template forward for project form
    const template = await prisma.project.findUniqueOrThrow({
      where: {
        id: context.query.templateId as string
      },
      select: { name: true }
    });
    pageProps.template = template;
  }
  const requestedDataType = context.query.dataType;
  if (requestedDataType === 'actual' || requestedDataType === 'projection') {
    (props.props as PageProps).defaultDataType = requestedDataType;
  }
  return serializeJSON(props);
};

const NewProjectPage = (pageProps: PageProps) => {
  const isActual = pageProps.defaultDataType === 'actual';
  return (
    <Template
      {...pageProps}
      selectedMenuItem={isActual ? 'dashboards' : 'projects'}
      title={isActual ? 'Dashboards' : 'Projects'}
    >
      <ProjectSetup
        actionLabel={isActual ? 'Record actual' : 'Add project'}
        user={pageProps.user}
        project={pageProps.project}
        template={pageProps.template}
        defaultDataType={pageProps.defaultDataType}
        successPath={(id, category) => {
          const { steps } = categoryByType(category);
          const firstStep = steps[1].path; // skip projections step
          return `/projects/${id}${firstStep}`;
        }}
      />
    </Template>
  );
};

export default NewProjectPage;
