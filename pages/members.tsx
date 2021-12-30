import { GetServerSideProps } from 'next'

import Members from 'components/dashboard/members'
import Template from 'layouts/dashboardLayout'
import { PageProps } from 'pages/_app'
import { checkLogin, LoggedinProps } from 'lib/middleware'

export const getServerSideProps: GetServerSideProps = async context => {
  return checkLogin(context)
}

const MembersPage = ({ user }: LoggedinProps) => {
  return <Members user={user} />
}

MembersPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => {
  return (
    <Template {...pageProps} selectedMenuItem="members" title="Members">
      {page}
    </Template>
  )
}

export default MembersPage
