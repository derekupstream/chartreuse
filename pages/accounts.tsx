import { GetServerSideProps } from 'next'

import Accounts from 'components/dashboard/accounts'
import Template from 'layouts/dashboardLayout'
import { PageProps } from 'pages/_app'
import { checkLogin, LoggedinProps } from 'lib/middleware'

export const getServerSideProps: GetServerSideProps = async context => {
  return checkLogin(context)
}

const AccountsPage = ({ user }: LoggedinProps) => {
  return <Accounts user={user} />
}

AccountsPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => {
  return (
    <Template {...pageProps} selectedMenuItem="accounts">
      {page}
    </Template>
  )
}

export default AccountsPage
