import { Button, Form, Input, Radio, Typography } from "antd";
import * as S from "../styles";
import { SingleUseLineItem } from "api/calculator/types/projects";

type FormProps = Record<keyof SingleUseLineItem, string | undefined>;

export default function SelectQuantityForecastStep({
  input,
  goBack,
  productName,
  onSubmit,
}: {
  input?: Partial<SingleUseLineItem>;
  goBack: () => void;
  productName?: string;
  onSubmit: (
    form: Pick<SingleUseLineItem, "newCaseCost" | "newCasesPurchased">
  ) => void;
}) {
  const [form] = Form.useForm<FormProps>();

  function _onSubmit(values: FormProps) {
    onSubmit({
      newCasesPurchased: parseInt(values.casesPurchased || "0"),
      newCaseCost: parseInt(values.caseCost || "0"),
    });
  }

  return (
    <Form form={form} layout="vertical" onFinish={_onSubmit}>
      <Typography.Title level={4}>{productName}</Typography.Title>

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

      <S.BoxEnd>
        <div></div>
        {/* <Button onClick={goBack}>{"Go Back"}</Button>  disable until we figure out how to properly load existing state in previous step! */}
        <Button type="primary" htmlType="submit">
          Save
        </Button>
      </S.BoxEnd>
    </Form>
  );
}
