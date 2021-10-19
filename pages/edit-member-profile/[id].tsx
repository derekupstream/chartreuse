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
import MemberEditForm from "components/member-edit-form";

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

    const admin = await prisma.user.findUnique({
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

    const user = await prisma.user.findUnique({
      where: {
        id: id as string,
      },
      include: {
        account: true,
      },
    });

    if (!admin || !user) {
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
          user: user,
          org: admin.org,
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

type MemberEditFields = {
  name: string;
  email: string;
  title: string;
  phone: string;
  accountId: string;
};

type Props = {
  user: {
    id: string;
    name: string;
    email: string;
    title: string;
    phone: string;
    account: {
      id: string;
    };
  };
  org: {
    id: string;
    accounts: {
      id: string;
      name: string;
    }[];
  };
};

export default function EditMemberProfile({ org, user }: Props) {
  const router = useRouter();

  const updateAccount = useMutation(
    ({ id, data }: { id: string; data: any }) => {
      return fetch(`/api/profile/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
        headers: {
          "content-type": "application/json",
        },
      });
    }
  );

  const handleAccountUpdate = useCallback(
    async (data: MemberEditFields) => {
      try {
        await updateAccount.mutate(
          {
            id: user.id,
            data,
          },
          {
            onSuccess: () => {
              message.success("Account member edited with success.");

              router.push("/");
            },
            onError: (err) => {
              message.error((err as Error)?.message);
            },
          }
        );
      } catch (error: any) {
        message.error(error.message);
      }
    },
    [router, updateAccount, user.id]
  );

  if (!org) return <PageLoader />;

  return (
    <>
      <Header title="Edit Account Member" />

      <main>
        <FormPageTemplate
          title="Edit account member"
          navBackLink={
            <Link href="/">
              <a>
                <ArrowLeftOutlined /> back to dashboard
              </a>
            </Link>
          }
        >
          <MemberEditForm
            onSubmit={handleAccountUpdate as (values: unknown) => void}
            onCancel={() => router.push("/")}
            isLoading={updateAccount.isLoading}
            initialValues={{
              name: user.name,
              email: user.email,
              title: user.title,
              phone: user.phone,
              accountId: user.account.id,
            }}
            accounts={org.accounts}
          />
        </FormPageTemplate>
      </main>
    </>
  );
}
