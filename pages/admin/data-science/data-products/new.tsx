import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, Input, Row, Select, Typography, message } from 'antd';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { getUserFromContext } from 'lib/middleware';
import { ACCESS_DENIED_REDIRECT, checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';
import type { PageProps } from 'pages/_app';

const { Title, Paragraph } = Typography;

type Props = {
  user: DashboardUser;
};

export default function NewDataProductPage({}: Props) {
  const router = useRouter();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(values: Record<string, string>) {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/data-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create');
      }
      const product = await res.json();
      message.success('Data product created');
      router.push(`/admin/data-science/data-products/${product.id}`);
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : 'Failed to create');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <Link href='/admin/data-science/data-products'>
          <Button icon={<ArrowLeftOutlined />} type='link' style={{ paddingLeft: 0 }}>
            Back to Data Products
          </Button>
        </Link>
        <Title level={2} style={{ marginBottom: 4 }}>
          New Data Product
        </Title>
        <Paragraph type='secondary'>
          Define a new data product — a governed flow combining inputs, factors, and calculations.
        </Paragraph>
      </div>

      <Card style={{ maxWidth: 720 }}>
        <Form form={form} layout='vertical' onFinish={handleSubmit} requiredMark='optional'>
          <Row gutter={24}>
            <Col xs={24}>
              <Form.Item label='Name' name='name' rules={[{ required: true, message: 'Name is required' }]}>
                <Input placeholder='e.g. Advanced Project Calculator' />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item label='Description' name='description'>
                <Input.TextArea rows={3} placeholder='What does this data product do?' />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label='Product Type'
                name='productType'
                rules={[{ required: true, message: 'Type is required' }]}
                initialValue='calculator'
              >
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
            <Col xs={24} md={12}>
              <Form.Item label='Audience' name='audience' initialValue='internal'>
                <Select
                  options={[
                    { value: 'internal', label: 'Internal' },
                    { value: 'client', label: 'Client-Facing' },
                    { value: 'public', label: 'Public' }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label='Project Type' name='projectType' tooltip='Restrict to a specific project category'>
                <Select
                  allowClear
                  placeholder='Any'
                  options={[
                    { value: 'default', label: 'Default (Advanced)' },
                    { value: 'event', label: 'Event (Actuals)' },
                    { value: 'eugene', label: 'Eugene' }
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <Link href='/admin/data-science/data-products'>
              <Button>Cancel</Button>
            </Link>
            <Button type='primary' htmlType='submit' icon={<SaveOutlined />} loading={saving}>
              Create Data Product
            </Button>
          </div>
        </Form>
      </Card>
    </>
  );
}

NewDataProductPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => (
  <AdminLayout {...(pageProps as any)} selectedMenuItem='data-science/data-products' title='New Data Product'>
    {page}
  </AdminLayout>
);

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return ACCESS_DENIED_REDIRECT;
  const isUpstream = await checkIsUpstream(user.org.id);
  if (!isUpstream) return ACCESS_DENIED_REDIRECT;

  return { props: serializeJSON({ user }) };
};
