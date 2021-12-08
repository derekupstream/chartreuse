import { GetServerSideProps } from 'next'
import nookies from 'nookies'
import { verifyIdToken } from 'lib/auth/firebaseAdmin'
import prisma from 'lib/prisma'
import { Prisma } from '@prisma/client'

import ProjectSteps from 'components/dashboard/projects/steps'
import DashboardTemplate from 'layouts/dashboardLayout'
import { PageProps } from 'pages/_app'
import { ProjectContext, UserDataToInclude } from 'lib/middleware'

export const getServerSideProps: GetServerSideProps = async context => {
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

    const { id } = context.query
    const project = await prisma.project.findUnique({
      where: { id: id as string },
    })

    return {
      props: JSON.parse(
        JSON.stringify({
          user,
          project,
        })
      ),
    }
  } catch (error: any) {
    return {
      redirect: {
        permanent: false,
        destination: '/login',
      },
    }
  }
}

const ProjectPage = ({ user, project }: ProjectContext) => {
  return <ProjectSteps user={user} project={project} />
}

ProjectPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => {
  return (
    <DashboardTemplate {...pageProps} selectedMenuItem="projects">
      {page}
    </DashboardTemplate>
  )
}

export default ProjectPage
