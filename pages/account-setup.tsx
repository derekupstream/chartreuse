import { useCallback } from "react";
import AccountSetupForm from "components/account-setup-form";
import Header from "components/header";
import { message } from "antd";
import FormPageTemplate from "components/form-page-template";
import { useMutation } from "react-query";
import { GetServerSideProps } from "next";
import nookies from "nookies";
import { verifyIdToken } from "lib/firebaseAdmin";
import PageLoader from "components/page-loader";
import prisma from "lib/prisma";
import { useRouter } from "next/router";
import Link from "next/link";
import { ArrowLeftOutlined } from "@ant-design/icons";

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    const token = await verifyIdToken(cookies.token);

    const user = await prisma.user.findUnique({
      where: {
        id: token.uid,
      },
      include: {
        org: true,
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
      props: JSON.parse(
        JSON.stringify({
          user: user,
          org: user.org,
        })
      ),
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

type AccountSetupFields = {
  name: string;
  email: string;
  useOrgEmail: boolean;
};

type Props = {
  user: {
    id: string;
  };
  org: {
    id: string;
  };
};

export default function AccountSetup({ org, user }: Props) {
  const router = useRouter();

  const createAccount = useMutation((data: any) => {
    return fetch("/api/account", {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "content-type": "application/json",
      },
    });
  });

  const handleAccountSetupCreation = useCallback(
    ({ name, email, useOrgEmail }: AccountSetupFields) => {
      createAccount.mutate(
        {
          name,
          email,
          useOrgEmail,
          orgId: org.id,
          userId: user.id,
        },
        {
          onSuccess: () => {
            if (!useOrgEmail) {
              message.success("Account contact invited.");
            } else {
              // send user to first step of the calculator
              router.push("/projects/new");
            }
          },
          onError: (err) => {
            message.error((err as Error)?.message);
          },
        }
      );
    },
    [createAccount, org.id, router, user.id]
  );

  if (!org) return <PageLoader />;

  const fromDashboard = !!parseInt(router.query.dashboard as string, 10);

  return (
    <>
      <Header title="Org Account" />

      <main>
        <FormPageTemplate
          title="Setup a company account"
          subtitle="Create an account for any of your clients. Don’t have client accounts? You can use your organization information for the account section."
          navBackLink={
            fromDashboard ? (
              <Link href="/">
                <a>
                  <ArrowLeftOutlined /> back to dashboard
                </a>
              </Link>
            ) : undefined
          }
        >
          <AccountSetupForm
            onSubmit={handleAccountSetupCreation as (values: unknown) => void}
            isLoading={createAccount.isLoading}
          />
        </FormPageTemplate>
      </main>
    </>
  );
}
