import { Layout, Menu } from 'antd';
import Image from 'next/legacy/image';
import type { ReactNode } from 'react';
import { createGlobalStyle } from 'styled-components';

import { Header } from 'components/common/Header';
import * as S from 'layouts/styles';
import Logo from 'public/images/chart-reuse-logo-black.png';

type DashboardProps = {
  children: ReactNode;
  title: string;
};

const GlobalStyles = createGlobalStyle`
  body {
    background-color: #f4f3f0;
  }
`;

export const SharedPageLayout: React.FC<DashboardProps> = ({ title, children }) => {

  return (
    <>
      <Header title={title} />
      <GlobalStyles />
      <Layout style={{ display: 'flex', minHeight: '100vh' }}>
        <S.LayoutHeader>
          <S.LogoAndMenuWrapper>
            <Image src={Logo} alt='Chareuse logo'  width={248} height={64} />

          </S.LogoAndMenuWrapper>
        </S.LayoutHeader>
        {children}
      </Layout>
    </>
  );
};
