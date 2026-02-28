import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, Input, InputNumber, Row, Select, Typography, message } from 'antd';
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

const { Title, Paragraph } = Typography;

type Props = {
  user: DashboardUser;
  categories: Array<{ id: string; name: string }>;
  sources: Array<{ id: string; name: string; version: string }>;
};

export default function NewFactorPage({ user, categories, sources }: Props) {
  const router = useRouter();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(values: any) {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/factors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create factor');
      }
      message.success('Factor created');
      router.push('/admin/data-science/constants');
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout title='Add Factor' selectedMenuItem='data-science/constants' user={user}>
      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: 24 }}>
          <Link href='/admin/data-science/constants'>
            <Button icon={<ArrowLeftOutlined />} type='link' style={{ paddingLeft: 0 }}>
              Back to Constants Library
            </Button>
          </Link>
          <Title level={2} style={{ marginBottom: 4 }}>
            Add Factor
          </Title>
          <Paragraph type='secondary'>
            Add a new factor to the library. All factors must be sourced from an authoritative reference.
          </Paragraph>
        </div>

        <Card>
          <Form form={form} layout='vertical' onFinish={handleSubmit} requiredMark='optional'>
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item label='Factor Name' name='name' rules={[{ required: true, message: 'Name is required' }]}>
                  <Input placeholder='e.g. Paper — Emission Factor' />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label='Category'
                  name='categoryId'
                  rules={[{ required: true, message: 'Category is required' }]}
                >
                  <Select placeholder='Select category'>
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
                  <Input.TextArea rows={2} placeholder='Brief description of what this factor represents' />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  label='Current Value'
                  name='currentValue'
                  rules={[{ required: true, message: 'Value is required' }]}
                >
                  <InputNumber style={{ width: '100%' }} placeholder='0.00' step='any' stringMode />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label='Unit' name='unit' rules={[{ required: true, message: 'Unit is required' }]}>
                  <Input placeholder='e.g. MTCO₂e/lb, $/kWh' />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label='Region' name='region'>
                  <Input placeholder='e.g. US, California, Global' />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label='Data Source'
                  name='sourceId'
                  rules={[{ required: true, message: 'Source is required' }]}
                >
                  <Select placeholder='Select source'>
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
                  tooltip='The TypeScript constant path this factor maps to (e.g. MATERIALS[5].mtco2ePerLb)'
                >
                  <Input placeholder='e.g. ELECTRIC_CO2_EMISSIONS_FACTOR' />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item label='Notes' name='notes'>
                  <Input.TextArea rows={3} placeholder='Source citation, assumptions, or methodology notes' />
                </Form.Item>
              </Col>
            </Row>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
              <Link href='/admin/data-science/constants'>
                <Button>Cancel</Button>
              </Link>
              <Button type='primary' htmlType='submit' icon={<SaveOutlined />} loading={saving}>
                Save Factor
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return { notFound: true };
  const isUpstream = await checkIsUpstream(user.org.id);
  if (!isUpstream) return { notFound: true };

  const [categories, sources] = await Promise.all([
    prisma.factorCategory.findMany({ orderBy: { name: 'asc' } }),
    prisma.factorSource.findMany({ orderBy: { name: 'asc' } })
  ]);

  return { props: serializeJSON({ user, categories, sources }) };
};
