import type { NextPage } from 'next';
import type { GetServerSideProps } from 'next';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { createGlobalStyle } from 'styled-components';

import { CurrencyProvider } from 'components/_app/CurrencyProvider';
import { MetricSystemProvider } from 'components/_app/MetricSystemProvider';
import { ErrorBoundary } from 'components/common/errors/ErrorBoundary';
import { FeedbackWidget } from 'components/common/FeedbackWidget';
import { analytics } from 'lib/analytics/mixpanel.browser';
import { AuthProvider } from 'lib/auth/auth.browser';
import chartreuseClient from 'lib/chartreuseClient';
import { getProjectContext } from 'lib/middleware';
import { ConfigProvider, theme, ThemeConfig } from 'antd';
import * as gtag from '../lib/ga';

import 'styles/antd.scss';
import 'styles/print.scss';
// import '@antv/xflow/dist/index.css';
import 'components/share/components/ProjectionAssumptions/styles.scss';
import 'components/share/components/ProjectionAssumptions/components/SmallSize.styles.scss';
import 'components/share/components/ProjectionAssumptions/components/MidSize.styles.scss';
import 'components/share/components/ProjectionAssumptions/components/LargeSize.styles.scss';

// Track initial pageview
if (typeof window !== 'undefined') {
  analytics.page();
}

const GlobalStyles = createGlobalStyle`
  body {
    background-color: #f4f3f0;
  }

  /* Global responsive rules */
  *, *::before, *::after {
    box-sizing: border-box;
  }

  h1, h2, h3, h4, h5, h6 {
    word-break: break-word;
    overflow-wrap: break-word;
    max-width: 100%;
  }

  p, span, div {
    overflow-wrap: break-word;
  }

  /* Prevent tables from overflowing on mobile */
  .ant-table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
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
        <MetricSystemProvider isMetric={pageProps.org?.useMetricSystem ?? false}>
          <Head>
            <title>Welcome to Chart-Reuse by Upstream</title>
            <link rel='icon' href='/favicon.png' key='favicon' />
          </Head>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <ConfigProvider theme={themeConfig}>
                <GlobalStyles />
                <ErrorBoundary>{getLayout(<Component {...pageProps} />, pageProps)}</ErrorBoundary>
                <FeedbackWidget />
              </ConfigProvider>
            </AuthProvider>
          </QueryClientProvider>
        </MetricSystemProvider>
      </CurrencyProvider>
    </>
  );
}
export default MyApp;

const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: '#2bbe50',
    colorLink: '#2bbe50',
    fontFamily: 'Poppins, Helvetica, Arial, sans-serif'
  },
  components: {
    Button: {
      colorPrimary: '#95ee49',
      // by default, ghost buttons have a border color of white (which is not visible)
      // use the colors for default: https://ant.design/components/button#presetcolors
      defaultGhostBorderColor: '#d9d9d9',
      defaultGhostColor: 'rgba(0,0,0,0.88)'
    },
    Radio: {
      borderRadius: 0
    }
  }
};
