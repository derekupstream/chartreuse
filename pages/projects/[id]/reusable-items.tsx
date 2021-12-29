import ProjectLayout from 'layouts/projectLayout'
import { getProjectContext, ProjectContext } from 'lib/middleware'
import { GetServerSideProps } from 'next'
import ReusablesPurchasing from 'components/dashboard/projects/steps/reusable-purchasing'

export const getServerSideProps: GetServerSideProps = async context => {
  const result = await getProjectContext(context)
  return result
}

function ReusablesPurchasingPage({ project, user }: ProjectContext) {
  return (
    <ProjectLayout currentStepIndex={2} project={project} title={`${project.name} - Reusable Items`} user={user}>
      <ReusablesPurchasing />
    </ProjectLayout>
  )
}

export default ReusablesPurchasingPage
