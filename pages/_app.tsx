import type { AppProps } from 'next/app'
import Head from 'next/head'
import { AuthProvider } from 'lib/auth/auth.browser'
import { QueryClient, QueryClientProvider } from 'react-query'
import { createGlobalStyle } from 'styled-components'
import 'styles/antd.less'
import '@antv/xflow/dist/index.css'
import { NextPage } from 'next'

const GlobalStyles = createGlobalStyle`
  body {
    background-color: white;
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

  return (
    <>
      <Head>
        <title>Welcome to CharmVerse</title>
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
