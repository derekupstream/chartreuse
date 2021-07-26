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
      context.res.writeHead(302, { location: "/org-setup" });
      context.res.end();

      return { props: { user: null, org: null } };
    }

    return {
      props: JSON.parse(
        JSON.stringify({
          user: user,
          org: user.org,
        })
      ),
    };
  } catch (error) {
    context.res.writeHead(302, { location: "/login" });
    context.res.end();

    return { props: { user: null, org: null } };
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
    return fetch("/api/account-setup", {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "content-type": "application/json",
      },
    });
  });

  const handleAccountSetupCreation = useCallback(
    async ({ name, email, useOrgEmail }: AccountSetupFields) => {
      try {
        await createAccount.mutate(
          {
            name,
            // TODO: use the given email onve we have a paid mailgun plan
            email: "rn.schiehll@gmail.com",
            useOrgEmail,
            orgId: org.id,
            userId: user.id,
          },
          {
            onSuccess: () => {
              if (!useOrgEmail) {
                message.success("Account contact invited.");
              }

              router.push("/");
            },
            onError: (err) => {
              message.error((err as Error)?.message);
            },
          }
        );
      } catch (error) {
        message.error(error.message);
      }
    },
    [createAccount, org.id, router, user.id]
  );

  if (!org) return <PageLoader />;

  return (
    <>
      <Header title="Org Account" />

      <main>
        <FormPageTemplate
          title="Setup a company account"
          subtitle="Create an account for any of your clients. Don’t have client accounts? You can use your organization information for the account section."
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
