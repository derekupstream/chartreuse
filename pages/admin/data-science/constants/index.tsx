import {
  Button,
  Card,
  Col,
  Collapse,
  Descriptions,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message
} from 'antd';
import {
  CalculatorOutlined,
  EditOutlined,
  HistoryOutlined,
  PlusOutlined,
  SearchOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useState } from 'react';
import styled from 'styled-components';

import { AdminLayout } from 'layouts/AdminLayout';
import { getUserFromContext } from 'lib/middleware';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';
import type { DashboardUser } from 'interfaces';
import prisma from 'lib/prisma';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { Search } = Input;

const StyledCard = styled(Card)`
  .ant-card-head {
    background: #fafafa;
    border-bottom: 1px solid #f0f0f0;
  }
`;

const FactorTag = styled(Tag)`
  margin: 2px;
`;

const StatusTag = ({ status }: { status: string }) => {
  const colors = {
    active: 'success',
    pending: 'processing',
    deprecated: 'warning',
    rejected: 'error'
  };
  return <Tag color={colors[status as keyof typeof colors] || 'default'}>{status}</Tag>;
};

type Factor = {
  id: string;
  name: string;
  description?: string;
  currentValue: number;
  unit: string;
  region?: string;
  category: {
    name: string;
  };
  source: {
    name: string;
    version: string;
    url?: string;
  };
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  createdBy: string;
  approvedBy?: string;
  versions: Array<{
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
  }>;
  _count: {
    versions: number;
    dependencies: number;
    changeRequests: number;
  };
};

type Props = {
  user: DashboardUser;
  factors: Factor[];
  categories: Array<{ id: string; name: string; description?: string }>;
  sources: Array<{ id: string; name: string; version: string; url?: string }>;
};

