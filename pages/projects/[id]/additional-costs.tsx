import ProjectLayout from 'layouts/projectLayout'
import { getProjectContext, ProjectContext } from 'lib/middleware'
import { GetServerSideProps } from 'next'
import AdditionalCosts from 'components/dashboard/projects/steps/additional-costs'

export const getServerSideProps: GetServerSideProps = async context => {
  const result = await getProjectContext(context)
  return result
}

function AdditionalCostsPage({ project, user }: ProjectContext) {
  return (
    <ProjectLayout currentStepIndex={3} project={project} title={`${project.name} - Additional Costs`} user={user}>
      <AdditionalCosts project={project!} />
    </ProjectLayout>
  )
}

export default AdditionalCostsPage
