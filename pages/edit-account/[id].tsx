import { useCallback } from "react";
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
import AccountEditForm from "components/account-edit-form";

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const cookies = nookies.get(context);
    const token = await verifyIdToken(cookies.token);

    const { id } = context.query;

    if (!id) {
      return {
        redirect: {
          permanent: false,
          destination: "/",
        },
      };
    }

    const user = await prisma.user.findUnique({
      where: {
        id: token.uid,
      },
      include: {
        org: {
          include: {
            accounts: {
              where: {
                id: id as string,
              },
              include: {
                users: true,
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
          destination: "/",
        },
      };
    }

    return {
      props: JSON.parse(
        JSON.stringify({
          org: user.org,
        })
      ),
    };
  } catch (error: any) {
    return {
      redirect: {
        permanent: false,
        destination: "/",
      },
    };
  }
};

type AccountEditFields = {
  name: string;
};

type Props = {
  org: {
    id: string;
    accounts: {
      id: string;
      name: string;
    }[];
  };
};

export default function EditAccount({ org }: Props) {
  const router = useRouter();

  const updateAccount = useMutation(
    ({ id, data }: { id: string; data: any }) => {
      return fetch(`/api/account/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
        headers: {
          "content-type": "application/json",
        },
      });
    }
  );

  const handleAccountUpdate = useCallback(
    ({ name }: AccountEditFields) => {
      updateAccount.mutate(
        {
          id: org.accounts[0].id,
          data: { name },
        },
        {
          onSuccess: () => {
            message.success("Account edited with success.");

            router.push("/");
          },
          onError: (err) => {
            message.error((err as Error)?.message);
          },
        }
      );
    },
    [org.accounts, router, updateAccount]
  );

  if (!org) return <PageLoader />;

  return (
    <>
      <Header title="Edit Company Account" />

      <main>
        <FormPageTemplate
          title="Edit company account"
          navBackLink={
            <Link href="/">
              <a>
                <ArrowLeftOutlined /> back to dashboard
              </a>
            </Link>
          }
        >
          <AccountEditForm
            onSubmit={handleAccountUpdate as (values: unknown) => void}
            onCancel={() => router.push("/")}
            isLoading={updateAccount.isLoading}
            initialValues={{ name: org.accounts[0].name }}
          />
        </FormPageTemplate>
      </main>
    </>
  );
}
