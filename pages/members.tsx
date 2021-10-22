import { GetServerSideProps } from "next";

import nookies from "nookies";
import { verifyIdToken } from "lib/firebaseAdmin";
import prisma from "lib/prisma";
import { Prisma } from "@prisma/client";

import Members from "components/dashboard/members";
import { Props, Template } from "components/dashboard";
import { PageProps } from "pages/_app";
import { checkLogin } from "lib/middleware";

export const getServerSideProps: GetServerSideProps = async (context) => {
  return checkLogin(context);
};

const MembersPage = ({ user }: Props) => {
  return <Members user={user} />;
};

MembersPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => {
  return (
    <Template {...pageProps} selectedMenuItem="members">
      {page}
    </Template>
  );
};

export default MembersPage;
