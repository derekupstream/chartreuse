import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import Head from "next/head";
import { Button, Typography, Space, message } from "antd";
import { useAuth } from "hooks/useAuth";
import nookies from "nookies";
import { verifyIdToken } from "lib/firebaseAdmin";
import PageLoader from "components/page-loader";

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    const token = await verifyIdToken(cookies.token);

    return {
      props: {
        token,
      },
    };
  } catch (error) {
    context.res.writeHead(302, { location: "/login" });
    context.res.end();

    return { props: { token: null } };
  }
};

type Props = {
  token: {
    email: string;
    uid: string;
  };
};

export default function Home({ token }: Props) {
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

  if (!token) return <PageLoader />;

  return (
    <div>
      <Head>
        <title>Calculator</title>
        <meta name="description" content="Upstream Calculator" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <Space>
          <Typography.Text>Hey {token?.email}</Typography.Text>
          <Button onClick={handleLogout} type="primary">
            Logout
          </Button>
        </Space>
      </main>
    </div>
  );
}
