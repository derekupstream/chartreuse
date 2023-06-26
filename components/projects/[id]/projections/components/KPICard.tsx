import { Typography } from 'antd';
import styled from 'styled-components';

import Card from './Card';
import PercentTag from './PercentTag';
import { CardTitle } from './styles';

export const Value = styled(Typography.Text)`
  font-weight: bold;
  font-size: 32px;
  line-height: 40px;
  margin-right: 10px;
  color: #141414;
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
  title?: string;
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
  const { changePercent, changeStr, children } = props;

  return (
    <Header>
      {props.title && <CardTitle>{props.title}</CardTitle>}
      <div>
        <Value>{changeStr}</Value> {changePercent && <PercentTag value={changePercent} />}
      </div>
    </Header>
  );
};

export default CardComponent;
