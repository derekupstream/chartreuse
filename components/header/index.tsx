import Head from 'next/head'

type Props = {
  children?: any
  title: string
}

const Header: React.FC<Props> = ({ title, children }) => {
  return (
    <Head>
      <title>{title} | Chart Reuse by Upstream</title>
      {children}
    </Head>
  )
}

export default Header
