import Projections from 'components/calculator/projections'
import ProjectLayout from 'layouts/projectLayout'
import { getProjectContext, ProjectContext } from 'lib/middleware'
import { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async context => {
  const result = await getProjectContext(context)
  return result
}

function ProjectionsPage({ project, user }: ProjectContext) {
  return (
    <ProjectLayout currentStepIndex={4} project={project} title={`${project.name} - Projections`} user={user}>
      <Projections project={project} />
    </ProjectLayout>
  )
}

export default ProjectionsPage
