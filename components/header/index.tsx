import Head from 'next/head'

type Props = {
  children?: any
  title: string
}

const siteName = 'Chart Reuse by Upstream'

const Header: React.FC<Props> = ({ title, children }) => {
  return (
    <Head>
      <title>{title ? `${title} | ${siteName}` : siteName}</title>
      {children}
    </Head>
  )
}

export default Header
