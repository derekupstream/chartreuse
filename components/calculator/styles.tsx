import { Card, Form, Radio, Row, Typography } from 'antd';
import styled from 'styled-components';

export const Wrapper = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  width: 100%;
  margin-top: 50px;

  @print media {
    margin-top: 0;
  }
`;

export const SetupForm = styled(Form)`
  width: 460px;
`;

export const BoxEnd = styled.div`
  border-top: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  margin: 4em -24px 0;
  padding: 8px 24px 0;
`;

export const RadioGroup = styled(Radio.Group)`
  display: flex;
  width: 100%;

  > label {
    flex: 1;
  }
`;

export const OptionSelection = styled(Radio.Group)`
  & {
    margin-left: -10px;
  }

  .ant-radio-button-wrapper {
    margin: 10px;
  }
`;

type Props = {
  theme: 'baseline' | 'forecast';
};
const COLORS: { [type in Props['theme']]: string } = {
  baseline: '#767382',
  forecast: '#5D798E'
};

// const InfoCard = styled.div<Props>`
//   border-top: 8px solid ${props => COLORS[props.theme as Props['theme']]};
//   background-color: white;
//   border-radius: 8px;
//   padding: 8px 16px;
//   font-weight: normal;
//   text-align: left;
//   box-shadow: 0px 0px 12px rgba(0, 0, 0, 0.08);
//   thead {
//     font-weight: normal;
//   }
//   tbody {
//     font-weight: 700;
//   }
//   td {
//     font-size: 11px;
//     line-height: 16px;
//     padding-right: 20px;
//   }
// `

export const InfoRow = styled(props => <Row gutter={[30, 30]} {...props} />)`
  margin-bottom: 30px;
`;

export const InfoCard = styled(Card)<{ theme?: Props['theme'] }>`
  border-top: 8px solid ${props => COLORS[props.theme as Props['theme']] || 'white'};
  box-shadow: 0px 0px 12px rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  height: 100%;
  .ant-card-body {
    padding: 16px;
  }
  thead {
    font-weight: normal;
  }
  tbody {
    font-weight: 700;
  }
  td {
    font-size: 11px;
    line-height: 16px;
    padding-right: 20px;
  }
`;

export const CardTitle = styled(Typography.Text)`
  font-size: 16px;
  line-height: 32px;
  font-weight: bold;
  color: #262626;
`;

export const SmallText = styled(Typography.Text)`
  font-size: 0.8rem;
`;
export const SmallerText = styled(Typography.Text)`
  font-size: 0.7rem;
`;

export const CategoryIcon = styled.div`
  background-color: #e3e2e0;
  height: 72px;
  width: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 100%;
  svg {
    height: 48px;
    width: 48px;
  }
`;

export const TitleRow = styled.div`
  display: flex;
  margin-top: 24px;
  gap: 10px;
  justify-content: flex-start;
  align-items: center;
  h3 {
    margin-bottom: 0;
  }
`;
