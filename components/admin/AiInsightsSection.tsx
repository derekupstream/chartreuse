import { BulbOutlined, SyncOutlined } from '@ant-design/icons';
import { Button, Card, Col, Row, Tag, Tooltip, Typography, message } from 'antd';
import { useState } from 'react';
import useSWR from 'swr';

import type { InsightCard } from 'pages/api/admin/insights';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const CATEGORY_COLORS: Record<string, string> = {
  'Program Performance': 'blue',
  'Environmental Impact': 'green',
  'Financial Outcomes': 'gold',
  'Operational Trends': 'purple',
  'Growth Opportunities': 'cyan',
  'RSP Insights': 'geekblue',
  'Industry Benchmarks': 'orange'
};

function categoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] ?? 'default';
}

export function AiInsightsSection() {
  const { data, mutate } = useSWR<{ insight: { generatedAt: string; content: InsightCard[] } | null }>(
    '/api/admin/insights',
    fetcher
  );
  const [generating, setGenerating] = useState(false);

  const insight = data?.insight ?? null;
  const cards: InsightCard[] = Array.isArray(insight?.content) ? insight!.content : [];
  const generatedAt = insight?.generatedAt ? new Date(insight.generatedAt) : null;
  const hoursSinceLast = generatedAt ? (Date.now() - generatedAt.getTime()) / 3_600_000 : Infinity;
  const tooRecent = hoursSinceLast < 8;

  async function generate() {
    if (generating) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/admin/insights', { method: 'POST' });
      const body = await res.json();
      if (!res.ok) {
        message.error(`Failed to generate insights: ${body?.error ?? res.status}`);
        return;
      }
      // Update SWR cache directly with the response — no extra round-trip
      await mutate(body, false);
      message.success('AI insights generated');
    } catch (err: any) {
      message.error(`Error: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div style={{ marginTop: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            <BulbOutlined style={{ marginRight: 8, color: '#faad14' }} />
            AI Insights
          </Typography.Title>
          {generatedAt && (
            <Typography.Text type='secondary' style={{ fontSize: 12 }}>
              Last generated: {generatedAt.toLocaleString()}
            </Typography.Text>
          )}
        </div>
        <Tooltip
          title={
            tooRecent
              ? `Generated ${Math.round(hoursSinceLast * 60)} minutes ago — wait 8h between runs`
              : 'Analyze all platform data with AI (uses ~2k tokens)'
          }
        >
          <Button
            icon={<SyncOutlined spin={generating} />}
            onClick={generate}
            loading={generating}
            disabled={tooRecent || generating}
            type={cards.length === 0 ? 'primary' : 'default'}
          >
            {cards.length === 0 ? 'Generate Insights' : 'Regenerate'}
          </Button>
        </Tooltip>
      </div>

      {cards.length === 0 && !generating && (
        <Card style={{ textAlign: 'center', padding: '32px 0', color: '#8c8c8c' }}>
          <BulbOutlined style={{ fontSize: 32, marginBottom: 12, display: 'block' }} />
          <Typography.Text type='secondary'>
            No insights yet. Click "Generate Insights" to run an AI analysis of all platform data.
          </Typography.Text>
        </Card>
      )}

      {cards.length > 0 && (
        <Row gutter={[16, 16]}>
          {cards.map((card, i) => (
            <Col key={i} xs={24} md={12}>
              <Card size='small' style={{ height: '100%' }}>
                <Tag color={categoryColor(card.category)} style={{ marginBottom: 8 }}>
                  {card.category}
                </Tag>
                <Typography.Title level={5} style={{ margin: '4px 0 8px' }}>
                  {card.title}
                </Typography.Title>
                <Typography.Paragraph style={{ marginBottom: 8 }}>{card.insight}</Typography.Paragraph>
                {card.dataPoints?.length > 0 && (
                  <ul style={{ paddingLeft: 18, margin: 0 }}>
                    {card.dataPoints.map((dp, j) => (
                      <li key={j}>
                        <Typography.Text type='secondary' style={{ fontSize: 12 }}>
                          {dp}
                        </Typography.Text>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
