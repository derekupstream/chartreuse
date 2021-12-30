import Projections from 'components/dashboard/projects/steps/projections'
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
      <Projections projectId={project.id} projectTitle={project.name} />
    </ProjectLayout>
  )
}

export default ProjectionsPage
