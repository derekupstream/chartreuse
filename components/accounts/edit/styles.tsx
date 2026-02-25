import { Form, Space } from 'antd';
import styled from 'styled-components';

export const AccountEditForm = styled(Form)`
  width: 100%;

  .ant-select-selection-item,
  .ant-checkbox-wrapper,
  .ant-form-item-explain-error {
    text-align: left;
  }
` as typeof Form;

export const Wrapper = styled.div`
  max-width: 317px;
  width: 100%;
  margin: 0 auto;
`;

export const ActionsSpace = styled(Space)`
  width: 100%;

  .ant-space-item {
    width: 100%;
  }
`;
