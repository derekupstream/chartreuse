import { Typography } from 'antd';
import styled from 'styled-components';

import Card from './Card';
import PercentTag from './PercentTag';
import { ReactNode } from 'react';
import { CardTitle } from './styles';

export const Value = styled(Typography.Text)`
  font-weight: bold;
  font-size: clamp(20px, 5vw, 32px);
  line-height: 1.25;
  margin-right: 10px;
  color: #141414;
  white-space: nowrap;
`;

export const Header = styled.div`
  display: flex;
  flex-direction: column;
  ${CardTitle} {
    margin-bottom: 16px;
  }
  div {
    display: flex;
    align-items: center;
  }
  @media print {
    ${CardTitle} {
      font-size: 14px !important;
    }
    ${Value} {
      font-size: 24px !important;
    }
  }
`;

type Props = {
  children?: any;
  baseline?: number;
  forecast?: number;
  changeStr: string;
  changePercent?: number;
  title?: string | ReactNode;
  style?: any;
};

const CardComponent: React.FC<Props> = ({ children, style, ...props }) => {
  return (
    <Card style={style}>
      <KPIContent {...props} />
      {children}
    </Card>
  );
};

export const KPIContent: React.FC<Props> = props => {
  const { changePercent, changeStr } = props;

  return (
    <Header>
      {props.title && <CardTitle>{props.title}</CardTitle>}
      <div>
        <Value>{changeStr}</Value> {changePercent ? <PercentTag value={changePercent} /> : null}
      </div>
    </Header>
  );
};

export default CardComponent;
