import { Form, Input, Button, Typography } from "antd";
import { FirebaseAuthProvider, googleProvider } from "lib/firebaseClient";
import Link from "next/link";

import * as S from "./styles";

type Props = {
  onSubmit: (values: unknown) => void;
  onSubmitWithProvider: (provider: FirebaseAuthProvider) => void;
};

export default function SignupForm({ onSubmit, onSubmitWithProvider }: Props) {
  return (
    <S.Wrapper>
      <S.Title>Signup</S.Title>
      <S.SignupForm
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
            Signup
          </Button>
        </Form.Item>
      </S.SignupForm>
      <Link href="/login" passHref>
        <Typography.Link>Already have an account? Go to login</Typography.Link>
      </Link>
      <Button
        onClick={() => onSubmitWithProvider(googleProvider)}
        type="primary"
        block
      >
        Signup with Google
      </Button>
    </S.Wrapper>
  );
}
