import Container from 'components/container'
import Image from 'next/legacy/image'
import Logo from 'public/images/chart-reuse-logo-black.png'
import { Space, Typography } from 'antd'
import LegalNotice from 'components/legal-notice'

import * as S from './styles'

type Props = {
  children: any
  title: string
  subtitle?: string
  navBackLink?: React.ReactElement
}

const FormPageTemplate: React.FC<Props> = ({ children, title, subtitle, navBackLink }) => {
  return (
    <Container>
      <S.Wrapper>
        <Space direction="vertical" size={54} style={{ width: '100%' }}>
          {!navBackLink && <Image src={Logo} width={384} height={99} alt="Chart Reuse" />}
          {navBackLink && (
            <S.LogoWithNavBackLink>
              {navBackLink}
              <Image src={Logo} alt="Chart Reuse" />
              <div style={{ visibility: 'hidden' }}>{navBackLink}</div>
            </S.LogoWithNavBackLink>
          )}
          <Space direction="vertical">
            <Typography.Title>{title}</Typography.Title>
            <Typography.Text strong>{subtitle}</Typography.Text>
          </Space>
          <div>{children}</div>
          <LegalNotice />
        </Space>
      </S.Wrapper>
    </Container>
  )
}

export default FormPageTemplate
