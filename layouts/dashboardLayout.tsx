import { DashboardUser } from 'components/dashboard'
import * as S from 'components/dashboard/styles'
import BaseLayout from './baseLayout'
import HaveQuestions from 'components/have-questions'

type DashboardProps = {
  children: any
  selectedMenuItem: string
  title: string
  user: DashboardUser
}

const DashboardTemplate: React.FC<DashboardProps> = ({ children, ...props }) => {

  return (
    <BaseLayout {...props}>
      <S.ContentContainer>
        <S.Content>{children}</S.Content>
      </S.ContentContainer>
      <HaveQuestions />
    </BaseLayout>
  )
}

export default DashboardTemplate
