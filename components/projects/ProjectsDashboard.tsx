import { PlusOutlined } from '@ant-design/icons';
import { Button, Tabs, Typography, Select, Radio } from 'antd';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { useChartReuse2 } from 'hooks/useChartReuse2';
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

export type ProjectsDashboardMode = 'projects' | 'dashboards';

export const ProjectsDashboard = ({
  orgId,
  isUpstream,
  showTemplateByDefault,
  mode = 'projects'
}: {
  orgId: string;
  isUpstream: boolean;
  showTemplateByDefault: boolean;
  mode?: ProjectsDashboardMode;
}) => {
  const router = useRouter();
  const { tags } = useTags(orgId);
  const { enabled: v2Enabled } = useChartReuse2();

  const isDashboards = mode === 'dashboards';
  const projectLimitReached = false;

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

  // In v2, the page itself defines what kind of data lives here, so the legacy
  // category radio is hidden and dataType becomes the implicit filter.
  const dataTypeFilter = v2Enabled ? (isDashboards ? 'actual' : 'projection') : null;

  const headerTitle = (() => {
    if (!v2Enabled) return 'Projects';
    return isDashboards ? 'Dashboards' : 'Calculators';
  })();

  const createHref = isDashboards ? '/projects/new?dataType=actual' : '/projects/new?dataType=projection';
  const createLabel = isDashboards ? 'Record actual' : 'Start custom project';

  const emptyState = isDashboards ? (
    <Typography.Text>
      No actuals recorded yet. Click <strong>+ Record actual</strong> above to log a real event or operation.
    </Typography.Text>
  ) : undefined;

  return (
    <>
      <S.HeaderRow>
        <Typography.Title>{headerTitle}</Typography.Title>
        {!projectLimitReached && (
          <Button href={createHref} type='primary' icon={<PlusOutlined />}>
            {createLabel}
          </Button>
        )}
      </S.HeaderRow>
      <Tabs
        defaultActiveKey={showTemplateByDefault ? 'templates' : 'active'}
        size={'large'}
        tabBarExtraContent={
          <FiltersRow>
            {!v2Enabled && (
              <Radio.Group
                value={categoryFilter ?? 'all'}
                onChange={e => setCategoryFilter(e.target.value === 'all' ? null : e.target.value)}
                optionType='button'
                buttonStyle='solid'
              >
                <Radio.Button value='all'>All</Radio.Button>
                <Radio.Button value='default'>Projections</Radio.Button>
                <Radio.Button value='event'>Actuals</Radio.Button>
              </Radio.Group>
            )}
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
                dataTypeFilter={dataTypeFilter}
                emptyState={emptyState}
              />
            )
          },
          ...(isDashboards
            ? []
            : [
                {
                  label: `Templates`,
                  key: 'templates',
                  children: <ProjectTemplates isUpstream={isUpstream} tagIdsFilter={tagIdsFilter} />
                }
              ])
        ]}
      />
    </>
  );
};
