import { Space, Typography } from 'antd';
import Image from 'next/legacy/image';

import Container from 'components/common/Container';
import LegalNotice from 'components/common/LegalNotice';
import Logo from 'public/images/chart-reuse-logo-black.png';

import * as S from './styles';

type Props = {
  children: any;
  title: string;
  subtitle?: string;
  navBackLink?: React.ReactElement;
};

export const FormPageTemplate: React.FC<Props> = ({ children, title, subtitle, navBackLink }) => {
  return (
    <Container>
      <S.Wrapper>
        <Space direction='vertical' size={54} style={{ width: '100%' }}>
          {!navBackLink && <Image src={Logo} width={384} height={99} alt='Chart-Reuse' />}
          {navBackLink && (
            <S.LogoWithNavBackLink>
              {navBackLink}
              <div style={{ width: '600px' }}>
                <Image src={Logo} alt='Chart-Reuse' />
              </div>
              <div style={{ visibility: 'hidden' }}>{navBackLink}</div>
            </S.LogoWithNavBackLink>
          )}
          <Space direction='vertical' style={{ gap: '2em' }}>
            <Typography.Title>{title}</Typography.Title>
            {subtitle && <Typography.Text style={{ fontSize: '1rem' }}>{subtitle}</Typography.Text>}
          </Space>
          <div>{children}</div>
          <LegalNotice />
        </Space>
      </S.Wrapper>
    </Container>
  );
};
