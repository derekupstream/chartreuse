import { Button, Drawer, Radio, Typography } from "antd";
import { useState } from "react";
import { PlusOutlined } from "@ant-design/icons";

import { StepProps } from "components/dashboard/projects/Step";
import * as S from "../styles";
import { PRODUCT_CATEGORIES } from "api/calculator/constants/product-categories";

type SingleUseProps = Omit<StepProps, "step">;

const SingleUse = ({ user, project, onComplete }: SingleUseProps) => {
  const [isDrawerVisible, setIsDrawerVisible] = useState<boolean>(false);

  return (
    <S.Wrapper>
      <Typography.Title level={2}>Single-use purchasing</Typography.Title>
      <Typography.Title level={4} css="max-width: 80%;">
        Next: Create an inventory of all single-use items you purchase
        regularly. If a close match doesn&apos;t exist in the system, please
        contact Upstream to add to the single-use product database.
      </Typography.Title>
      <Typography.Text>
        Click ‘+ Add item’ to get started with your single-use purchasing.{" "}
        <Button
          onClick={() => setIsDrawerVisible(true)}
          icon={<PlusOutlined />}
        >
          Add item
        </Button>
      </Typography.Text>
      <Drawer
        title="Add single-use item"
        placement="right"
        onClose={() => setIsDrawerVisible(false)}
        visible={isDrawerVisible}
        contentWrapperStyle={{ width: "600px" }}
      >
        <Typography.Title level={4}>Category</Typography.Title>
        <S.OptionSelection
          options={PRODUCT_CATEGORIES.map((category) => ({
            label: category.name,
            value: category.id,
          }))}
          optionType="button"
        />
      </Drawer>
    </S.Wrapper>
  );
};

export default SingleUse;
