import { ArrowLeftOutlined, HistoryOutlined, SaveOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Collapse,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Tag,
  Typography,
  message
} from 'antd';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { getUserFromContext } from 'lib/middleware';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';

const { Title, Text, Paragraph } = Typography;

type FactorVersion = {
  id: string;
  value: number;
  unit: string;
  notes?: string;
  changeReason: string;
  sourceVersion?: string;
  status: string;
  approvedAt?: string;
  createdAt: string;
  changedBy: string;
};

type FactorDetail = {
  id: string;
  name: string;
  description?: string;
  currentValue: number;
  unit: string;
  region?: string;
  notes?: string;
  calculatorConstantKey?: string;
  isActive: boolean;
  category: { id: string; name: string };
  source: { id: string; name: string; version: string };
  versions: FactorVersion[];
};

type Props = {
  user: DashboardUser;
  factor: FactorDetail;
  categories: Array<{ id: string; name: string }>;
  sources: Array<{ id: string; name: string; version: string }>;
};

const StatusTag = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    approved: 'success',
    pending: 'processing',
    rejected: 'error'
  };
  return <Tag color={colors[status] || 'default'}>{status}</Tag>;
};

export default function EditFactorPage({ user, factor, categories, sources }: Props) {
  const router = useRouter();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(values: any) {
    if (!values.changeReason?.trim()) {
      message.error('Change reason is required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/factors/${factor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update factor');
      }
      message.success('Factor updated');
      router.push('/admin/data-science/constants');
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout title={`Edit: ${factor.name}`} selectedMenuItem='data-science/constants' user={user}>
      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: 24 }}>
          <Link href='/admin/data-science/constants'>
            <Button icon={<ArrowLeftOutlined />} type='link' style={{ paddingLeft: 0 }}>
              Back to Constants Library
            </Button>
          </Link>
          <Title level={2} style={{ marginBottom: 4 }}>
            Edit Factor
          </Title>
          <Paragraph type='secondary'>
            Updating a factor's value automatically creates a version history record for audit purposes.
          </Paragraph>
        </div>

        <Row gutter={24}>
          <Col xs={24} lg={16}>
            <Card title='Factor Details'>
              <Form
                form={form}
                layout='vertical'
                onFinish={handleSubmit}
                requiredMark='optional'
                initialValues={{
                  name: factor.name,
                  description: factor.description,
                  categoryId: factor.category.id,
                  sourceId: factor.source.id,
                  currentValue: factor.currentValue,
                  unit: factor.unit,
                  region: factor.region,
                  notes: factor.notes,
                  calculatorConstantKey: factor.calculatorConstantKey,
                  isActive: factor.isActive
                }}
              >
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label='Factor Name'
                      name='name'
                      rules={[{ required: true, message: 'Name is required' }]}
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label='Category' name='categoryId' rules={[{ required: true }]}>
                      <Select>
                        {categories.map(c => (
                          <Select.Option key={c.id} value={c.id}>
                            {c.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item label='Description' name='description'>
                      <Input.TextArea rows={2} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item label='Current Value' name='currentValue' rules={[{ required: true }]}>
                      <InputNumber style={{ width: '100%' }} step='any' stringMode />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item label='Unit' name='unit' rules={[{ required: true }]}>
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item label='Region' name='region'>
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label='Data Source' name='sourceId' rules={[{ required: true }]}>
                      <Select>
                        {sources.map(s => (
                          <Select.Option key={s.id} value={s.id}>
                            {s.name} v{s.version}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label='Calculator Constant Key'
                      name='calculatorConstantKey'
                      tooltip='TypeScript constant path (e.g. MATERIALS[5].mtco2ePerLb)'
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item label='Notes' name='notes'>
                      <Input.TextArea rows={3} />
                    </Form.Item>
                  </Col>

                  <Col xs={24}>
                    <Form.Item
                      label='Reason for Change'
                      name='changeReason'
                      rules={[{ required: true, message: 'Please explain why this factor is being updated' }]}
                      tooltip='Required for audit trail. Describe what changed and why (e.g. "Updated to EPA WARM v16 values")'
                    >
                      <Input.TextArea
                        rows={3}
                        placeholder='e.g. Updated to EPA WARM v16 — new material emission factors published Jan 2026'
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                  <Link href='/admin/data-science/constants'>
                    <Button>Cancel</Button>
                  </Link>
                  <Button type='primary' htmlType='submit' icon={<SaveOutlined />} loading={saving}>
                    Save Changes
                  </Button>
                </div>
              </Form>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card
              title={
                <Space>
                  <HistoryOutlined />
                  Version History
                </Space>
              }
              size='small'
            >
              {factor.versions.length === 0 ? (
                <Text type='secondary'>No previous versions recorded.</Text>
              ) : (
                <Collapse ghost size='small'>
                  {factor.versions.map((v, i) => (
                    <Collapse.Panel
                      key={v.id}
                      header={
                        <Space size={4} wrap>
                          <StatusTag status={v.status} />
                          <Text strong style={{ fontSize: 13 }}>
                            {v.value.toLocaleString()} {v.unit}
                          </Text>
                          <Text type='secondary' style={{ fontSize: 12 }}>
                            {new Date(v.createdAt).toLocaleDateString()}
                          </Text>
                        </Space>
                      }
                    >
                      <Descriptions column={1} size='small'>
                        <Descriptions.Item label='Reason'>{v.changeReason}</Descriptions.Item>
                        {v.notes && <Descriptions.Item label='Notes'>{v.notes}</Descriptions.Item>}
                      </Descriptions>
                    </Collapse.Panel>
                  ))}
                </Collapse>
              )}
            </Card>

            <Card title='Lineage' size='small' style={{ marginTop: 16 }}>
              <Descriptions column={1} size='small'>
                <Descriptions.Item label='Source'>
                  {factor.source.name} v{factor.source.version}
                </Descriptions.Item>
                {factor.calculatorConstantKey && (
                  <Descriptions.Item label='Constant Key'>
                    <code style={{ fontSize: 11, background: '#f5f5f5', padding: '2px 6px', borderRadius: 3 }}>
                      {factor.calculatorConstantKey}
                    </code>
                  </Descriptions.Item>
                )}
                <Descriptions.Item label='Status'>
                  <Tag color={factor.isActive ? 'success' : 'default'}>{factor.isActive ? 'Active' : 'Deprecated'}</Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return { notFound: true };
  const isUpstream = await checkIsUpstream(user.org.id);
  if (!isUpstream) return { notFound: true };

  const { id } = context.params as { id: string };

  const [factor, categories, sources] = await Promise.all([
    prisma.factor.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        source: { select: { id: true, name: true, version: true } },
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            value: true,
            unit: true,
            notes: true,
            changeReason: true,
            sourceVersion: true,
            status: true,
            approvedAt: true,
            createdAt: true,
            changedBy: true
          }
        }
      }
    }),
    prisma.factorCategory.findMany({ orderBy: { name: 'asc' } }),
    prisma.factorSource.findMany({ orderBy: { name: 'asc' } })
  ]);

  if (!factor) return { notFound: true };

  return { props: serializeJSON({ user, factor, categories, sources }) };
};
