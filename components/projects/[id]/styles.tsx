import { Card, Radio, Row, Typography } from 'antd';
import styled from 'styled-components';

export const Wrapper = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  width: 100%;
  margin-top: 20px;

  h1 {
    font-size: clamp(20px, 4vw, 34px) !important;
    margin-bottom: 0.3em !important;
  }

  @print media {
    margin-top: 0;
  }
`;

/* Use this instead of an inline flex div when a page title sits next to action buttons */
/* Matches the dashboard's body-text style: small, muted */
export const StepDescription = styled.div`
  font-size: 13px;
  color: rgba(0, 0, 0, 0.55);
  line-height: 1.6;
  margin-bottom: 16px;
`;

export const PageTitleRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 0;

  h1 {
    margin: 0 !important;
  }

  .actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
`;

// adds some margin on mobile
export const ResponsiveWrapper = styled(Wrapper)`
  max-width: 1148px;
  padding: 0 24px;
`;

export const ProjectSetupWrapper = styled(Wrapper)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  max-width: 460px;
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

export const InfoRow = styled((props: any) => <Row gutter={[30, 30]} {...props} />)`
  margin-bottom: 30px;
`;

export const InfoCard = styled(Card)<{ theme?: Props['theme'] }>`
  border-top: 8px solid ${props => COLORS[props.theme as Props['theme']] || 'white'};
  box-shadow: 0px 0px 12px rgba(0, 0, 0, 0.08);
  border-radius: 8px;
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
