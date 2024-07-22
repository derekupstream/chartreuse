import type { Project } from '@prisma/client';
import type { GetServerSideProps } from 'next';
import nookies from 'nookies';

import type { DashboardUser } from 'interfaces';
import { verifyIdToken } from 'lib/auth/firebaseAdmin';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';

export type ProjectContext = {
  user: DashboardUser;
  readOnly: boolean; // useful for templates
  project: Project & { org: { name: string }; account: { name: string } };
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
    const cookies = nookies.get(context);
    if (!cookies.token) {
      throw new Error('Request requires authentication');
    }
    const token = await verifyIdToken(cookies.token);

    const user = await prisma.user.findUnique({
      where: {
        id: token.uid
      },
      include: UserDataToInclude
    });

    if (!user) {
      return {
        redirect: {
          permanent: false,
          destination: '/setup/trial'
        }
      };
    }

    const { id } = context.query;
    const project = await prisma.project.findUnique({
      where: { id: id as string },
      include: {
        account: {
          select: {
            name: true
          }
        },
        org: {
          select: {
            name: true
          }
        }
      }
    });

    if (!project) {
      return {
        notFound: true
      };
    }
    const projectContext: ProjectContext = {
      // @ts-ignore - fix DashboardUser type to match
      user,
      readOnly: project.isTemplate && !user.org.isUpstream,
      project
    };

    return {
      props: serializeJSON(projectContext)
    };
  } catch (error: any) {
    console.error('Error getting project context', error);
    return {
      redirect: {
        permanent: false,
        destination: '/projects'
      }
    };
  }
};
