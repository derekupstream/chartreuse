import { Project } from '.prisma/client'
import { DashboardUser } from 'components/dashboard'
import { Button, Space, Steps, Typography } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import Template from './dashboardLayout'
import * as S from 'components/dashboard/styles'
import { useRouter } from 'next/router'

type Props = {
  currentStepIndex: number
  project?: Project
  title: string
  user: DashboardUser
}

const routes = ['setup', 'single-use', 'reusable-items', 'additional-costs', 'projections']

export default function ProjectLayout({ children, project, currentStepIndex, ...pageProps }: React.PropsWithChildren<Props>) {
  const router = useRouter()

  return (
    <Template {...pageProps} selectedMenuItem='projects'>
      <Space direction='vertical' size='large' style={{ width: '100%' }}>
        <div css='display: flex; justify-content: space-between'>
          <Button type='text' href='/projects'>
            <ArrowLeftOutlined />
            Back to projects
          </Button>
          <Typography.Title level={4}>{project?.name}</Typography.Title>
        </div>
        <S.Steps
          current={currentStepIndex}
          onChange={(id: number) => {
            router.push(`/projects/${project!.id}/${routes[id]}`)
          }}
        >
          <Steps.Step title='Step 1' description='Setup' />
          <Steps.Step title='Step 2' description='Single-use purchasing' />
          <Steps.Step title='Step 3' description='Reusables purchasing' />
          <Steps.Step title='Step 4' description='Additional costs' />
          <Steps.Step title='Step 5' description='Savings projections' />
        </S.Steps>
      </Space>
      {children}
    </Template>
  )
}

// const StepMenuItem = ({ title: string, href: string, description: string, icon: React.ReactNode }) => (
//   <Steps.Step
//     title={
//       <Link to='/workshop/client-portal/stage/file-management/people'>
//         <Dataset.Icon type='people' /> People
//       </Link>
//     }
//   />
// );
