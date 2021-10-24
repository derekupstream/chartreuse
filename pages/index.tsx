import { GetServerSideProps } from 'next'
import Header from 'components/header'
import PageLoader from 'components/page-loader'
import Dashboard, { Props } from 'components/dashboard'
import { checkLogin } from 'lib/middleware'

export const getServerSideProps: GetServerSideProps = async context => {
  return checkLogin(context)
}

export default function DashboardPage({ user }: Props) {
  if (!user) return <PageLoader />

  return (
    <>
      <Header title="Dashboard" />
      <Dashboard user={user} />
    </>
  )
}
