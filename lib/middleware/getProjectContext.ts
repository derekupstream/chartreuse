import type { Project, Org } from '@prisma/client';
import type { GetServerSideProps } from 'next';

import type { DashboardUser } from 'interfaces';
import { createSupabaseServerPropsClient } from 'lib/auth/supabaseServer';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';

export type ProjectContext = {
  user: DashboardUser;
  project: Project & {
    tagIds: string[];
    org: { isUpstream: boolean; name: string; useShrinkageRate: boolean };
    account: { name: string };
  };
  org: Org & { useShrinkageRate: boolean };
  readOnly: boolean;
};

export const UserDataToInclude = {
  org: {
    include: {
      accounts: {
        include: {
          invites: {
            include: {
              account: true
            }
          },
          users: {
            include: {
              account: true
            }
          }
        }
      }
    }
  }
} as const;

export const getProjectContext: GetServerSideProps = async context => {
  try {
    const supabase = createSupabaseServerPropsClient(context);
    const {
      data: { user: authUser }
    } = await supabase.auth.getUser();

    if (!authUser) {
      return { redirect: { permanent: false, destination: '/login' } };
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: UserDataToInclude
    });

    if (!user) {
      return { redirect: { permanent: false, destination: '/setup/trial' } };
    }

    const { id } = context.query;
    const project = await prisma.project.findUnique({
      where: { id: id as string },
      include: {
        account: { select: { name: true } },
        org: { select: { isUpstream: true, name: true, useShrinkageRate: true } },
        template: { select: { templateDescription: true } },
        tags: { select: { tagId: true } }
      }
    });

    if (!project) {
      return { notFound: true };
    }

    const projectContext: ProjectContext = {
      // @ts-ignore
      user,
      project: {
        ...project,
        tagIds: project.tags.map(tag => tag.tagId),
        projectionsDescription: project.projectionsDescription || project.template?.templateDescription || null,
        projectionsTitle: project.projectionsTitle || project.name || null
      },
      org: { ...user.org, useShrinkageRate: user.org.useShrinkageRate },
      readOnly: project.isTemplate && !user.org.isUpstream
    };

    return { props: serializeJSON(projectContext) };
  } catch (error: any) {
    console.error('Error getting project context', error);
    return { redirect: { permanent: false, destination: '/projects' } };
  }
};
