import { useCallback } from "react";
import { useRouter } from "next/router";
import OrgAccountForm from "components/org-account-form";
import Header from "components/header";
import { message } from "antd";
import { useMutation } from "react-query";
import { useAuth } from "hooks/useAuth";

type OrgAccountFields = {
  title: string;
  name: string;
};

export default function OrgAccount() {
  const router = useRouter();
  const { user } = useAuth();

  const createOrgAccount = useMutation((data: any) => {
    return fetch("/api/org-account", {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "content-type": "application/json",
      },
    });
  });

  const handleOrgAccountCreation = useCallback(
    async ({ title, name }: OrgAccountFields) => {
      try {
        createOrgAccount.mutate(
          {
            id: user?.uid,
            email: user?.email,
            title,
            name,
          },
          {
            onSuccess: () => {
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
    [createOrgAccount, router, user?.email, user?.uid]
  );

  return (
    <>
      <Header title="Org Account" />

      <main>
        <OrgAccountForm
          onSubmit={handleOrgAccountCreation as (values: unknown) => void}
          isLoading={createOrgAccount.isLoading}
        />
      </main>
    </>
  );
}
