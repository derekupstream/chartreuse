import { useRouter } from "next/router";
import {
  Button,
  Space,
  Table,
  Tag,
  Typography,
  Popconfirm,
  message,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { AccountDataType, Props } from "components/dashboard";
import { useMutation } from "react-query";
import { useCallback } from "react";

import * as S from "../styles";

export default function Members({ user }: Props) {
  const router = useRouter();

  const deleteAccount = useMutation((id: string) => {
    return fetch(`/api/profile/${id}`, {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
      },
    });
  });

  const handleAccountDeletion = useCallback(
    async (id: string) => {
      try {
        deleteAccount.mutate(id, {
          onSuccess: () => {
            message.success(`Account deleted`);
            router.replace(router.asPath);
          },
          onError: (err) => {
            message.error((err as Error)?.message);
          },
        });
      } catch (error) {
        message.error(error.message);
      }
    },
    [deleteAccount, router]
  );

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      // eslint-disable-next-line react/display-name
      render: (text: string) => {
        return text || "-";
      },
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Job title",
      dataIndex: "jobTitle",
      key: "jobTitle",
      // eslint-disable-next-line react/display-name
      render: (text: string) => {
        return text || "-";
      },
    },
    {
      title: "Account",
      dataIndex: "account",
      key: "account",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      // eslint-disable-next-line react/display-name
      render: (_: string, record: any) => {
        return (
          <Space size="small">
            {record.invitingPending ? (
              <Tag color="orange">Pending</Tag>
            ) : (
              <Tag color="blue">Active</Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      // eslint-disable-next-line react/display-name
      render: (_: any, record: any) => {
        return (
          <Space size="middle">
            <Button
              // TODO: Edit member
              onClick={() => router.push(`/edit-member-profile/${record.key}`)}
              icon={<EditOutlined />}
              disabled={!record.name}
            />
            <Popconfirm
              title={
                <Space direction="vertical" size="small">
                  <Typography.Title level={4}>
                    Are you sure you want to delete the user &quot;
                    {record.name}&quot;?
                  </Typography.Title>
                  <Typography.Text>It&apos;s permanent.</Typography.Text>
                </Space>
              }
              onConfirm={() => handleAccountDeletion(record.key)}
            >
              <Button
                icon={<DeleteOutlined />}
                loading={deleteAccount.isLoading}
                disabled={!record.name}
              />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  const data = user.org.accounts.reduce(
    (data: any[], account: AccountDataType) => {
      return data.concat(
        account.users
          .map((user) => {
            const invitingPending = !!account.invites.find(
              (i) => i.email === user.email && !i.accepted
            );

            return {
              key: user.id,
              name: user.name,
              email: user.email,
              jobTitle: user.title,
              account: user.account.name,
              status: invitingPending ? "Pending" : "Active",
              invitingPending,
            };
          })
          .concat(
            account.invites
              .filter((i) => !i.accepted)
              .map((invite) => ({
                key: invite.id,
                name: "",
                email: invite.email,
                jobTitle: "",
                account: invite.account.name,
                status: "Pending",
                invitingPending: true,
              }))
          )
      );
    },
    []
  );

  const handleAddAccountUser = () => {
    router.push("/invite-member?dashboard=1");
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <S.SpaceBetween>
        <Typography.Title>Account members</Typography.Title>
        <Button onClick={handleAddAccountUser} icon={<PlusOutlined />}>
          Add user
        </Button>
      </S.SpaceBetween>
      {data.length > 0 && (
        <Table columns={columns} dataSource={data} pagination={false} />
      )}
      {data.length === 0 && (
        <Typography.Text>
          You have no users in your account. Click ‘+ Add user’ above to get
          started.
        </Typography.Text>
      )}
    </Space>
  );
}
