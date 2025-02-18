import { Form } from 'antd';
import styled from 'styled-components';

export const OrgSetupForm = styled(Form)`
  width: 100%;

  .ant-select-selection-item {
    text-align: left;
  }
` as typeof Form;

export const Wrapper = styled.div`
  width: 317px;
  margin: 0 auto;
`;
