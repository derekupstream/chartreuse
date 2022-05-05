import { GetServerSideProps } from 'next'

import Analytics, { PageProps } from 'components/dashboard/analytics'
import Template from 'layouts/dashboardLayout'
import { getUserFromContext } from 'lib/middleware'

export const getServerSideProps: GetServerSideProps<PageProps> = async context => {
  const user = await getUserFromContext(context, { org: true })

  if (!user) {
    return {
      notFound: true,
    }
  }
  return {
    props: {
      user,
    },
  }
}

const AnalyticsPage = ({ user }: PageProps) => {
  return <Analytics user={user} />
}

AnalyticsPage.getLayout = (page: React.ReactNode, pageProps: any) => {
  return (
    <Template {...pageProps} selectedMenuItem="annual-impact" title="Annual Impact">
      {page}
    </Template>
  )
}

export default AnalyticsPage
