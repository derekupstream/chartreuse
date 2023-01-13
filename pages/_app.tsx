import type { AppProps } from 'next/app'
import Head from 'next/head'
import { AuthProvider } from 'lib/auth/auth.browser'
import { QueryClient, QueryClientProvider } from 'react-query'
import { createGlobalStyle } from 'styled-components'
import 'styles/antd.less'
import '@antv/xflow/dist/index.css'
import { useRouter } from 'next/router'
import { NextPage } from 'next'
import { useEffect } from 'react'
import { analytics } from 'lib/analytics/mixpanel.browser'

// Track initial pageview
if (typeof window !== 'undefined') {
  analytics.page()
}

const GlobalStyles = createGlobalStyle`
  body {
    background-color: #f4f3f0;
  }
`

const queryClient = new QueryClient()

type Props = AppProps & {
  Component: Page
}

export type PageProps = any

type Page<P = {}> = NextPage<P> & {
  getLayout?: (page: React.ReactNode, pageProps: PageProps) => React.ReactNode
}

function MyApp({ Component, pageProps }: Props) {
  const getLayout = Component.getLayout ?? ((page: React.ReactNode) => page)
  const router = useRouter()

  useEffect(() => {
    const handleRouteChange = () => {
      analytics.page()
    }
    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])

  return (
    <>
      <Head>
        <title>Welcome to Chart Reuse by Upstream</title>
        <link rel="icon" href="/favicon.png" key="favicon" />
      </Head>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <GlobalStyles />
          {getLayout(<Component {...pageProps} />, pageProps)}
        </AuthProvider>
      </QueryClientProvider>
    </>
  )
}
export default MyApp
