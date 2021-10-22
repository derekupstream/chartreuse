import { GetServerSideProps } from "next";

import Accounts from "components/dashboard/accounts";
import { Props, Template } from "components/dashboard";
import { PageProps } from "pages/_app";
import { checkLogin } from "lib/middleware";

export const getServerSideProps: GetServerSideProps = async (context) => {
  return checkLogin(context);
};

const AccountsPage = ({ user }: Props) => {
  return <Accounts user={user} />;
};

AccountsPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => {
  return (
    <Template {...pageProps} selectedMenuItem="accounts">
      {page}
    </Template>
  );
};

export default AccountsPage;
