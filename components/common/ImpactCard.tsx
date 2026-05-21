import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { Card, Tag, Typography } from 'antd';
import type { ReactNode } from 'react';
import styled from 'styled-components';

/**
 * Reusable impact card used on the Analytics dashboard and Scenarios page.
 *
 * Layout (top-to-bottom): label, big number with delta pill, two horizontal
 * comparison bars. Bars are not a single grouped chart — they're two stacked
 * rows whose widths scale to the larger of the two values, which is much
 * easier to scan than a clustered bar chart.
 */

const Wrapper = styled(Card)<{ $clickable?: boolean }>`
  height: 100%;
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
  transition: box-shadow 0.15s ease;
  ${({ $clickable }) =>
    $clickable &&
    `
    &:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }
  `}
`;

const HeadlineRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 8px 0 20px;
`;

const Headline = styled(Typography.Title)`
  margin: 0 !important;
  font-size: 32px !important;
  line-height: 1 !important;
  font-weight: 400 !important;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;

  @media (max-width: 768px) {
    font-size: 26px !important;
  }
`;

const DeltaPill = styled.span<{ $positive: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: ${({ $positive }) => ($positive ? '#52c41a' : '#ff4d4f')};
  color: #fff;
  padding: 3px 8px;
  font-size: 12px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
`;

const ChartArea = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 6px;
  margin-top: 4px;
`;

const BarsBox = styled.div`
  position: relative;
  border-left: 1px solid rgba(0, 0, 0, 0.12);
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  padding: 8px 0;
`;

const GridLines = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  display: flex;
  justify-content: space-between;
`;

const GridTick = styled.div`
  width: 1px;
  background: rgba(0, 0, 0, 0.06);
  height: 100%;
`;

const BarRow = styled.div<{ $width: number; $color: string }>`
  position: relative;
  height: 30px;
  background: rgba(0, 0, 0, 0.02);
  margin: 4px 0;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${({ $width }) => `${$width}%`};
    background: ${({ $color }) => $color};
    transition: width 0.3s ease;
  }
`;

const BarLabel = styled.span`
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  height: 100%;
  padding: 0 10px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.75);
  font-variant-numeric: tabular-nums;
`;

const XAxis = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  padding-left: 1px;
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  color: rgba(0, 0, 0, 0.45);
`;

const Legend = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 12px;
  font-size: 11px;
  color: rgba(0, 0, 0, 0.55);
`;

const Swatch = styled.span<{ $color: string }>`
  display: inline-block;
  width: 10px;
  height: 10px;
  background: ${({ $color }) => $color};
  margin-right: 6px;
  vertical-align: middle;
`;

export type ImpactCardBar = {
  label: string;
  value: number;
  formatted: string;
  color?: string;
};

export type ImpactCardProps = {
  /** Card title — e.g. "Your estimated annual savings" */
  label: string;
  /** Headline number formatted for display */
  headline: ReactNode;
  /** Optional delta percentage (signed). Positive shows green up-arrow, negative red down. */
  deltaPercent?: number;
  /**
   * If true, a negative delta is "good" (e.g. cost reduction). The pill color
   * inverts: negative delta renders green with a down-arrow.
   */
  reverseDeltaColor?: boolean;
  /** Two bars to compare. Bar widths scale to the larger absolute value. */
  bars: [ImpactCardBar, ImpactCardBar];
  /** Formats raw numeric tick values for the x-axis. If omitted, no axis renders. */
  tickFormatter?: (value: number) => string;
  /** Click handler — if provided, card becomes hoverable + clickable. */
  onClick?: () => void;
  /** Hint shown at the bottom of the card when clickable. */
  clickHint?: string;
};

// Round to a clean upper bound for axis ticks: powers of 10 mapped to 1/2/2.5/5.
function niceUpperBound(value: number): number {
  if (value <= 0) return 1;
  const exp = Math.floor(Math.log10(value));
  const pow = Math.pow(10, exp);
  const norm = value / pow;
  const nice = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
  return nice * pow;
}

export function ImpactCard({
  label,
  headline,
  deltaPercent,
  reverseDeltaColor,
  bars,
  tickFormatter,
  onClick,
  clickHint
}: ImpactCardProps) {
  const maxBarValue = Math.max(Math.abs(bars[0].value), Math.abs(bars[1].value), 1);
  const axisMax = niceUpperBound(maxBarValue);
  const widthOf = (v: number) => Math.max(2, Math.round((Math.abs(v) / axisMax) * 100));

  // 5 evenly spaced ticks 0..axisMax
  const tickValues = [0, 0.25, 0.5, 0.75, 1].map(p => p * axisMax);

  // Delta pill: green = "good" (savings), red = "bad" (regression)
  const isPositive = deltaPercent !== undefined && deltaPercent >= 0;
  const isGoodDelta = reverseDeltaColor ? !isPositive : isPositive;

  const defaultLight = '#d9f7be';
  const defaultDark = '#73d13d';

  return (
    <Wrapper $clickable={!!onClick} onClick={onClick}>
      <Typography.Text style={{ fontSize: 14, color: 'rgba(0,0,0,0.65)', letterSpacing: '0.01em' }}>
        {label}
      </Typography.Text>

      <HeadlineRow>
        <Headline level={2}>{headline}</Headline>
        {deltaPercent !== undefined && Number.isFinite(deltaPercent) && (
          <DeltaPill $positive={isGoodDelta}>
            {isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            {Math.abs(Math.round(deltaPercent))}%
          </DeltaPill>
        )}
      </HeadlineRow>

      <ChartArea>
        <BarsBox>
          <GridLines>
            {tickValues.map((_, i) => (
              <GridTick key={i} />
            ))}
          </GridLines>
          <BarRow $width={widthOf(bars[0].value)} $color={bars[0].color ?? defaultLight}>
            <BarLabel>
              {bars[0].label}: {bars[0].formatted}
            </BarLabel>
          </BarRow>
          <BarRow $width={widthOf(bars[1].value)} $color={bars[1].color ?? defaultDark}>
            <BarLabel>
              {bars[1].label}: {bars[1].formatted}
            </BarLabel>
          </BarRow>
        </BarsBox>
        {tickFormatter && (
          <XAxis>
            {tickValues.map((v, i) => (
              <span key={i}>{tickFormatter(v)}</span>
            ))}
          </XAxis>
        )}
      </ChartArea>

      <Legend>
        <span>
          <Swatch $color={bars[0].color ?? defaultLight} />
          {bars[0].label}
        </span>
        <span>
          <Swatch $color={bars[1].color ?? defaultDark} />
          {bars[1].label}
        </span>
      </Legend>

      {onClick && clickHint && (
        <Typography.Text type='secondary' style={{ fontSize: 11, display: 'block', marginTop: 10 }}>
          {clickHint}
        </Typography.Text>
      )}
    </Wrapper>
  );
}
