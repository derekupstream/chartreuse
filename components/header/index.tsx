import Head from "next/head";

type Props = {
  title: string;
};

const Header: React.FC<Props> = ({ title, children }) => {
  return (
    <Head>
      <title>Upstream Calculator - {title}</title>
      <link rel="icon" href="/favicon.ico" />
      {children}
    </Head>
  );
};

export default Header;
