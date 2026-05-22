import { Form } from 'antd';
import styled from 'styled-components';

export const OrgSetupForm = styled(Form)`
  width: 100%;

  .ant-select-selection-item {
    text-align: left;
  }
` as typeof Form;

export const Wrapper = styled.div`
  max-width: 317px;
  width: 100%;
  margin: 0 auto;
`;
