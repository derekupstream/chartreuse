import { Form, Input, Button, Typography, Divider, Space } from "antd";
import { FirebaseAuthProvider, googleProvider } from "lib/firebaseClient";
import Link from "next/link";
import { GoogleOutlined } from "@ant-design/icons";

import * as S from "./styles";

type Props = {
  onSubmit: (values: unknown) => void;
  onSubmitWithProvider: (provider: FirebaseAuthProvider) => void;
};

export default function LoginForm({ onSubmit, onSubmitWithProvider }: Props) {
  return (
    <S.Wrapper>
      <S.LoginForm name="login" layout="vertical" onFinish={onSubmit}>
        <Form.Item
          label="Email"
          name="email"
          rules={[
            {
              required: true,
              message: "Email is required!",
            },
            {
              type: "email",
              message: "Please input a valid email!",
            },
          ]}
        >
          <Input type="email" placeholder="Your email" />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: "Please input your password!" }]}
        >
          <Input.Password placeholder="Your password" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Sign in
          </Button>
        </Form.Item>
      </S.LoginForm>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Divider>
          <Typography.Text strong>OR</Typography.Text>
        </Divider>
        <Button
          onClick={() => onSubmitWithProvider(googleProvider)}
          type="default"
          block
        >
          <GoogleOutlined /> Sign in with Google
        </Button>
        <Typography.Text>
          <Space>
            Don&apos;t have an account yet?
            <Link href="/signup" passHref>
              <Typography.Link underline>Sign up</Typography.Link>
            </Link>
          </Space>
        </Typography.Text>
      </Space>
    </S.Wrapper>
  );
}
