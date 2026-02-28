import { CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Badge,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useState } from 'react';

import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { getUserFromContext } from 'lib/middleware';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';

const { Title, Text, Paragraph } = Typography;

type ChangeRequest = {
  id: string;
  type: string;
  factorId: string | null;
  factorName: string;
  proposedValue: number | null;
  proposedUnit: string | null;
  proposedSource: string | null;
  proposedNotes: string | null;
  proposedCategory: string | null;
  reason: string;
  priority: string;
  status: string;
  createdAt: string;
  reviewNotes: string | null;
  factor: { id: string; name: string; currentValue: number; unit: string } | null;
};

type Factor = { id: string; name: string };

type Props = {
  user: DashboardUser;
  changeRequests: ChangeRequest[];
  factors: Factor[];
};

const PriorityTag = ({ priority }: { priority: string }) => {
  const colors: Record<string, string> = { high: 'red', medium: 'orange', low: 'default' };
  return <Tag color={colors[priority] || 'default'}>{priority}</Tag>;
};

const StatusTag = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    pending: 'processing',
    approved: 'success',
    rejected: 'error',
    implemented: 'default'
  };
  return <Tag color={colors[status] || 'default'}>{status}</Tag>;
};

export default function ChangeRequestsPage({ user, changeRequests: initial, factors }: Props) {
  const [requests, setRequests] = useState<ChangeRequest[]>(initial);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [newModal, setNewModal] = useState(false);
  const [reviewModal, setReviewModal] = useState<{ open: boolean; request: ChangeRequest | null }>({
    open: false,
    request: null
  });
  const [newForm] = Form.useForm();
  const [reviewForm] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const filtered = statusFilter ? requests.filter(r => r.status === statusFilter) : requests;

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  async function handleCreate(values: any) {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/change-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const created = await res.json();
      setRequests(prev => [{ ...created, factor: factors.find(f => f.id === created.factorId) || null }, ...prev]);
      message.success('Change request submitted');
      setNewModal(false);
      newForm.resetFields();
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleReview(values: { status: string; reviewNotes: string }) {
    if (!reviewModal.request) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/change-requests/${reviewModal.request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const updated = await res.json();
      setRequests(prev => prev.map(r => (r.id === updated.id ? { ...r, ...updated } : r)));
      message.success('Change request updated');
      setReviewModal({ open: false, request: null });
      reviewForm.resetFields();
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  const columns: ColumnsType<ChangeRequest> = [
    {
      title: 'Factor',
      key: 'factor',
      render: (_, r) => (
        <div>
          <Text strong>{r.factorName}</Text>
          {r.factor && (
            <div>
              <Text type='secondary' style={{ fontSize: 12 }}>
                Current: {r.factor.currentValue.toLocaleString()} {r.factor.unit}
              </Text>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Type',
      dataIndex: 'type',
      render: (t: string) => <Tag>{t}</Tag>
    },
    {
      title: 'Proposed',
      key: 'proposed',
      render: (_, r) => (
        <div>
          {r.proposedValue != null && (
            <div>
              <Text strong>{r.proposedValue.toLocaleString()}</Text>{' '}
              <Text type='secondary'>{r.proposedUnit || r.factor?.unit}</Text>
            </div>
          )}
          {r.proposedSource && (
            <Text type='secondary' style={{ fontSize: 12 }}>
              Source: {r.proposedSource}
            </Text>
          )}
        </div>
      )
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      render: (p: string) => <PriorityTag priority={p} />
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (s: string) => <StatusTag status={s} />
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      render: (d: string) => new Date(d).toLocaleDateString()
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, r) => (
        <Space>
          {r.factor && (
            <Link href={`/admin/data-science/constants/${r.factor.id}/edit`}>
              <Button size='small'>View Factor</Button>
            </Link>
          )}
          {r.status === 'pending' && (
            <Button
              size='small'
              type='primary'
              onClick={() => {
                setReviewModal({ open: true, request: r });
                reviewForm.setFieldsValue({ status: '', reviewNotes: '' });
              }}
            >
              Review
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <AdminLayout title='Change Requests' selectedMenuItem='data-science/change-requests' user={user}>
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <Title level={2} style={{ marginBottom: 4 }}>
              Change Requests
            </Title>
            <Paragraph type='secondary'>
              Governance workflow for proposing and approving updates to factors in the library. All changes are tracked
              for audit compliance.
            </Paragraph>
          </div>
          <Button type='primary' icon={<PlusOutlined />} onClick={() => setNewModal(true)}>
            Submit Request
          </Button>
        </div>

        {/* Stats */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          {[
            { label: 'Pending', status: 'pending', color: '#fa8c16' },
            { label: 'Approved', status: 'approved', color: '#3f8600' },
            { label: 'Rejected', status: 'rejected', color: '#cf1322' },
            { label: 'Implemented', status: 'implemented', color: '#8c8c8c' }
          ].map(({ label, status, color }) => (
            <Col xs={12} sm={6} key={status}>
              <Card
                size='small'
                style={{
                  textAlign: 'center',
                  cursor: 'pointer',
                  borderColor: statusFilter === status ? color : undefined
                }}
                onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
              >
                <div style={{ fontSize: 24, fontWeight: 700, color }}>
                  {requests.filter(r => r.status === status).length}
                </div>
                <Text type='secondary'>{label}</Text>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Filter row */}
        <Card style={{ marginBottom: 16 }}>
          <Space>
            <Text>Filter:</Text>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 160 }}
              allowClear
              placeholder='All statuses'
            >
              {['pending', 'approved', 'rejected', 'implemented'].map(s => (
                <Select.Option key={s} value={s}>
                  {s}
                </Select.Option>
              ))}
            </Select>
            {statusFilter && (
              <Button size='small' onClick={() => setStatusFilter('')}>
                Clear
              </Button>
            )}
          </Space>
        </Card>

        <Table
          dataSource={filtered}
          columns={columns}
          rowKey='id'
          expandable={{
            expandedRowRender: (r: ChangeRequest) => (
              <div style={{ padding: '8px 16px', background: '#fafafa' }}>
                <Text strong>Reason: </Text>
                <Text>{r.reason}</Text>
                {r.proposedNotes && (
                  <div style={{ marginTop: 4 }}>
                    <Text strong>Proposed Notes: </Text>
                    <Text>{r.proposedNotes}</Text>
                  </div>
                )}
                {r.reviewNotes && (
                  <div style={{ marginTop: 4 }}>
                    <Text strong>Review Notes: </Text>
                    <Text>{r.reviewNotes}</Text>
                  </div>
                )}
              </div>
            )
          }}
          pagination={{ showSizeChanger: true, showTotal: (t, r) => `${r[0]}-${r[1]} of ${t}` }}
          locale={{ emptyText: 'No change requests yet' }}
        />

        {/* Submit new request modal */}
        <Modal
          title='Submit Change Request'
          open={newModal}
          onCancel={() => {
            setNewModal(false);
            newForm.resetFields();
          }}
          footer={null}
          width={600}
        >
          <Form form={newForm} layout='vertical' onFinish={handleCreate} requiredMark='optional'>
            <Form.Item label='Request Type' name='type' rules={[{ required: true }]}>
              <Select>
                <Select.Option value='update'>Update Value</Select.Option>
                <Select.Option value='new'>Add New Factor</Select.Option>
                <Select.Option value='deprecate'>Deprecate Factor</Select.Option>
                <Select.Option value='source_change'>Change Source</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label='Factor' name='factorId'>
              <Select
                placeholder='Select existing factor (optional for new factor requests)'
                allowClear
                showSearch
                optionFilterProp='children'
                onChange={v => {
                  const factor = factors.find(f => f.id === v);
                  if (factor) newForm.setFieldValue('factorName', factor.name);
                }}
              >
                {factors.map(f => (
                  <Select.Option key={f.id} value={f.id}>
                    {f.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label='Factor Name' name='factorName' rules={[{ required: true }]}>
              <Input placeholder='Factor name (auto-filled when selecting above)' />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label='Proposed Value' name='proposedValue'>
                  <InputNumber style={{ width: '100%' }} step='any' stringMode placeholder='New value' />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label='Proposed Unit' name='proposedUnit'>
                  <Input placeholder='e.g. MTCO₂e/lb' />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label='Proposed Source' name='proposedSource'>
              <Input placeholder='e.g. EPA WARM v16' />
            </Form.Item>
            <Form.Item label='Reason for Change' name='reason' rules={[{ required: true }]}>
              <Input.TextArea rows={3} placeholder='Why is this change needed? Include any references.' />
            </Form.Item>
            <Form.Item label='Priority' name='priority' initialValue='medium'>
              <Select>
                <Select.Option value='high'>High — blocks active calculations</Select.Option>
                <Select.Option value='medium'>Medium — next release</Select.Option>
                <Select.Option value='low'>Low — nice to have</Select.Option>
              </Select>
            </Form.Item>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Button
                onClick={() => {
                  setNewModal(false);
                  newForm.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button type='primary' htmlType='submit' loading={saving}>
                Submit Request
              </Button>
            </div>
          </Form>
        </Modal>

        {/* Review modal */}
        <Modal
          title={`Review: ${reviewModal.request?.factorName}`}
          open={reviewModal.open}
          onCancel={() => {
            setReviewModal({ open: false, request: null });
            reviewForm.resetFields();
          }}
          footer={null}
          width={520}
        >
          {reviewModal.request && (
            <>
              <div style={{ background: '#f5f5f5', padding: '12px 16px', borderRadius: 6, marginBottom: 16 }}>
                <Text strong>Reason: </Text>
                <Text>{reviewModal.request.reason}</Text>
                {reviewModal.request.proposedValue != null && (
                  <div style={{ marginTop: 4 }}>
                    <Text strong>Proposed Value: </Text>
                    <Text>
                      {reviewModal.request.proposedValue} {reviewModal.request.proposedUnit}
                    </Text>
                  </div>
                )}
              </div>
              <Form form={reviewForm} layout='vertical' onFinish={handleReview}>
                <Form.Item label='Decision' name='status' rules={[{ required: true }]}>
                  <Select>
                    <Select.Option value='approved'>
                      <Space>
                        <CheckCircleOutlined style={{ color: '#3f8600' }} /> Approve
                      </Space>
                    </Select.Option>
                    <Select.Option value='rejected'>
                      <Space>
                        <CloseCircleOutlined style={{ color: '#cf1322' }} /> Reject
                      </Space>
                    </Select.Option>
                    <Select.Option value='implemented'>Mark as Implemented</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item label='Review Notes' name='reviewNotes'>
                  <Input.TextArea rows={3} placeholder='Optional notes on the decision' />
                </Form.Item>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <Button
                    onClick={() => {
                      setReviewModal({ open: false, request: null });
                      reviewForm.resetFields();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type='primary' htmlType='submit' loading={saving}>
                    Submit Review
                  </Button>
                </div>
              </Form>
            </>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return { notFound: true };
  const isUpstream = await checkIsUpstream(user.org.id);
  if (!isUpstream) return { notFound: true };

  const [changeRequests, factors] = await Promise.all([
    prisma.changeRequest.findMany({
      include: { factor: { select: { id: true, name: true, currentValue: true, unit: true } } },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }]
    }),
    prisma.factor.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    })
  ]);

  return { props: serializeJSON({ user, changeRequests, factors }) };
};
