import { DownloadOutlined } from '@ant-design/icons';
import type { Org, ProjectCategory, User } from '@prisma/client';
import { Button, Col, DatePicker, Divider, Row, Select, Table, Tabs, Typography } from 'antd';
import dayjs from 'dayjs';
import { useRouter } from 'next/router';
import { useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

import ContentLoader from 'components/common/ContentLoader';
import { PrintButton } from 'components/common/print/PrintButton';
import { PrintHeader } from 'components/common/print/PrintHeader';
import { Spacer } from 'components/common/Spacer';
import Card from 'components/projects/[id]/projections/components/common/Card';
import * as S from 'components/projects/[id]/projections/components/common/styles';
import type { AllProjectsSummary, ProjectSummary } from 'lib/calculator/getProjections';
import { formatToDollar } from 'lib/calculator/utils';
import { requestDownload } from 'lib/files';
import { useMetricSystem } from 'components/_app/MetricSystemProvider';
import { valueInPounds, valueInGallons } from 'lib/number';
import { SummaryCardWithGraph, SummaryCard, SummaryCardSingleUseBreakdown } from './components/SummaryCardWithGraph';
import { useCurrency } from 'components/_app/CurrencyProvider';
import { columns } from './components/AnalyticsTableColumns';
import { columns as eventColumns } from './components/EventAnalyticsTableColumns';

import * as S2 from '../../../layouts/styles';
import { getReturnOrShrinkageRate } from 'components/projects/[id]/usage/UsageStep';
import { useTags } from 'hooks/useTags';

const StyledCol = styled(Col)`
  @media print {
    flex: 0 0 50% !important;
    max-width: 50% !important;
  }
`;

const FilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 12px 0;
`;

export interface PageProps {
  isUpstreamView?: boolean;
  showCategoryTabs?: boolean;
  projectCategory: ProjectCategory;
  user: User & { org: Org };
  data?: AllProjectsSummary;
  availableProjectTypes?: string[];
}

export function AnalyticsPage({
  user,
  data,
  availableProjectTypes = [],
  projectCategory,
  isUpstreamView,
  showCategoryTabs
}: PageProps) {
  const router = useRouter();
  const { tags } = useTags(user.org.id);
  const displayAsMetric = useMetricSystem();
  const { abbreviation: currencyAbbreviation } = useCurrency();
  const printRef = useRef(null);

  // Filter state — initialized from URL params
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    typeof router.query.tags === 'string' ? router.query.tags.split(',') : []
  );
  const [selectedProjectTypes, setSelectedProjectTypes] = useState<string[]>(
    typeof router.query.projectTypes === 'string' ? router.query.projectTypes.split(',') : []
  );
  const [dateRange, setDateRange] = useState<[any, any]>([
    router.query.startDate ? dayjs(router.query.startDate as string) : null,
    router.query.endDate ? dayjs(router.query.endDate as string) : null
  ]);

  const hasActiveFilters =
    selectedTagIds.length > 0 || selectedProjectTypes.length > 0 || dateRange[0] != null || dateRange[1] != null;

  // Must be before early return to satisfy hooks rules
  const { displayValue: returnRateDisplayValue, returnRatelabel } = useMemo(() => {
    if (!data) return getReturnOrShrinkageRate({ returnRate: 100, useShrinkageRate: false });
    const avgReturnRate =
      data.projects.reduce((acc, project) => {
        const returnRate = project.projections.reusableResults.summary.returnRate?.returnRate ?? 100;
        return returnRate + acc;
      }, 0) / data.projects.length;
    return getReturnOrShrinkageRate({
      returnRate: avgReturnRate,
      useShrinkageRate: user.org.useShrinkageRate
    });
  }, [data, user.org]);

  if (!data) {
    return <ContentLoader />;
  }

  function applyFilters(overrides: {
    tagIds?: string[];
    projectTypes?: string[];
    startDate?: string | null;
    endDate?: string | null;
  }) {
    const basePath = router.asPath.split('?')[0];
    const parts: string[] = [];
    if (projectCategory !== 'default') parts.push(`category=${projectCategory}`);

    const tagIds = overrides.tagIds ?? selectedTagIds;
    const projectTypes = overrides.projectTypes ?? selectedProjectTypes;
    const sd = 'startDate' in overrides ? overrides.startDate : (dateRange[0]?.format('YYYY-MM-DD') ?? null);
    const ed = 'endDate' in overrides ? overrides.endDate : (dateRange[1]?.format('YYYY-MM-DD') ?? null);

    if (tagIds.length) parts.push(`tags=${tagIds.join(',')}`);
    if (projectTypes.length) parts.push(`projectTypes=${projectTypes.join(',')}`);
    if (sd) parts.push(`startDate=${sd}`);
    if (ed) parts.push(`endDate=${ed}`);

    router.replace(parts.length ? `${basePath}?${parts.join('&')}` : basePath);
  }

  function clearFilters() {
    setSelectedTagIds([]);
    setSelectedProjectTypes([]);
    setDateRange([null, null]);
    const basePath = router.asPath.split('?')[0];
    router.replace(projectCategory !== 'default' ? `${basePath}?category=${projectCategory}` : basePath);
  }

  function setProjectCategory(category: string) {
    router.replace(`${router.asPath.split('?')[0]}?category=${category}`);
  }

  function exportOrgData() {
    const orgId = data?.projects[0]?.orgId;
    return requestDownload({
      api: `/api/org/${orgId}/export`,
      title: `Chart-Reuse Export`
    });
  }

  const rows = data.projects
    .map(project => {
      const score =
        project.projections.annualSummary.dollarCost.changePercent +
        project.projections.annualSummary.wasteWeight.changePercent +
        project.projections.annualSummary.singleUseProductCount.changePercent;
      return {
        ...project,
        hasNoData:
          project.projections.singleUseResults.summary.annualUnits.baseline === 0 &&
          project.projections.singleUseResults.summary.annualUnits.forecast === 0 &&
          project.projections.reusableResults.summary.annualUnits.baseline === 0 &&
          project.projections.reusableResults.summary.annualUnits.forecast === 0,
        isEventProject: project.category === 'event',
        useShrinkageRate: user.org.useShrinkageRate,
        score
      };
    })
    .sort((a, b) => a.score - b.score);

  const projectHasData = rows.some(project => !project.hasNoData);
  const spacing = 24;

  const bottlesSaved = data.projects.reduce((acc, project) => {
    if (project.category === 'event') {
      acc += project.projections.bottleStationResults.bottlesSaved;
    }
    return acc;
  }, 0);

  const singleUseItemsAvoided = data.projects.reduce((acc, project) => {
    if (project.category === 'event') {
      acc += project.projections.singleUseResults.summary.annualUnits.change * -1;
    }
    return acc;
  }, 0);

  const foodwareItemsAvoided = singleUseItemsAvoided - bottlesSaved;
  const showBottlesAndFoodwareBreakdown = bottlesSaved > 0 && foodwareItemsAvoided > 0;

  return (
    <div ref={printRef}>
      <PrintHeader orgName={user.org.name} />
      <S2.HeaderRow>
        <Typography.Title className='dont-print-me'>
          {isUpstreamView ? 'Upstream Analytics' : `${user.org.name}'s Analytics`}
        </Typography.Title>

        <div style={{ display: 'flex', gap: '1em' }} className='dont-print-me'>
          <PrintButton printRef={printRef} pdfTitle={`${user.org.name} Projects Overview - Chart-Reuse`} />
          <Button onClick={() => exportOrgData()}>
            <DownloadOutlined /> Export Data
          </Button>
        </div>
      </S2.HeaderRow>

      <Spacer vertical={spacing} />

      {showCategoryTabs && (
        <Tabs
          activeKey={projectCategory}
          style={{ marginBottom: 0 }}
          onChange={setProjectCategory}
          items={[
            { key: 'default', label: 'Projections' },
            { key: 'event', label: 'Actuals' }
          ]}
        />
      )}

      <FilterRow className='dont-print-me'>
        <Select
          mode='multiple'
          placeholder='Filter by project type'
          style={{ minWidth: 215 }}
          options={availableProjectTypes.map(t => ({ label: t, value: t }))}
          value={selectedProjectTypes}
          onChange={vals => {
            setSelectedProjectTypes(vals);
            applyFilters({ projectTypes: vals });
          }}
          allowClear
        />
        <DatePicker.RangePicker
          value={dateRange as any}
          placeholder={['Start date', 'End date']}
          allowEmpty={[true, true]}
          onChange={range => {
            const newRange: [any, any] = [range?.[0] ?? null, range?.[1] ?? null];
            setDateRange(newRange);
            applyFilters({
              startDate: newRange[0]?.format('YYYY-MM-DD') ?? null,
              endDate: newRange[1]?.format('YYYY-MM-DD') ?? null
            });
          }}
        />
        <Select
          mode='multiple'
          placeholder='Filter by tag'
          style={{ minWidth: 160 }}
          options={tags.map(t => ({ label: t.label, value: t.id }))}
          value={selectedTagIds}
          onChange={vals => {
            setSelectedTagIds(vals);
            applyFilters({ tagIds: vals });
          }}
          allowClear
        />
        {hasActiveFilters && (
          <Button onClick={clearFilters} size='small'>
            Clear filters
          </Button>
        )}
      </FilterRow>

      <Divider style={{ margin: 0 }} />

      <Spacer vertical={spacing} />

      <Row gutter={[24, 24]}>
        {bottlesSaved > 0 && (
          <StyledCol xs={24} lg={12}>
            <SummaryCard
              label='Water bottles avoided'
              value={`${Math.round(bottlesSaved).toLocaleString()} bottles`}
              projectHasData={projectHasData}
            />
          </StyledCol>
        )}
        {projectCategory === 'event' && !showBottlesAndFoodwareBreakdown && (
          <StyledCol xs={24} lg={12}>
            <SummaryCard
              label='Single-use items avoided'
              value={`${Math.round(singleUseItemsAvoided).toLocaleString()} items`}
              projectHasData={projectHasData}
            />
          </StyledCol>
        )}
        {projectCategory === 'event' && showBottlesAndFoodwareBreakdown && (
          <StyledCol xs={24} lg={12}>
            <SummaryCardSingleUseBreakdown
              label='Single-use items avoided'
              bottleAvoided={bottlesSaved}
              foodwareItemsAvoided={foodwareItemsAvoided}
              projectHasData={projectHasData}
            />
          </StyledCol>
        )}
        {projectCategory !== 'event' && (
          <StyledCol xs={24} md={12}>
            <SummaryCardWithGraph
              label='Estimated Savings'
              projectHasData={projectHasData}
              isEventProject={false}
              formatter={val => formatToDollar(val, currencyAbbreviation)}
              value={data.summary.savings}
            />
          </StyledCol>
        )}
        {projectCategory !== 'event' && (
          <StyledCol xs={24} md={12}>
            <SummaryCardWithGraph
              label='Single-Use Reduction'
              isEventProject={false}
              projectHasData={projectHasData}
              units='units'
              value={data.summary.singleUse}
            />
          </StyledCol>
        )}
        <StyledCol xs={24} md={12}>
          <SummaryCardWithGraph
            label={projectCategory === 'event' ? 'Waste to landfill prevented' : 'Waste reduction'}
            isEventProject={projectCategory === 'event'}
            projectHasData={projectHasData}
            units={displayAsMetric ? 'kg' : 'lbs'}
            formatter={val =>
              Math.round(valueInPounds(val, { displayAsMetric, displayAsTons: false })).toLocaleString()
            }
            value={data.summary.waste}
          />
        </StyledCol>
        <StyledCol xs={24} md={12}>
          <SummaryCardWithGraph
            label={projectCategory === 'event' ? 'GHG emissions' : 'GHG reduction'}
            isEventProject={projectCategory === 'event'}
            projectHasData={projectHasData}
            units='MTC02e'
            value={data.summary.gas}
            reverseChangePercent={projectCategory === 'event'}
          />
        </StyledCol>
        {projectCategory === 'event' && (
          <>
            <StyledCol xs={24} lg={12}>
              <SummaryCard
                label={returnRatelabel}
                value={`${Math.round((returnRateDisplayValue ?? 0) * 100) / 100}%`}
                projectHasData={projectHasData}
              />
            </StyledCol>
            <StyledCol xs={24} md={12}>
              <SummaryCardWithGraph
                label={projectCategory === 'event' ? `Water usage` : `Annual water usage changes`}
                isEventProject={projectCategory === 'event'}
                projectHasData={projectHasData}
                units={displayAsMetric ? 'L' : 'gal'}
                value={data.summary.water}
                formatter={val => Math.round(valueInGallons(val, { displayAsMetric })).toLocaleString()}
                reverseChangePercent={projectCategory === 'event'}
              />
            </StyledCol>
          </>
        )}
      </Row>

      <div className='page-break' />

      <Spacer vertical={spacing} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Typography.Title level={3} style={{ marginBottom: 0 }}>
          Project Leaderboard
        </Typography.Title>
        <S.SectionHeader style={{ color: 'grey', marginBottom: 0, display: 'flex', justifyContent: 'space-between' }}>
          <span>{`${data.projects.length} Projects`}</span>
        </S.SectionHeader>
      </div>
      <Spacer vertical={spacing} />
      <Divider style={{ margin: 0 }} />
      <Spacer vertical={spacing} />

      <Card>
        <Table<ProjectSummary>
          className='dont-print-me'
          dataSource={rows}
          columns={projectCategory === 'event' ? eventColumns : columns}
          rowKey='id'
          pagination={{ hideOnSinglePage: true }}
        />
        <Table<ProjectSummary>
          className='print-only'
          dataSource={rows}
          columns={projectCategory === 'event' ? eventColumns : columns}
          rowKey='id'
          pagination={{ hideOnSinglePage: true, pageSize: rows.length }}
        />
      </Card>
    </div>
  );
}
