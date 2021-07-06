import { Form, Input, Button, Typography } from "antd";
import Link from "next/link";

import * as S from "./styles";

export default function SignupForm() {
  const onFinish = (values: any) => {
    console.log({ values });
  };

  return (
    <S.Wrapper>
      <S.Title>Signup</S.Title>
      <S.SignupForm
        name="login"
        layout="vertical"
        initialValues={{ remember: true }}
        onFinish={onFinish}
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
    </S.Wrapper>
  );
}
