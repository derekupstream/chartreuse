import { useRouter } from 'next/router'
import { useAuth } from 'hooks/useAuth'
import { DashboardUser } from 'components/dashboard'
import * as S from 'components/dashboard/styles'
import BaseLayout from './baseLayout'

type DashboardProps = {
  selectedMenuItem?: string
  title: string
  user: DashboardUser
}

const DashboardTemplate: React.FC<DashboardProps> = ({ children, ...props }) => {

  return (
    <BaseLayout {...props}>
      <S.ContentContainer>
        <S.Content>{children}</S.Content>
      </S.ContentContainer>
    </BaseLayout>
  )
}

export default DashboardTemplate
