import { Form } from 'antd';
import styled from 'styled-components';

export const SignupForm = styled(Form)`
  width: 100%;

  .ant-form-item-explain {
    text-align: left;
    font-style: italic;
    padding-top: 0.5rem;
  }
` as typeof Form;

export const Wrapper = styled.div`
  max-width: 317px;
  width: 100%;
  margin: 0 auto;
`;
