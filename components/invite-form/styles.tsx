import styled from "styled-components";
import { Form } from "antd";

export const InviteForm = styled(Form)`
  width: 100%;

  .ant-select-selection-item,
  .ant-select-selection-placeholder,
  .ant-checkbox-wrapper,
  .ant-form-item-explain-error {
    text-align: left;
  }
`;

export const Wrapper = styled.div`
  width: 317px;
  margin: 0 auto;
`;
