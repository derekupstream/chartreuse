import { Form } from 'antd';
import styled from 'styled-components';

export const SectionData = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

export const SectionContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 24px;
`;

export const SectionTitle = styled.span`
  font-size: 20px;
  line-height: 30px;
  font-weight: 800;
`;

export const FormItem = styled(Form.Item)`
  .ant-form-item-label label {
    font-size: 18px;
    font-weight: 500;
    height: auto;
    &:after {
      content: '';
    }
  }
`;
