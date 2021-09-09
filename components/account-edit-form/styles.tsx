import styled from "styled-components";
import { Form, Space } from "antd";

export const AccountEditForm = styled(Form)`
  width: 100%;

  .ant-select-selection-item,
  .ant-checkbox-wrapper,
  .ant-form-item-explain-error {
    text-align: left;
  }
`;

export const Wrapper = styled.div`
  width: 317px;
  margin: 0 auto;
`;

export const ActionsSpace = styled(Space)`
  width: 100%;

  .ant-space-item {
    width: 100%;
  }
`;
