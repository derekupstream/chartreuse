import { GetServerSideProps } from 'next'
import prisma from 'lib/prisma'
import Analytics, { PageProps } from 'components/dashboard/analytics'
import Template from 'layouts/dashboardLayout'
import { getUserFromContext } from 'lib/middleware'
import { getAllProjections } from 'lib/calculator/getProjections'

export const getServerSideProps: GetServerSideProps<PageProps> = async context => {
  const { user } = await getUserFromContext(context, { org: true })

  const projectIds = (context.query.projects as string | undefined)?.split(',')

  if (!user?.org.isUpstream) {
    return {
      notFound: true,
    }
  }

  const projects = await prisma.project.findMany({
    include: {
      account: true,
      org: true,
    },
  })

  const filteredProjects = projectIds ? projects.filter(p => projectIds.includes(p.id)) : projects

  const data = await getAllProjections(filteredProjects)

  return {
    props: {
      data,
      allProjects: projects.map(p => ({ id: p.id, name: `${p.org.name} - ${p.account.name}: ${p.name}` })),
      user,
    },
  }
}

const AnalyticsPage = ({ user, data, allProjects }: PageProps) => {
  return <Analytics allProjects={allProjects} data={data} user={user} isUpstreamView={true} />
}

AnalyticsPage.getLayout = (page: React.ReactNode, pageProps: any) => {
  return (
    <Template {...pageProps} selectedMenuItem="upstream/total-annual-impact" title="Analytics">
      {page}
    </Template>
  )
}

export default AnalyticsPage
