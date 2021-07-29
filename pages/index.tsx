import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import Header from "components/header";
import { Button, Typography, Space, message } from "antd";
import { useAuth } from "hooks/useAuth";
import nookies from "nookies";
import { verifyIdToken } from "lib/firebaseAdmin";
import PageLoader from "components/page-loader";
import prisma from "lib/prisma";

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    const token = await verifyIdToken(cookies.token);

    const user = await prisma.user.findUnique({
      where: {
        id: token.uid,
      },
    });

    if (!user) {
      return {
        redirect: {
          permanent: false,
          destination: "/org-setup"
        }
      };
    }

    return {
      props: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
    };
  } catch (error) {
    return {
      redirect: {
        permanent: false,
        destination: "/login"
      }
    };
  }
};

type Props = {
  user: {
    id: string;
    email: string;
    name: string;
  };
};

export default function Home({ user }: Props) {
  const { signout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signout();
      router.push("/login");
    } catch (error) {
      message.error(error.message);
    }
  };

  if (!user) return <PageLoader />;

  return (
    <>
      <Header title="Home" />

      <main>
        <Space>
          <Typography.Text>Hey {user?.name}</Typography.Text>
          <Button onClick={handleLogout} type="primary">
            Logout
          </Button>
        </Space>
      </main>
    </>
  );
}
