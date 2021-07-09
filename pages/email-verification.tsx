import { message, Space, Typography } from "antd";
import Header from "components/header";
import PageLoader from "components/page-loader";
import { useAuth } from "hooks/useAuth";
import { useRouter } from "next/router";
import { destroyCookie, setCookie } from "nookies";
import { useEffect } from "react";

export default function EmailVerification() {
  const { user } = useAuth();
  const router = useRouter();

  const origin =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "";

  useEffect(() => {
    const verifyEmail = async () => {
      destroyCookie(null, "emailVerified");

      if (user?.emailVerified) {
        setCookie(null, "emailVerified", "true");
        router.push("/org-account");
      } else {
        try {
          await user?.sendEmailVerification({
            url: `${origin}/org-account`,
          });
          setCookie(null, "emailVerified", "true");
        } catch (error) {
          message.error(error.message);
        }
      }
    };

    if (user) {
      verifyEmail();
    }
  }, [origin, router, user]);

  if (!user) return <PageLoader />;

  return (
    <>
      <Header title="Email verification" />

      <main>
        <Space direction="vertical">
          <Typography.Title level={2}>Got it!</Typography.Title>
          <Typography.Text strong>
            Check your email for a confirmation, and link to continue setting up
            your organization.
          </Typography.Text>
        </Space>
      </main>
    </>
  );
}
