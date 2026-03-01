import { PlusOutlined } from '@ant-design/icons';
import { Button, Tabs, Typography, Select, Radio } from 'antd';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { useSubscription } from 'hooks/useSubscription';
import * as S from 'layouts/styles';

const FiltersRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

import { ActiveProjects, type SortOrder } from './components/ActiveProjects';
import { ProjectTemplates } from './components/ProjectTemplates';
import { useTags } from 'hooks/useTags';

const sortOptions: { label: string; value: SortOrder }[] = [
  { label: 'Project Name', value: 'name' },
  { label: 'Project Type', value: 'type' },
  { label: 'Date Created', value: 'created' },
  { label: 'Tags', value: 'tag' },
  { label: 'Project Date', value: 'projectDate' }
];

export const ProjectsDashboard = ({
  orgId,
  isUpstream,
  showTemplateByDefault
}: {
  orgId: string;
  isUpstream: boolean;
  showTemplateByDefault: boolean;
}) => {
  const router = useRouter();
  const { tags } = useTags(orgId); // TODO: get org id from context
  //const { subscriptionStatus } = useSubscription();
  // temporary hack to allow Post-Landfill Action Network to have more projects
  // const projectLimit = orgId === '8793767e-ed9c-4adf-bb45-ba1c45378288' ? 4 : 1;

  // disable the project limit per Derek
  const projectLimitReached = false; // data?.projects && subscriptionStatus !== 'Active' && data.projects.length >= projectLimit;

  const [tagIdsFilter, setTagIdsFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<'event' | 'default' | null>(null);

  const [sortOrder, setSortOrder] = useState('created');

  useEffect(() => {
    setSortOrder(localStorage.getItem('projectSortOrder') || 'created');
  }, []);

  const handleSortChange = (value: string) => {
    setSortOrder(value);
    localStorage.setItem('projectSortOrder', value);
  };

  function upgradeAccount() {
    router.push('/subscription');
  }

  return (
    <>
      <S.HeaderRow>
        <Typography.Title>Projects</Typography.Title>
        {/* <Popconfirm
          title={
            <Space direction='vertical' size='small'>
              <Typography.Title level={5}>Upgrade to add more projects</Typography.Title>
              <Typography.Text>Free trials are limited to {projectLimit} project per account</Typography.Text>
            </Space>
          }
          disabled={!projectLimitReached}
          icon={<DollarOutlined style={{ color: '#95EE49', fontSize: 24 }} />}
          placement='left'
          onConfirm={upgradeAccount}
          okText='Upgrade'
        > */}
        {/* <Popconfirm
            title={
              <Space direction='vertical' size='small'>
                <Typography.Title level={5}>Free project limit reached</Typography.Title>
                <Typography.Text>
                  Additional fees will be charged for adding more than {tier?.projectLimit} projects
                </Typography.Text>
              </Space>
            }
            disabled={!!projectLimitReached}
            icon={<DollarOutlined style={{ color: '#95EE49', fontSize: 24 }} />}
            placement='left'
            onConfirm={newCustomProject}
          > */}
        {!projectLimitReached && (
          <Button href='/projects/new' type='primary' icon={<PlusOutlined />}>
            Start custom project
          </Button>
        )}
      </S.HeaderRow>
      <Tabs
        defaultActiveKey={showTemplateByDefault ? 'templates' : 'active'}
        size={'large'}
        tabBarExtraContent={
          <FiltersRow>
            <Radio.Group
              value={categoryFilter ?? 'all'}
              onChange={e => setCategoryFilter(e.target.value === 'all' ? null : e.target.value)}
              optionType='button'
              buttonStyle='solid'
              size='small'
            >
              <Radio.Button value='all'>All</Radio.Button>
              <Radio.Button value='default'>Projections</Radio.Button>
              <Radio.Button value='event'>Actuals</Radio.Button>
            </Radio.Group>
            <Select
              mode='multiple'
              placeholder='Filter by tag'
              style={{ minWidth: 180 }}
              options={tags.map(tag => ({ label: tag.label, value: tag.id }))}
              onChange={setTagIdsFilter}
            />
            <Select
              value={sortOrder}
              style={{ minWidth: 180 }}
              labelRender={value => <span>Sort by {value.label}</span>}
              options={sortOptions}
              onChange={handleSortChange}
            />
          </FiltersRow>
        }
        items={[
          {
            label: `Active Projects`,
            key: 'active',
            children: (
              <ActiveProjects
                tagIdsFilter={tagIdsFilter}
                sortOrder={sortOrder as SortOrder}
                tags={tags}
                categoryFilter={categoryFilter}
              />
            )
          },
          {
            label: `Templates`,
            key: 'templates',
            children: <ProjectTemplates isUpstream={isUpstream} tagIdsFilter={tagIdsFilter} />
          }
        ]}
      />
    </>
  );
};
