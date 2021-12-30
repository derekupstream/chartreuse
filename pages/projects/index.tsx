import { GetServerSideProps } from 'next'
import Projects from 'components/dashboard/projects'
import Template from 'layouts/dashboardLayout'
import { PageProps } from 'pages/_app'
import { checkLogin } from 'lib/middleware'

export const getServerSideProps: GetServerSideProps = async context => {
  return checkLogin(context)
}

const ProjectsPage = () => {
  return <Projects />
}

ProjectsPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => {
  return (
    <Template {...pageProps} selectedMenuItem="projects" title="Projects">
      {page}
    </Template>
  )
}

export default ProjectsPage
