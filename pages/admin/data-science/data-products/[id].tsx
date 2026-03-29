import { ArrowLeftOutlined, RobotOutlined, SaveOutlined } from '@ant-design/icons';
import { Badge, Button, Card, Col, Form, Input, Row, Select, Tabs, Tag, Typography, message } from 'antd';
import type { GetServerSideProps } from 'next';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useState } from 'react';

import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { CALCULATOR_REGISTRY } from 'lib/admin/calculatorRegistry';
import type { RegisteredFunction } from 'lib/admin/calculatorRegistry';
import { getUserFromContext } from 'lib/middleware';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';
import type { PageProps } from 'pages/_app';

const { Title, Paragraph, Text } = Typography;

// Dynamic imports to avoid SSR issues with ReactFlow
const DesignerCanvas = dynamic(
  () => import('components/admin/data-products/DesignerCanvas').then(m => m.DesignerCanvas),
  {
    ssr: false,
    loading: () => (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Text type='secondary'>Loading designer...</Text>
      </div>
    )
  }
);

const AiDesigner = dynamic(() => import('components/admin/data-products/AiDesigner').then(m => m.AiDesigner), {
  ssr: false
});

type Factor = {
  id: string;
  name: string;
  currentValue: number;
  unit: string;
  category?: { name: string };
};

type DataProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  productType: string;
  audience: string;
  status: string;
  projectType: string | null;
  inputSchemaJson: unknown;
  outputSchemaJson: unknown;
  flowDefinitionJson: { nodes?: unknown[]; edges?: unknown[]; viewport?: unknown } | null;
  methodologyDocumentId: string | null;
  version: number;
  isPublic: boolean;
};

type MethodologyDoc = {
  id: string;
  title: string;
  status: string;
};

type Props = {
  user: DashboardUser;
  product: DataProduct;
  factors: Factor[];
  calculations: RegisteredFunction[];
  methodologyDocs: MethodologyDoc[];
};

