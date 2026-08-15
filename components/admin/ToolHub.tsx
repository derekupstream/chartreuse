/**
 * A layer's landing page in the 2.0 Data Science admin: one card per tool, with the layer's
 * one-sentence purpose up top. Hubs exist so the sidebar can shrink to six entries while
 * every de-listed tool stays one click away — nothing 404s, nothing hides.
 */
import { Card, Col, Row, Tag, Typography } from 'antd';
import Link from 'next/link';

const { Title, Paragraph, Text } = Typography;

export type HubTool = {
  title: string;
  href: string;
  description: string;
  /** e.g. 'primary' for the tools that define the layer, none for supporting ones */
  primary?: boolean;
  tag?: string;
};

export function ToolHub({ title, purpose, tools }: { title: string; purpose: string; tools: HubTool[] }) {
  return (
    <>
      <Title level={2} style={{ marginBottom: 4 }}>
        {title}
      </Title>
      <Paragraph type='secondary' style={{ marginBottom: 24, maxWidth: 720 }}>
        {purpose}
      </Paragraph>
      <Row gutter={[16, 16]}>
        {tools.map(tool => (
          <Col xs={24} sm={12} lg={8} key={tool.href}>
            <Link href={tool.href} style={{ display: 'block', height: '100%' }}>
              <Card
                hoverable
                style={{ height: '100%', borderColor: tool.primary ? '#1f7a4d' : undefined }}
                styles={{ body: { padding: 16 } }}
              >
                <Text strong>{tool.title}</Text>
                {tool.tag && (
                  <Tag style={{ marginLeft: 8 }} color={tool.primary ? 'green' : 'default'}>
                    {tool.tag}
                  </Tag>
                )}
                <Paragraph type='secondary' style={{ fontSize: 12, marginTop: 6, marginBottom: 0 }}>
                  {tool.description}
                </Paragraph>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </>
  );
}
