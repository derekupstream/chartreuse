import ProjectLayout from 'layouts/projectLayout'
import { getProjectContext, ProjectContext } from 'lib/middleware'
import { GetServerSideProps } from 'next'
import SingleUse from 'components/dashboard/projects/steps/single-use'

export const getServerSideProps: GetServerSideProps = async context => {
  const result = await getProjectContext(context)
  return result
}

function SingleUsePage({ project, user }: ProjectContext) {
  return (
    <ProjectLayout currentStepIndex={1} project={project} title={`${project.name} - Single Use Items`} user={user}>
      <SingleUse project={project!} user={user} />
    </ProjectLayout>
  )
}

export default SingleUsePage
