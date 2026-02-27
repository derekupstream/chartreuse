import { FlagOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal, Select, message } from 'antd';
import { useRouter } from 'next/router';
import { useState } from 'react';
import styled from 'styled-components';

const FloatingButton = styled(Button)`
  position: fixed;
  bottom: 80px;
  right: 16px;
  z-index: 100;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

  @media print {
    display: none;
  }
`;

const CATEGORIES = [
  { value: 'bug', label: 'Bug report' },
  { value: 'suggestion', label: 'Feature suggestion' },
  { value: 'data_question', label: 'Data / calculation question' },
  { value: 'other', label: 'Other' }
];

export function FeedbackWidget() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Hide on admin pages
  if (router.pathname.startsWith('/admin') || router.pathname.startsWith('/upstream')) return null;

  async function handleSubmit(values: { category: string; message: string }) {
    setLoading(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, pageUrl: window.location.href })
      });
      if (!res.ok) throw new Error('Failed to submit');
      message.success('Feedback submitted — thanks!');
      form.resetFields();
      setOpen(false);
    } catch {
      message.error('Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <FloatingButton icon={<FlagOutlined />} onClick={() => setOpen(true)}>
        Feedback
      </FloatingButton>
      <Modal
        title='Share feedback'
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        okText='Submit'
        confirmLoading={loading}
      >
        <Form form={form} layout='vertical' onFinish={handleSubmit} style={{ marginTop: 8 }}>
          <Form.Item name='category' label='Category' rules={[{ required: true }]}>
            <Select options={CATEGORIES} placeholder='Select a category' />
          </Form.Item>
          <Form.Item name='message' label='Message' rules={[{ required: true, min: 10 }]}>
            <Input.TextArea rows={4} placeholder='Describe your feedback...' />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
