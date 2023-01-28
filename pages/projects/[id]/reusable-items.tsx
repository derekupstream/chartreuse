import ProjectLayout from 'layouts/projectLayout'
import { getProjectContext, ProjectContext } from 'lib/middleware'
import { GetServerSideProps } from 'next'
import ReusablesPurchasing from 'components/calculator/reusable-purchasing'

import chartreuseClient from 'lib/chartreuseClient'
import { useEffect } from 'react'

export const getServerSideProps: GetServerSideProps = async context => {
  const result = await getProjectContext(context)
  return result
}

function ReusablesPurchasingPage({ project, user }: ProjectContext) {
  useEffect(() => {
    chartreuseClient.sendMailchimpEvent('completed_single_use_step')
  }, [])

  return (
    <ProjectLayout currentStepIndex={2} project={project} title={`${project.name} - Reusable Items`} user={user}>
      <ReusablesPurchasing />
    </ProjectLayout>
  )
}

export default ReusablesPurchasingPage
