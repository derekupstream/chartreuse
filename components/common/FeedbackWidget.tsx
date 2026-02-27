import { FlagOutlined } from '@ant-design/icons';
import { Form, Input, Modal, Select, message } from 'antd';
import { useRouter } from 'next/router';
import { useState } from 'react';
import styled from 'styled-components';

const FloatingButton = styled.button`
  position: fixed;
  bottom: 80px;
  right: 16px;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 0;
  overflow: hidden;
  width: 36px;
  padding: 0 10px;
  height: 36px;
  border-radius: 18px;
  border: 1px solid #d9d9d9;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  color: rgba(0, 0, 0, 0.65);
  font-size: 14px;
  font-family: inherit;
  transition:
    width 200ms ease,
    background 150ms;
  white-space: nowrap;

  &:hover {
    width: 110px;
    background: #fafafa;
    color: rgba(0, 0, 0, 0.88);
  }

  .feedback-label {
    opacity: 0;
    max-width: 0;
    overflow: hidden;
    transition:
      opacity 150ms ease 80ms,
      max-width 200ms ease;
    font-size: 13px;
    font-weight: 500;
    margin-left: 6px;
  }

  &:hover .feedback-label {
    opacity: 1;
    max-width: 80px;
  }

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
      <FloatingButton onClick={() => setOpen(true)} aria-label='Feedback'>
        <FlagOutlined />
        <span className='feedback-label'>Feedback</span>
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
