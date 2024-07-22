import type { GetServerSideProps } from 'next';
import prisma from 'lib/prisma';

import { serializeJSON } from 'lib/objects';
import { ProjectSetup } from 'components/projects/[id]/edit';
import type { DashboardProps } from 'layouts/DashboardLayout/DashboardLayout';
import { DashboardLayout as Template } from 'layouts/DashboardLayout/DashboardLayout';
import { checkLogin } from 'lib/middleware';
import { createProjectFromTemplate } from 'lib/projects/templates/createProjectFromTemplate';
import type { Project } from '@prisma/client';

type PageProps = DashboardProps & { project?: Project; template?: Pick<Project, 'name'> };

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
  return serializeJSON(props);
};

const NewProjectPage = (pageProps: PageProps) => {
  return (
    <Template {...pageProps} selectedMenuItem='projects' title='Projects'>
      <ProjectSetup
        actionLabel='Add project'
        user={pageProps.user}
        project={pageProps.project}
        template={pageProps.template}
        successPath={id => `/projects/${id}/single-use-items`}
      />
    </Template>
  );
};

export default NewProjectPage;
