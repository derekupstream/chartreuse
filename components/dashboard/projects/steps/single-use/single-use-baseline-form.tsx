import { Button, Form, Input, Radio, Typography } from "antd";
import * as S from "../styles";
import { SingleUseLineItem } from "api/calculator/types/projects";

type FormProps = Record<keyof SingleUseLineItem, string | undefined>;

export default function SelectQuantityStep({
  input,
  productName,
  goBack,
  onSubmit,
}: {
  input?: Partial<SingleUseLineItem>;
  productName?: string;
  goBack: () => void;
  onSubmit: (form: Partial<SingleUseLineItem>) => void;
}) {
  const [form] = Form.useForm<FormProps>();

  function _onSubmit(values: FormProps) {
    onSubmit({
      frequency: values.frequency as SingleUseLineItem["frequency"],
      unitsPerCase: parseInt(values.unitsPerCase || "0"),
      casesPurchased: parseInt(values.casesPurchased || "0"),
      caseCost: parseInt(values.caseCost || "0"),
    });
  }

  return (
    <Form form={form} layout="vertical" onFinish={_onSubmit}>
      <Typography.Title level={4}>{productName}</Typography.Title>

      <Form.Item label="Purchasing Frequency" name="frequency">
        <Radio.Group>
          <Radio.Button value="Daily">Daily</Radio.Button>
          <Radio.Button value="Weekly">Weekly</Radio.Button>
          <Radio.Button value="Monthly">Monthly</Radio.Button>
          <Radio.Button value="Annually">Annually</Radio.Button>
        </Radio.Group>
      </Form.Item>

      <Form.Item
        name="casesPurchased"
        label="Cases Purchased Per Week"
        rules={[{ required: true }]}
      >
        <Input type="number" />
      </Form.Item>

      <Form.Item
        name="unitsPerCase"
        label="Units per case"
        rules={[{ required: true }]}
      >
        <Input type="number" />
      </Form.Item>

      <Form.Item
        name="caseCost"
        label="Cost per case"
        rules={[{ required: true }]}
      >
        <Input type="number" />
      </Form.Item>

      <S.BoxEnd>
        <div></div>
        {/* <Button onClick={goBack}>{"Go Back"}</Button>  disable until we figure out how to properly load existing state in previous step! */}
        <Button type="primary" htmlType="submit">
          {"Next >"}
        </Button>
      </S.BoxEnd>
    </Form>
  );
}
