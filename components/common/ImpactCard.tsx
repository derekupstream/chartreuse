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
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
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
  font-size: 36px !important;
  line-height: 1 !important;
  font-weight: 700 !important;

  @media (max-width: 768px) {
    font-size: 28px !important;
  }
`;

const DeltaPill = styled.span<{ $positive: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: ${({ $positive }) => ($positive ? '#52c41a' : '#ff4d4f')};
  color: #fff;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 13px;
  font-weight: 600;
`;

const BarTrack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 4px;
`;

const BarRow = styled.div<{ $width: number; $color: string }>`
  position: relative;
  height: 38px;
  background: #fafafa;
  border-radius: 6px;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${({ $width }) => `${$width}%`};
    background: ${({ $color }) => $color};
    border-radius: 6px;
    transition: width 0.3s ease;
  }
`;

const BarLabel = styled.span`
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  height: 100%;
  padding: 0 12px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.75);
  font-weight: 500;
`;

const Axis = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 11px;
  color: rgba(0, 0, 0, 0.35);
`;

const Legend = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 10px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.65);
`;

const Swatch = styled.span<{ $color: string }>`
  display: inline-block;
  width: 12px;
  height: 12px;
  background: ${({ $color }) => $color};
  border-radius: 2px;
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
  /** Optional axis ticks (rendered below bars). */
  axisTicks?: string[];
  /** Click handler — if provided, card becomes hoverable + clickable. */
  onClick?: () => void;
  /** Hint shown at the bottom of the card when clickable. */
  clickHint?: string;
};

export function ImpactCard({
  label,
  headline,
  deltaPercent,
  reverseDeltaColor,
  bars,
  axisTicks,
  onClick,
  clickHint
}: ImpactCardProps) {
  const max = Math.max(Math.abs(bars[0].value), Math.abs(bars[1].value), 1);
  const widthOf = (v: number) => Math.max(8, Math.round((Math.abs(v) / max) * 100));

  // Delta pill: green = "good" (savings), red = "bad" (regression)
  const isPositive = deltaPercent !== undefined && deltaPercent >= 0;
  const isGoodDelta = reverseDeltaColor ? !isPositive : isPositive;

  const defaultLight = '#d9f7be';
  const defaultDark = '#73d13d';

  return (
    <Wrapper $clickable={!!onClick} onClick={onClick}>
      <Typography.Text strong style={{ fontSize: 16 }}>
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

      <BarTrack>
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
      </BarTrack>

      {axisTicks && axisTicks.length > 0 && (
        <Axis>
          {axisTicks.map(t => (
            <span key={t}>{t}</span>
          ))}
        </Axis>
      )}

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
