import { GetServerSideProps } from "next";
import nookies from "nookies";
import { verifyIdToken } from "lib/firebaseAdmin";
import prisma from "lib/prisma";
import { Prisma } from "@prisma/client";

import ProjectSteps from "components/dashboard/projects/steps";
import { Props, Template } from "components/dashboard";
import { PageProps } from "pages/_app";
import { UserDataToInclude } from "pages";

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    const token = await verifyIdToken(cookies.token);

    const user = await prisma.user.findUnique<Prisma.UserFindUniqueArgs>({
      where: {
        id: token.uid,
      },
      include: UserDataToInclude,
    });

    if (!user) {
      return {
        redirect: {
          permanent: false,
          destination: "/org-setup",
        },
      };
    }

    return {
      props: {
        user: JSON.parse(JSON.stringify(user)),
      },
    };
  } catch (error: any) {
    return {
      redirect: {
        permanent: false,
        destination: "/login",
      },
    };
  }
};

const NewProjectPage = ({ user }: Props) => {
  return <ProjectSteps user={user} />;
};

NewProjectPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => {
  return (
    <Template {...pageProps} selectedMenuItem="projects">
      {page}
    </Template>
  );
};

export default NewProjectPage;
