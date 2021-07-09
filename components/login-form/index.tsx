import { Form, Input, Button, Typography } from "antd";
import Link from "next/link";

import * as S from "./styles";

type Props = {
  onSubmit: (values: unknown) => void;
};

export default function LoginForm({ onSubmit }: Props) {
  return (
    <S.Wrapper>
      <S.Title>Login</S.Title>
      <S.LoginForm
        name="login"
        layout="vertical"
        initialValues={{ remember: true }}
        onFinish={onSubmit}
      >
        <Form.Item
          label="Email"
          name="email"
          rules={[
            {
              required: true,
              type: "email",
              message: "Please input a valid email!",
            },
          ]}
        >
          <Input type="email" />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: "Please input your password!" }]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Login
          </Button>
        </Form.Item>
      </S.LoginForm>
      <Link href="/signup" passHref>
        <Typography.Link>
          Don&apos;t have an account yet? Go to signup
        </Typography.Link>
      </Link>
    </S.Wrapper>
  );
}
