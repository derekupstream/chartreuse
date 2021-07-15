import { RightOutlined } from "@ant-design/icons";
import { Form, Input, Button, Select } from "antd";
import { Option } from "antd/lib/mentions";

import * as S from "./styles";

type Props = {
  onSubmit: (values: unknown) => void;
  isLoading?: boolean;
};

export default function OrgSetupForm({ onSubmit, isLoading }: Props) {
  return (
    <S.Wrapper>
      <S.OrgSetupForm
        name="orgAccount"
        layout="vertical"
        initialValues={{ remember: true }}
        onFinish={onSubmit}
      >
        <Form.Item
          label="Your name"
          name="name"
          rules={[
            {
              required: true,
              message: "Please input your name!",
            },
          ]}
        >
          <Input placeholder="Your name" />
        </Form.Item>

        <Form.Item
          label="Your job title"
          name="title"
          rules={[{ required: true, message: "Please input your title!" }]}
        >
          <Input placeholder="Your job title" />
        </Form.Item>

        <Form.Item
          label="Your contact phone number"
          name="phone"
          rules={[
            {
              required: true,
              message: "Please input your phone!",
            },
          ]}
        >
          <Input placeholder="(720) 555-1234" />
        </Form.Item>

        <Form.Item
          label="Organization name"
          name="orgName"
          rules={[
            {
              required: true,
              message: "Please input your organization name!",
            },
          ]}
        >
          <Input placeholder="Organization name" />
        </Form.Item>

        <Form.Item
          label="Number of client accounts"
          name="numberOfClientAccounts"
        >
          <Select defaultValue="1">
            <Option value="1">1</Option>
            <Option value="2">2</Option>
            <Option value="3">3</Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={isLoading}>
            Create Organization <RightOutlined />
          </Button>
        </Form.Item>
      </S.OrgSetupForm>
    </S.Wrapper>
  );
}
