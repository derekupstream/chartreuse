import { Typography } from 'antd';
import styled from 'styled-components';

import Card from '../../projections/components/card';
import { Value } from '../../projections/components/kpi-card';
import PercentTag from '../../projections/components/percent-tag';
import { CardTitle } from '../../projections/components/styles';

export const Header = styled.div`
  display: flex;
  flex-direction: column;
  ${CardTitle}, ${Value} {
    margin-bottom: 16px;
  }
  @media print {
    ${Value} {
      font-size: 30px !important;
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
      <Value style={{ fontSize: 40 }}>{changeStr}</Value>
      <div>{changePercent && <PercentTag value={changePercent} />}</div>
    </Header>
  );
};

export default CardComponent;
