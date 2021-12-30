import { GetServerSideProps } from 'next'
import PageLoader from 'components/page-loader'
import Dashboard from 'layouts/dashboardLayout'
import { checkLogin, LoggedinProps } from 'lib/middleware'

export const getServerSideProps: GetServerSideProps = async context => {
  return checkLogin(context)
}

export default function DashboardPage({ user }: LoggedinProps) {
  if (!user) return <PageLoader />

  return (
    <>
      <Dashboard title="Dashboard" user={user} />
    </>
  )
}
