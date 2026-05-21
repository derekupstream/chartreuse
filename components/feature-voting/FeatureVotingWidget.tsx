import { ArrowUpOutlined, PlusOutlined, RocketOutlined } from '@ant-design/icons';
import { Button, Card, Empty, Input, Modal, Space, Tag, Typography, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import type { FeatureRequestListItem } from 'pages/api/feature-requests/index';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const Row = styled.div`
  display: flex;
  gap: 16px;
  padding: 14px 0;
  border-top: 1px solid #f0f0f0;
  align-items: flex-start;

  &:first-of-type {
    border-top: none;
  }
`;

const VoteButton = styled(Button)<{ $voted: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 64px;
  padding: 4px;
  border-radius: 8px;
  border: 1px solid ${({ $voted }) => ($voted ? '#52c41a' : '#d9d9d9')};
  background: ${({ $voted }) => ($voted ? '#f6ffed' : '#fff')};
  color: ${({ $voted }) => ($voted ? '#52c41a' : 'rgba(0,0,0,0.65)')};

  &:hover {
    border-color: #52c41a !important;
    color: #52c41a !important;
  }
`;

const STATUS_COLORS: Record<string, string> = {
  open: 'default',
  planned: 'blue',
  in_progress: 'gold',
  shipped: 'green',
  rejected: 'red'
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  planned: 'Planned',
  in_progress: 'In progress',
  shipped: 'Shipped',
  rejected: 'Won’t do'
};

export function FeatureVotingWidget() {
  const [items, setItems] = useState<FeatureRequestListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/feature-requests');
      const data: { items: FeatureRequestListItem[] } = await res.json();
      setItems(data.items ?? []);
    } catch (e) {
      message.error('Could not load feature requests');
      setItems([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function vote(id: string) {
    // Optimistic toggle
    setItems(prev =>
      prev
        ? prev.map(r =>
            r.id === id ? { ...r, youVoted: !r.youVoted, voteCount: r.voteCount + (r.youVoted ? -1 : 1) } : r
          )
        : prev
    );
    try {
      await fetch(`/api/feature-requests/${id}/vote`, { method: 'POST' });
    } catch (e) {
      message.error('Vote failed');
      void load();
    }
  }

  async function submitNew() {
    if (!newTitle.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/feature-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, description: newDescription })
      });
      if (!res.ok) throw new Error('submit failed');
      setNewTitle('');
      setNewDescription('');
      setSubmitOpen(false);
      message.success('Thanks — added to the list');
      void load();
    } catch (e) {
      message.error('Could not submit');
    }
    setSubmitting(false);
  }

  const sorted = useMemo(() => {
    if (!items) return [];
    // Active items first, shipped/rejected last
    return [...items].sort((a, b) => {
      const aActive = a.status === 'shipped' || a.status === 'rejected' ? 1 : 0;
      const bActive = b.status === 'shipped' || b.status === 'rejected' ? 1 : 0;
      if (aActive !== bActive) return aActive - bActive;
      return b.voteCount - a.voteCount;
    });
  }, [items]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <Title level={4} style={{ margin: 0 }}>
          <RocketOutlined style={{ marginRight: 8 }} />
          Feature voting
        </Title>
        <Button type='primary' icon={<PlusOutlined />} size='small' onClick={() => setSubmitOpen(true)}>
          Suggest a feature
        </Button>
      </div>

      <Card>
        {loading ? (
          <Text type='secondary'>Loading…</Text>
        ) : sorted.length === 0 ? (
          <Empty description='Nothing here yet — be the first to suggest a feature.' />
        ) : (
          sorted.map(item => (
            <Row key={item.id}>
              <VoteButton $voted={item.youVoted} onClick={() => vote(item.id)}>
                <ArrowUpOutlined style={{ fontSize: 14 }} />
                <span style={{ fontWeight: 600, fontSize: 14 }}>{item.voteCount}</span>
              </VoteButton>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <Text strong style={{ fontSize: 14 }}>
                    {item.title}
                  </Text>
                  <Tag color={STATUS_COLORS[item.status] ?? 'default'}>{STATUS_LABELS[item.status] ?? item.status}</Tag>
                </div>
                {item.description && (
                  <Paragraph type='secondary' style={{ fontSize: 13, marginBottom: 0, marginTop: 4 }}>
                    {item.description}
                  </Paragraph>
                )}
              </div>
            </Row>
          ))
        )}
      </Card>

      <Modal
        title='Suggest a feature'
        open={submitOpen}
        onCancel={() => setSubmitOpen(false)}
        onOk={submitNew}
        okText='Submit'
        confirmLoading={submitting}
        okButtonProps={{ disabled: !newTitle.trim() }}
      >
        <Space direction='vertical' size={12} style={{ width: '100%' }}>
          <div>
            <Text type='secondary' style={{ fontSize: 12 }}>
              Title
            </Text>
            <Input
              placeholder='e.g. "Bulk-import projects from CSV"'
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              maxLength={200}
              autoFocus
            />
          </div>
          <div>
            <Text type='secondary' style={{ fontSize: 12 }}>
              Why it would help (optional)
            </Text>
            <TextArea
              placeholder='What problem would this solve for you?'
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              rows={4}
              maxLength={2000}
              showCount
            />
          </div>
        </Space>
      </Modal>
    </div>
  );
}
