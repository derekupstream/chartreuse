import { GetServerSideProps } from "next";
import Header from "components/header";
import nookies from "nookies";
import { verifyIdToken } from "lib/firebaseAdmin";
import PageLoader from "components/page-loader";
import prisma from "lib/prisma";
import Dashboard, { Props } from "components/dashboard";

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    const token = await verifyIdToken(cookies.token);

    const user = await prisma.user.findUnique({
      where: {
        id: token.uid,
      },
      include: {
        org: {
          include: {
            accounts: true,
          },
        },
      },
    });

    if (!user) {
      context.res.writeHead(302, { location: "/org-setup" });
      context.res.end();

      return { props: { user: null } };
    }

    return {
      props: {
        user: JSON.parse(JSON.stringify(user)),
      },
    };
  } catch (error) {
    context.res.writeHead(302, { location: "/login" });
    context.res.end();

    return { props: { user: null } };
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
