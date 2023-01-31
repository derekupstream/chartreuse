import { Divider as BaseDivider } from 'antd';
import styled from 'styled-components';

export const SectionContainer = styled.div`
  margin-bottom: 24px;
`;

export const SectionHeader = styled.p`
  font-size: 20px;
  line-height: 28px;
  font-weight: 600;
`;

export const CardTitle = styled.span`
  color: #262626;
  font-size: 16px;
  line-height: 32px;
  font-weight: 700;
  margin-right: 6px;
`;

export const ChartTitle = styled.p`
  font-weight: bold;
  font-size: 12px;
  line-height: 24px;
  margin-bottom: 17px;
`;

export const Divider = styled(BaseDivider)`
  margin-top: 16px;
  margin-bottom: 24px;
`;

export const ChangeColumn = styled.div`
  display: flex;
  justify-content: space-between;
  span:last-child {
    color: rgba(0, 0, 0, 0.45);
  }
`;
