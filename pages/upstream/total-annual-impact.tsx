import { GetServerSideProps } from 'next'

import Analytics, { PageProps } from 'components/dashboard/analytics'
import Template from 'layouts/dashboardLayout'
import { getUserFromContext } from 'lib/middleware'
import { getAllProjections } from 'lib/calculator'

export const getServerSideProps: GetServerSideProps<PageProps> = async context => {
  const user = await getUserFromContext(context, { org: true })

  if (!user?.org.isUpstream) {
    return {
      notFound: true,
    }
  }

  const projects = await prisma.project.findMany({
    include: {
      account: true,
    },
  })

  const data = await getAllProjections(projects)

  return {
    props: {
      data,
      user,
    },
  }
}

const AnalyticsPage = ({ user, data }: PageProps) => {
  return <Analytics data={data} user={user} isUpstreamView={true} />
}

AnalyticsPage.getLayout = (page: React.ReactNode, pageProps: any) => {
  return (
    <Template {...pageProps} selectedMenuItem="upstream/total-annual-impact" title="Annual Impact">
      {page}
    </Template>
  )
}

export default AnalyticsPage
