import { GetServerSideProps } from 'next'
import { checkLogin } from 'lib/middleware'
import ProjectSetup from './[id]/setup'
import { DashboardUser } from 'components/dashboard'

export const getServerSideProps: GetServerSideProps = async context => {
  return checkLogin(context)
}

const NewProjectPage = ({ user }: { user: DashboardUser }) => {
  return <ProjectSetup user={user} />
}

export default NewProjectPage