export default function DataProductEditorPage({ product: initial, factors, calculations, methodologyDocs }: Props) {
  const [product, setProduct] = useState(initial);
  const [savingOverview, setSavingOverview] = useState(false);
  const [designerKey, setDesignerKey] = useState(0);
  const [activeTab, setActiveTab] = useState('designer');
  const [form] = Form.useForm();

  const onFlowGenerated = useCallback(
    (result: { nodes: unknown[]; edges: unknown[]; name?: string; description?: string }) => {
      // Update local product state so Designer tab re-renders with new flow
      setProduct(prev => ({
        ...prev,
        flowDefinitionJson: { nodes: result.nodes, edges: result.edges, viewport: { x: 0, y: 0, zoom: 0.65 } },
        ...(result.name && { name: result.name }),
        ...(result.description && { description: result.description })
      }));
      setDesignerKey(k => k + 1);
    },
    []
  );

  async function saveOverview(values: Record<string, unknown>) {
    setSavingOverview(true);
    try {
      const res = await fetch(`/api/admin/data-products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      if (!res.ok) throw new Error('Failed to save');
      const updated = await res.json();
      setProduct(updated);
      message.success('Saved');
    } catch {
      message.error('Failed to save');
    } finally {
      setSavingOverview(false);
    }
  }

  async function updateStatus(status: string) {
    try {
      const res = await fetch(`/api/admin/data-products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update status');
      const updated = await res.json();
      setProduct(updated);
      message.success(`Status changed to ${status}`);
    } catch {
      message.error('Failed to update status');
    }
  }

  const statusBadge: Record<string, 'default' | 'processing' | 'success' | 'warning'> = {
    draft: 'default',
    review: 'processing',
    published: 'success',
    archived: 'warning'
  };

  const flow = product.flowDefinitionJson;
  const initialNodes = (flow?.nodes as any[]) ?? [];
  const initialEdges = (flow?.edges as any[]) ?? [];

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Link href='/admin/data-science/data-products'>
          <Button icon={<ArrowLeftOutlined />} type='link' style={{ paddingLeft: 0 }}>
            Back to Data Products
          </Button>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Title level={2} style={{ margin: 0 }}>
            {product.name}
          </Title>
          <Badge status={statusBadge[product.status] ?? 'default'} text={product.status} />
          <Text type='secondary'>v{product.version}</Text>
        </div>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'overview',
            label: 'Overview',
            children: (
              <Card style={{ maxWidth: 720 }}>
                <Form
                  form={form}
                  layout='vertical'
                  initialValues={{
                    name: product.name,
                    description: product.description,
                    productType: product.productType,
                    audience: product.audience,
                    projectType: product.projectType
                  }}
                  onFinish={saveOverview}
                >
                  <Row gutter={24}>
                    <Col xs={24}>
                      <Form.Item label='Name' name='name' rules={[{ required: true }]}>
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col xs={24}>
                      <Form.Item label='Description' name='description'>
                        <Input.TextArea rows={3} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item label='Type' name='productType'>
                        <Select
                          options={[
                            { value: 'calculator', label: 'Calculator' },
                            { value: 'dashboard', label: 'Dashboard' },
                            { value: 'scenario', label: 'Scenario Model' },
                            { value: 'report', label: 'Report' }
                          ]}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item label='Audience' name='audience'>
                        <Select
                          options={[
                            { value: 'internal', label: 'Internal' },
                            { value: 'client', label: 'Client-Facing' },
                            { value: 'public', label: 'Public' }
                          ]}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item label='Project Type' name='projectType'>
                        <Select
                          allowClear
                          placeholder='Any'
                          options={[
                            { value: 'default', label: 'Default' },
                            { value: 'event', label: 'Event' },
                            { value: 'eugene', label: 'Eugene' }
                          ]}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button type='primary' htmlType='submit' icon={<SaveOutlined />} loading={savingOverview}>
                      Save
                    </Button>
                  </div>
                </Form>
              </Card>
            )
          },
          {
            key: 'designer',
            label: 'Designer',
            children: (
              <DesignerCanvas
                key={designerKey}
                productId={product.id}
                initialNodes={initialNodes}
                initialEdges={initialEdges}
                factors={factors}
                calculations={calculations}
              />
            )
          },
          {
            key: 'ai-designer',
            label: (
              <span>
                <RobotOutlined style={{ marginRight: 4 }} />
                AI Designer
                <Tag color='purple' style={{ marginLeft: 6, fontSize: 9, lineHeight: '16px', padding: '0 4px' }}>
                  BETA
                </Tag>
              </span>
            ),
            children: <AiDesigner productId={product.id} productName={product.name} onFlowGenerated={onFlowGenerated} />
          },
          {
            key: 'inputs',
            label: 'Inputs',
            children: (
              <Card style={{ maxWidth: 720 }}>
                <Paragraph type='secondary'>
                  Define the input schema for this data product. This describes what data enters the flow.
                </Paragraph>
                <Input.TextArea
                  rows={12}
                  value={product.inputSchemaJson ? JSON.stringify(product.inputSchemaJson, null, 2) : ''}
                  onChange={async e => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      await fetch(`/api/admin/data-products/${product.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ inputSchemaJson: parsed })
                      });
                    } catch {
                      // invalid JSON — ignore until valid
                    }
                  }}
                  style={{ fontFamily: 'monospace', fontSize: 12 }}
                  placeholder='{ "fields": [...] }'
                />
              </Card>
            )
          },
          {
            key: 'outputs',
            label: 'Outputs',
            children: (
              <Card style={{ maxWidth: 720 }}>
                <Paragraph type='secondary'>
                  Define the output schema — what metrics and datasets this data product produces.
                </Paragraph>
                <Input.TextArea
                  rows={12}
                  value={product.outputSchemaJson ? JSON.stringify(product.outputSchemaJson, null, 2) : ''}
                  onChange={async e => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      await fetch(`/api/admin/data-products/${product.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ outputSchemaJson: parsed })
                      });
                    } catch {
                      // invalid JSON
                    }
                  }}
                  style={{ fontFamily: 'monospace', fontSize: 12 }}
                  placeholder='{ "metrics": [...] }'
                />
              </Card>
            )
          },
          {
            key: 'methodology',
            label: 'Methodology',
            children: (
              <Card style={{ maxWidth: 720 }}>
                <Paragraph type='secondary'>
                  Link this data product to a methodology document for governance and traceability.
                </Paragraph>
                <Select
                  style={{ width: '100%' }}
                  value={product.methodologyDocumentId}
                  onChange={async v => {
                    const res = await fetch(`/api/admin/data-products/${product.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ methodologyDocumentId: v ?? null })
                    });
                    if (res.ok) {
                      const updated = await res.json();
                      setProduct(updated);
                      message.success('Methodology linked');
                    }
                  }}
                  allowClear
                  placeholder='Select methodology document'
                  options={methodologyDocs.map(d => ({
                    value: d.id,
                    label: `${d.title} (${d.status})`
                  }))}
                />
              </Card>
            )
          },
          {
            key: 'tests',
            label: 'Tests',
            children: (
              <Card style={{ maxWidth: 720, textAlign: 'center', padding: 40 }}>
                <Title level={4} type='secondary'>
                  Coming Soon
                </Title>
                <Paragraph type='secondary'>
                  Test your data product flows against golden datasets to validate outputs before publishing.
                </Paragraph>
              </Card>
            )
          },
          {
            key: 'publish',
            label: 'Publish',
            children: (
              <Card style={{ maxWidth: 720 }}>
                <Title level={4}>Publishing Workflow</Title>
                <Paragraph type='secondary'>
                  Move this data product through the governance workflow: Draft → Review → Published.
                </Paragraph>
                <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                  {product.status === 'draft' && (
                    <Button type='primary' onClick={() => updateStatus('review')}>
                      Submit for Review
                    </Button>
                  )}
                  {product.status === 'review' && (
                    <>
                      <Button type='primary' onClick={() => updateStatus('published')}>
                        Publish
                      </Button>
                      <Button onClick={() => updateStatus('draft')}>Return to Draft</Button>
                    </>
                  )}
                  {product.status === 'published' && (
                    <Button danger onClick={() => updateStatus('archived')}>
                      Archive
                    </Button>
                  )}
                  {product.status === 'archived' && (
                    <Button onClick={() => updateStatus('draft')}>Restore to Draft</Button>
                  )}
                </div>
                <div style={{ marginTop: 16 }}>
                  <Text type='secondary' style={{ fontSize: 12 }}>
                    Current status: <Badge status={statusBadge[product.status] ?? 'default'} text={product.status} />{' '}
                    &middot; Version {product.version}
                  </Text>
                </div>
              </Card>
            )
          }
        ]}
      />
    </>
  );
}

DataProductEditorPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => (
  <AdminLayout {...(pageProps as any)} selectedMenuItem='data-science/data-products' title='Edit Data Product'>
    {page}
  </AdminLayout>
);

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return { notFound: true };
  const isUpstream = await checkIsUpstream(user.org.id);
  if (!isUpstream) return { notFound: true };

  const { id } = context.params as { id: string };
  const product = await prisma.dataProductDefinition.findUnique({ where: { id } });
  if (!product) return { notFound: true };

  const [factors, methodologyDocs] = await Promise.all([
    prisma.factor.findMany({
      where: { isActive: true },
      include: { category: { select: { name: true } } },
      orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }]
    }),
    prisma.methodologyDocument.findMany({
      select: { id: true, title: true, status: true },
      orderBy: { order: 'asc' }
    })
  ]);

  return {
    props: serializeJSON({
      user,
      product,
      factors,
      calculations: CALCULATOR_REGISTRY,
      methodologyDocs
    })
  };
};
