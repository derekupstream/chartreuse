import type { NextPage } from 'next';
import type { GetServerSideProps } from 'next';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { createGlobalStyle } from 'styled-components';

import { CurrencyProvider } from 'components/_app/CurrencyProvider';
import { ErrorBoundary } from 'components/common/errors/ErrorBoundary';
import { analytics } from 'lib/analytics/mixpanel.browser';
import { AuthProvider } from 'lib/auth/auth.browser';
import chartreuseClient from 'lib/chartreuseClient';
import { getProjectContext } from 'lib/middleware';

import * as gtag from '../lib/ga';

import 'styles/antd.less';
import 'styles/print.less';
// import '@antv/xflow/dist/index.css';
import 'components/share/components/ProjectionAssumptions/styles.less';
import 'components/share/components/ProjectionAssumptions/SmallSize.styles.less';
import 'components/share/components/ProjectionAssumptions/MidSize.styles.less';
import 'components/share/components/ProjectionAssumptions/LargeSize.styles.less';

// Track initial pageview
if (typeof window !== 'undefined') {
  analytics.page();
}

const GlobalStyles = createGlobalStyle`
  body {
    background-color: #f4f3f0;
  }
`;

const queryClient = new QueryClient();

type Props = AppProps & {
  Component: Page;
};

export type PageProps = any;

type Page<P = any> = NextPage & {
  getLayout?: (page: React.ReactNode, pageProps: PageProps) => React.ReactNode;
};

export const getServerSideProps: GetServerSideProps = async context => {
  const result = await getProjectContext(context);
  return result;
};

function MyApp({ Component, pageProps }: Props) {
  const getLayout = Component.getLayout ?? ((page: React.ReactNode) => page);
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = () => {
      analytics.page();
    };
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  useEffect(() => {
    chartreuseClient.getLoggedInUser().then(({ user }) => {
      if (user && user.org) {
        gtag.setOrgName(user.org.name);
        gtag.setUserId(user.id);
      }
    });
  }, []);

  useEffect(() => {
    function handleRouteChange(url: URL) {
      gtag.pageview(url);
    }
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  return (
    <>
      <CurrencyProvider abbreviation={pageProps.org?.currency ? pageProps.org.currency : 'USD'}>
        <Head>
          <title>Welcome to Chart-Reuse by Upstream</title>
          <link rel='icon' href='/favicon.png' key='favicon' />
        </Head>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <GlobalStyles />
            <ErrorBoundary>{getLayout(<Component {...pageProps} />, pageProps)}</ErrorBoundary>
          </AuthProvider>
        </QueryClientProvider>
      </CurrencyProvider>
    </>
  );
}
export default MyApp;
