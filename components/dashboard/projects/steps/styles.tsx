import styled from "styled-components";
import { Form, Radio } from "antd";

export const Wrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  margin-top: 50px;
`;

export const SetupForm = styled(Form)`
  width: 460px;
`;

export const BoxEnd = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 4em;
`;

export const RadioGroup = styled(Radio.Group)`
  display: flex;
  width: 100%;

  > label {
    flex: 1;
  }
`;

export const OptionSelection = styled(Radio.Group)`
  .ant-radio-button-wrapper {
    margin: 10px;
  }

  .ant-radio-button-wrapper:first-child {
    margin-left: 0;
  }
`;
