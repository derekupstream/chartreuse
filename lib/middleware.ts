import nookies from 'nookies'
import prisma from 'lib/prisma'
import { Prisma, Project } from '@prisma/client'
import { verifyIdToken } from 'lib/auth/firebaseAdmin'
import { GetServerSideProps, GetServerSidePropsContext } from 'next'
import { DashboardUser } from 'components/dashboard'

export const UserDataToInclude = {
  org: {
    include: {
      accounts: {
        include: {
          invites: {
            include: {
              account: true,
            },
          },
          users: {
            include: {
              account: true,
            },
          },
        },
      },
    },
  },
}

export type LoggedinProps = {
  user: DashboardUser
}

export const checkLogin = async (context: GetServerSidePropsContext) => {
  try {
    const cookies = nookies.get(context)
    const token = await verifyIdToken(cookies.token)

    const user = await prisma.user.findUnique<Prisma.UserFindUniqueArgs>({
      where: {
        id: token.uid,
      },
      include: UserDataToInclude,
    })

    if (!user) {
      return {
        redirect: {
          permanent: false,
          destination: '/org-setup',
        },
      }
    }

    return {
      props: {
        user: JSON.parse(JSON.stringify(user)),
      },
    }
  } catch (error: any) {
    console.error('Error checking user auth', error)
    return {
      redirect: {
        permanent: false,
        destination: '/login',
      },
    }
  }
}

export type ProjectContext = {
  user: DashboardUser
  project: Project
}

export const getProjectContext: GetServerSideProps = async context => {
  try {
    const cookies = nookies.get(context)
    const token = await verifyIdToken(cookies.token)

    const user = await prisma.user.findUnique({
      where: {
        id: token.uid,
      },
      include: UserDataToInclude,
    })

    if (!user) {
      return {
        redirect: {
          permanent: false,
          destination: '/org-setup',
        },
      }
    }

    const { id } = context.query
    const project = await prisma.project.findUnique({
      where: { id: id as string },
    })

    if (!project) {
      return {
        notFound: true,
      }
    }
    const projectContext: ProjectContext = {
      // @ts-ignore - fix DashboardUser type to match
      user,
      project,
    }

    return {
      props: JSON.parse(JSON.stringify(projectContext)),
    }
  } catch (error: any) {
    console.error('Error getting project context', error)
    return {
      redirect: {
        permanent: false,
        destination: '/login',
      },
    }
  }
}
