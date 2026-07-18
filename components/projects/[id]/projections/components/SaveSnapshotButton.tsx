import { CameraOutlined, FlagOutlined } from '@ant-design/icons';
import { Button, DatePicker, Form, Input, Modal, message } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';

// Projection projects create "Milestones"; actuals projects save "Snapshots".
// Same API + ProjectMilestone record underneath — only the language differs.
export function SaveSnapshotButton({ projectId, isActuals }: { projectId: string; isActuals?: boolean }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const actionLabel = isActuals ? 'Save Snapshot' : 'Create Milestone';
  const icon = isActuals ? <CameraOutlined /> : <FlagOutlined />;

  async function handleSave(values: { label?: string; snapshotDate?: dayjs.Dayjs }) {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: values.label || undefined,
          snapshotDate: values.snapshotDate ? values.snapshotDate.format('YYYY-MM-DD') : undefined
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || `Failed to ${isActuals ? 'save snapshot' : 'create milestone'}`);
      }
      message.success(isActuals ? 'Snapshot saved' : 'Milestone created');
      setOpen(false);
      form.resetFields();
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button icon={icon} onClick={() => setOpen(true)}>
        {actionLabel}
      </Button>
      <Modal
        title={actionLabel}
        open={open}
        onCancel={() => {
          setOpen(false);
          form.resetFields();
        }}
        footer={null}
        width={420}
        destroyOnClose
      >
        <p style={{ color: 'rgba(0,0,0,0.55)', marginTop: 0 }}>
          {isActuals
            ? "Captures the current measured metrics as a snapshot. Snapshots build a timeline of your program's impact over time."
            : "Captures the current calculated metrics as a milestone. Milestones build a timeline of your program's projected impact over time."}
        </p>
        <Form form={form} layout='vertical' onFinish={handleSave} initialValues={{ snapshotDate: dayjs() }}>
          <Form.Item name='snapshotDate' label={isActuals ? 'Snapshot Date' : 'Milestone Date'}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name='label' label='Label (optional)'>
            <Input placeholder='e.g. Q1 2025 baseline, Post-event review' />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button onClick={() => setOpen(false)} style={{ marginRight: 8 }}>
              Cancel
            </Button>
            <Button type='primary' htmlType='submit' loading={saving} icon={icon}>
              {actionLabel}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
