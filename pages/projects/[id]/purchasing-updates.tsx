import ProjectLayout from 'layouts/projectLayout'
import { getProjectContext, ProjectContext } from 'lib/middleware'
import { GetServerSideProps } from 'next'
import { PurchasingUpdates } from 'components/calculator/purchasing-updates/purchasing-updates'
import ReactToPrint from 'react-to-print'

export const getServerSideProps: GetServerSideProps = async context => {
  const result = await getProjectContext(context)
  return result
}

function PurchasingUpdatesPage({ project, user }: ProjectContext) {
  return (
    <ProjectLayout currentStepIndex={5} project={project} title={`${project.name} - Reusable Items`} user={user}>
      <PurchasingUpdates project={project} />
    </ProjectLayout>
  )
}

export default PurchasingUpdatesPage
