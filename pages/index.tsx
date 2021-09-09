import { GetServerSideProps } from "next";
import Header from "components/header";
import nookies from "nookies";
import { verifyIdToken } from "lib/firebaseAdmin";
import PageLoader from "components/page-loader";
import prisma from "lib/prisma";
import Dashboard, { Props } from "components/dashboard";
import { Prisma } from "@prisma/client";

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    const token = await verifyIdToken(cookies.token);

    const user = await prisma.user.findUnique<Prisma.UserFindUniqueArgs>({
      where: {
        id: token.uid,
      },
      include: {
        org: {
          include: {
            accounts: {
              include: {
                invites: {
                  include: {
                    account: true,
                  },
                },
                users: {
                  include: {
                    account: true,
                  },
                },
              },
            },
          },
        },
      },
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
  } catch (error) {
    return {
      redirect: {
        permanent: false,
        destination: "/login",
      },
    };
  }
};

export default function DashboardPage({ user }: Props) {
  if (!user) return <PageLoader />;

  return (
    <>
      <Header title="Dashboard" />
      <Dashboard user={user} />
    </>
  );
}
