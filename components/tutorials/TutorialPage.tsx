import { ArrowRightOutlined, CheckCircleFilled } from '@ant-design/icons';
import { Button, Card, Space, Tag, Typography } from 'antd';
import Link from 'next/link';
import type { ReactNode } from 'react';
import styled from 'styled-components';

const { Title, Paragraph, Text } = Typography;

const Hero = styled.div<{ $accent: string }>`
  background: ${({ $accent }) => `linear-gradient(135deg, ${$accent}, ${$accent}dd)`};
  color: #fff;
  padding: 32px;
  border-radius: 12px;
  margin-bottom: 24px;

  h1.ant-typography,
  .ant-typography {
    color: #fff;
  }
`;

const StepCard = styled(Card)`
  margin-bottom: 12px;

  .ant-card-body {
    padding: 20px 24px;
  }
`;

const StepNumber = styled.span<{ $accent: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: ${({ $accent }) => $accent};
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  margin-right: 12px;
  flex-shrink: 0;
`;

export type TutorialStep = {
  title: string;
  body: ReactNode;
  tip?: string;
};

export type TutorialPageProps = {
  eyebrow: string;
  title: string;
  intro: ReactNode;
  accent: string;
  estimateMinutes: number;
  steps: TutorialStep[];
  ctaLabel: string;
  ctaHref: string;
  whatYouCanDoAfterwards?: ReactNode[];
};

export function TutorialPage({
  eyebrow,
  title,
  intro,
  accent,
  estimateMinutes,
  steps,
  ctaLabel,
  ctaHref,
  whatYouCanDoAfterwards
}: TutorialPageProps) {
  return (
    <div style={{ padding: 24, maxWidth: 880, margin: '0 auto' }}>
      <Hero $accent={accent}>
        <Tag style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', marginBottom: 12 }}>
          {eyebrow}
        </Tag>
        <Title level={1} style={{ margin: '0 0 12px 0' }}>
          {title}
        </Title>
        <Paragraph style={{ fontSize: 16, marginBottom: 16, opacity: 0.9 }}>{intro}</Paragraph>
        <Space>
          <Tag style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none' }}>
            ~{estimateMinutes} min
          </Tag>
          <Tag style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none' }}>
            {steps.length} step{steps.length === 1 ? '' : 's'}
          </Tag>
        </Space>
      </Hero>

      <Title level={3}>Steps</Title>
      {steps.map((step, i) => (
        <StepCard key={i}>
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <StepNumber $accent={accent}>{i + 1}</StepNumber>
            <div style={{ flex: 1 }}>
              <Title level={5} style={{ marginTop: 0 }}>
                {step.title}
              </Title>
              <Paragraph style={{ marginBottom: step.tip ? 8 : 0 }}>{step.body}</Paragraph>
              {step.tip && (
                <div
                  style={{
                    background: '#fffbe6',
                    border: '1px solid #ffe58f',
                    padding: '8px 12px',
                    borderRadius: 6,
                    fontSize: 13
                  }}
                >
                  <Text strong>Tip:</Text> {step.tip}
                </div>
              )}
            </div>
          </div>
        </StepCard>
      ))}

      {whatYouCanDoAfterwards && whatYouCanDoAfterwards.length > 0 && (
        <Card style={{ marginTop: 24, background: '#f6ffed', borderColor: '#b7eb8f' }}>
          <Title level={5} style={{ marginTop: 0 }}>
            <CheckCircleFilled style={{ color: '#52c41a', marginRight: 8 }} />
            Once you’ve done this, you can:
          </Title>
          <ul style={{ paddingLeft: 20, marginBottom: 0 }}>
            {whatYouCanDoAfterwards.map((item, i) => (
              <li key={i} style={{ marginBottom: 4 }}>
                {item}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Link href={ctaHref}>
          <Button type='primary' size='large' style={{ background: accent, borderColor: accent }}>
            {ctaLabel} <ArrowRightOutlined />
          </Button>
        </Link>
      </div>
    </div>
  );
}
