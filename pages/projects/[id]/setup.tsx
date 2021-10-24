import { GetServerSideProps } from 'next'
import { getProjectContext, ProjectContext } from 'lib/middleware'
import { Project } from '@prisma/client'
import ProjectLayout from 'layouts/projectLayout'
import { DashboardUser } from 'components/dashboard'
import ProjectSetup from 'components/dashboard/projects/steps/setup'

export const getServerSideProps: GetServerSideProps = async context => {
  const result = await getProjectContext(context)
  return result
}

export default function SetupPage({ user, project }: { user: DashboardUser; project?: Project }) {
  return (
    <ProjectLayout currentStepIndex={0} user={user} project={project}>
      <ProjectSetup user={user} project={project} />
    </ProjectLayout>
  )
}
