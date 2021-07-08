import { Form, Input, Button, Typography } from "antd";

import * as S from "./styles";

type Props = {
  onSubmit: (values: unknown) => void;
  isLoading?: boolean;
};

export default function OrgAccountForm({ onSubmit, isLoading }: Props) {
  return (
    <S.Wrapper>
      <S.Title>Create Org Account</S.Title>
      <S.OrgAccountForm
        name="orgAccount"
        layout="vertical"
        initialValues={{ remember: true }}
        onFinish={onSubmit}
      >
        <Form.Item
          label="Name"
          name="name"
          rules={[
            {
              required: true,
              message: "Please input your name!",
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Title"
          name="title"
          rules={[{ required: true, message: "Please input your title!" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={isLoading}>
            Get started
          </Button>
        </Form.Item>
      </S.OrgAccountForm>
    </S.Wrapper>
  );
}