export default function ConstantsPage({ user, factors, categories, sources }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [versionModal, setVersionModal] = useState<{ visible: boolean; factor: Factor | null }>({
    visible: false,
    factor: null
  });

  // Filter factors
  const filteredFactors = factors.filter(factor => {
    const matchesSearch =
      factor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      factor.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || factor.category.name === selectedCategory;
    const matchesSource = !selectedSource || factor.source.name === selectedSource;
    return matchesSearch && matchesCategory && matchesSource;
  });

  const columns = [
    {
      title: 'Factor',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Factor) => (
        <div>
          <Text strong>{name}</Text>
          {record.description && (
            <div>
              <Text type='secondary' style={{ fontSize: 12 }}>
                {record.description}
              </Text>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Value',
      key: 'value',
      render: (record: Factor) => (
        <div>
          <Text strong>{record.currentValue.toLocaleString()}</Text>
          <Text type='secondary'> {record.unit}</Text>
          {record.region && <FactorTag>{record.region}</FactorTag>}
        </div>
      )
    },
    {
      title: 'Source',
      key: 'source',
      render: (record: Factor) => (
        <div>
          <Text>{record.source.name}</Text>
          <div>
            <Text type='secondary' style={{ fontSize: 12 }}>
              v{record.source.version}
            </Text>
          </div>
        </div>
      )
    },
    {
      title: 'Category',
      dataIndex: ['category', 'name'],
      key: 'category',
      render: (category: string) => <FactorTag color='blue'>{category}</FactorTag>
    },
    {
      title: 'Status',
      key: 'status',
      render: (record: Factor) => (
        <Space direction='vertical' size={0}>
          <StatusTag status={record.isActive ? 'active' : 'deprecated'} />
          {record.approvedBy && (
            <Text type='secondary' style={{ fontSize: 11 }}>
              Approved by {record.approvedBy}
            </Text>
          )}
        </Space>
      )
    },
    {
      title: 'Governance',
      key: 'governance',
      render: (record: Factor) => (
        <Space>
          <Button
            size='small'
            icon={<HistoryOutlined />}
            onClick={() => setVersionModal({ visible: true, factor: record })}
          >
            {record._count.versions} versions
          </Button>
          <Button size='small' icon={<EditOutlined />} href={`/admin/data-science/constants/${record.id}/edit`}>
            Edit
          </Button>
        </Space>
      )
    }
  ];

  return (
    <AdminLayout title='Constants Library' selectedMenuItem='data-science/constants' user={user}>
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <Title level={2}>Constants Library</Title>
            <Paragraph>
              Industry-standard factors and constants used in calculations, with full versioning and governance. All
              values are sourced from EPA WARM, DOE, and other authoritative sources.
            </Paragraph>
          </div>
          <Button type='primary' icon={<PlusOutlined />} href='/admin/data-science/constants/new'>
            Add Factor
          </Button>
        </div>

        {/* Filters */}
        <Card style={{ marginBottom: '24px' }}>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Search
                placeholder='Search factors...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                prefix={<SearchOutlined />}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder='Filter by category'
                value={selectedCategory}
                onChange={setSelectedCategory}
                style={{ width: '100%' }}
                allowClear
              >
                {categories.map(cat => (
                  <Select.Option key={cat.id} value={cat.name}>
                    {cat.name}
                  </Select.Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder='Filter by source'
                value={selectedSource}
                onChange={setSelectedSource}
                style={{ width: '100%' }}
                allowClear
              >
                {sources.map(src => (
                  <Select.Option key={src.id} value={src.name}>
                    {src.name} v{src.version}
                  </Select.Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Button icon={<ExclamationCircleOutlined />} href='/admin/data-science/change-requests'>
                Change Requests
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={8}>
            <StyledCard size='small'>
              <div style={{ textAlign: 'center' }}>
                <Title level={3} style={{ margin: 0, color: '#2bbe50' }}>
                  {factors.length}
                </Title>
                <Text type='secondary'>Total Factors</Text>
              </div>
            </StyledCard>
          </Col>
          <Col xs={24} sm={8}>
            <StyledCard size='small'>
              <div style={{ textAlign: 'center' }}>
                <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                  {factors.filter(f => f.isActive).length}
                </Title>
                <Text type='secondary'>Active Factors</Text>
              </div>
            </StyledCard>
          </Col>
          <Col xs={24} sm={8}>
            <StyledCard size='small'>
              <div style={{ textAlign: 'center' }}>
                <Title level={3} style={{ margin: 0, color: '#722ed1' }}>
                  {sources.length}
                </Title>
                <Text type='secondary'>Data Sources</Text>
              </div>
            </StyledCard>
          </Col>
        </Row>

        {/* Factors Table */}
        <Table
          dataSource={filteredFactors}
          columns={columns}
          rowKey='id'
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} factors`
          }}
          expandable={{
            expandedRowRender: (record: Factor) => (
              <div style={{ padding: '16px', background: '#fafafa' }}>
                <Descriptions column={2} size='small'>
                  <Descriptions.Item label='Effective From'>
                    {new Date(record.effectiveFrom).toLocaleDateString()}
                  </Descriptions.Item>
                  <Descriptions.Item label='Effective To'>
                    {record.effectiveTo ? new Date(record.effectiveTo).toLocaleDateString() : 'Present'}
                  </Descriptions.Item>
                  <Descriptions.Item label='Created By'>{record.createdBy}</Descriptions.Item>
                  <Descriptions.Item label='Dependencies'>
                    {record._count.dependencies} factors depend on this
                  </Descriptions.Item>
                  <Descriptions.Item label='Change Requests'>
                    {record._count.changeRequests} pending changes
                  </Descriptions.Item>
                  {record.source.url && (
                    <Descriptions.Item label='Source URL'>
                      <a href={record.source.url} target='_blank' rel='noopener noreferrer'>
                        View Source
                      </a>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </div>
            )
          }}
        />

        {/* Version History Modal */}
        <Modal
          title={
            <Space>
              <HistoryOutlined />
              Version History: {versionModal.factor?.name}
            </Space>
          }
          open={versionModal.visible}
          onCancel={() => setVersionModal({ visible: false, factor: null })}
          footer={null}
          width={800}
        >
          {versionModal.factor && (
            <Collapse ghost>
              {versionModal.factor.versions.map((version, index) => (
                <Panel
                  key={version.id}
                  header={
                    <Space>
                      <StatusTag status={version.status} />
                      <Text strong>
                        {version.value.toLocaleString()} {version.unit}
                      </Text>
                      <Text type='secondary'>{new Date(version.createdAt).toLocaleDateString()}</Text>
                      {version.sourceVersion && <FactorTag>{version.sourceVersion}</FactorTag>}
                    </Space>
                  }
                >
                  <Descriptions column={1} size='small'>
                    <Descriptions.Item label='Change Reason'>{version.changeReason}</Descriptions.Item>
                    {version.notes && <Descriptions.Item label='Notes'>{version.notes}</Descriptions.Item>}
                    <Descriptions.Item label='Changed By'>{version.changedBy}</Descriptions.Item>
                    {version.approvedAt && (
                      <Descriptions.Item label='Approved At'>
                        {new Date(version.approvedAt).toLocaleDateString()}
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </Panel>
              ))}
            </Collapse>
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

  // Fetch all data
  const [factors, categories, sources] = await Promise.all([
    prisma.factor.findMany({
      include: {
        category: { select: { name: true } },
        source: { select: { name: true, version: true, url: true } },
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
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
        },
        _count: {
          select: {
            versions: true,
            dependencies: true,
            changeRequests: true
          }
        }
      },
      orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }]
    }),
    prisma.factorCategory.findMany({
      orderBy: { name: 'asc' }
    }),
    prisma.factorSource.findMany({
      orderBy: { name: 'asc' }
    })
  ]);

  return {
    props: serializeJSON({
      user,
      factors,
      categories,
      sources
    })
  };
};
