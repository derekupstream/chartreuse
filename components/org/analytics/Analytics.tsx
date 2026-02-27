import { DownloadOutlined } from '@ant-design/icons';
import type { Org, ProjectCategory, User } from '@prisma/client';
import { Button, Col, Divider, Row, Table, Tabs, Typography } from 'antd';
import { useRouter } from 'next/router';
import { useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

import ContentLoader from 'components/common/ContentLoader';
import { PrintButton } from 'components/common/print/PrintButton';
import { PrintHeader } from 'components/common/print/PrintHeader';
import { Spacer } from 'components/common/Spacer';
import Card from 'components/projects/[id]/projections/components/common/Card';
import * as S from 'components/projects/[id]/projections/components/common/styles';
import type { AllProjectsSummary, ProjectSummary, SummaryValues } from 'lib/calculator/getProjections';
import { formatToDollar } from 'lib/calculator/utils';
import { requestDownload } from 'lib/files';
import { useMetricSystem } from 'components/_app/MetricSystemProvider';
import { valueInPounds, valueInGallons } from 'lib/number';
import { SummaryCardWithGraph, SummaryCard, SummaryCardSingleUseBreakdown } from './components/SummaryCardWithGraph';
import { useCurrency } from 'components/_app/CurrencyProvider';
import { columns } from './components/AnalyticsTableColumns';
import { columns as eventColumns } from './components/EventAnalyticsTableColumns';
import type { FacetedFilterConfig } from './components/FacetedFilterBar';
import { FacetedFilterBar } from './components/FacetedFilterBar';

import * as S2 from '../../../layouts/styles';
import { getReturnOrShrinkageRate } from 'components/projects/[id]/usage/UsageStep';
import { useTags } from 'hooks/useTags';

// ─── Types ───────────────────────────────────────────────────────────────────

/** Per-project metadata needed for client-side filtering. */
export type ProjectMeta = {
  accountId: string;
  tagIds: string[];
  USState: string | null;
  startDate: string | null; // YYYY-MM-DD
};

export interface PageProps {
  isUpstreamView?: boolean;
  showCategoryTabs?: boolean;
  projectCategory: ProjectCategory;
  user: User & { org: Org };
  data?: AllProjectsSummary;
  /** Legacy props used by the upstream view (server-side filter mode) */
  allAccounts?: { id: string; name: string }[];
  allProjects?: { id: string; accountId: string; name: string }[];
  /**
   * When provided, filtering is done client-side (instant, no reload).
   * When absent ({} or undefined), the component falls back to URL-param navigation.
   */
  projectMetadata?: Record<string, ProjectMeta>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const defaultSummaryValues = (): SummaryValues => ({ baseline: 0, forecast: 0, forecasts: [] });

/** Recompute the AllProjectsSummary.summary from a filtered project list (same logic as server). */
function computeSummary(projects: ProjectSummary[]): AllProjectsSummary['summary'] {
  return projects.reduce(
    (acc, curr) => {
      acc.savings.baseline += curr.projections.annualSummary.dollarCost.baseline;
      acc.savings.forecast += curr.projections.annualSummary.dollarCost.forecast;
      acc.savings.forecasts.push(curr.projections.annualSummary.dollarCost.forecast);

      acc.waste.baseline += curr.projections.annualSummary.wasteWeight.baseline;
      acc.waste.forecast += curr.projections.annualSummary.wasteWeight.forecast;
      acc.waste.forecasts.push(curr.projections.annualSummary.wasteWeight.forecast);

      acc.singleUse.baseline += curr.projections.singleUseResults.summary.annualCost.baseline;
      acc.singleUse.forecast += curr.projections.singleUseResults.summary.annualCost.forecast;
      acc.singleUse.forecasts.push(curr.projections.singleUseResults.summary.annualCost.forecast);

      acc.gas.baseline += curr.projections.annualSummary.greenhouseGasEmissions.total.baseline;
      acc.gas.forecast += curr.projections.annualSummary.greenhouseGasEmissions.total.forecast;
      acc.gas.forecasts.push(curr.projections.annualSummary.greenhouseGasEmissions.total.forecast);

      acc.water.baseline += curr.projections.environmentalResults.annualWaterUsageChanges.total.baseline;
      acc.water.forecast += curr.projections.environmentalResults.annualWaterUsageChanges.total.forecast;
      acc.water.forecasts.push(curr.projections.environmentalResults.annualWaterUsageChanges.total.forecast);

      return acc;
    },
    {
      savings: defaultSummaryValues(),
      singleUse: defaultSummaryValues(),
      waste: defaultSummaryValues(),
      gas: defaultSummaryValues(),
      water: defaultSummaryValues()
    }
  );
}

/** Client-side project filter. Projects missing from metadata pass through unfiltered. */
function applyClientFilter(
  projects: ProjectSummary[],
  metadata: Record<string, ProjectMeta>,
  selected: Record<string, string[]>,
  dateRange: [string | null, string | null]
): ProjectSummary[] {
  const { tags = [], accounts = [], states = [], projects: projectIds = [] } = selected;
  const [startDate, endDate] = dateRange;
  const hasAny = tags.length || accounts.length || states.length || projectIds.length || startDate || endDate;
  if (!hasAny) return projects;

  return projects.filter(p => {
    const meta = metadata[p.id];
    if (!meta) return true; // unknown project → pass through

    // Account OR project (cross-filter OR within this dimension)
    if (accounts.length || projectIds.length) {
      const matchesAccount = accounts.length ? accounts.includes(meta.accountId) : false;
      const matchesProject = projectIds.length ? projectIds.includes(p.id) : false;
      if (!matchesAccount && !matchesProject) return false;
    }
    // Tags (OR within, AND with other facets)
    if (tags.length && !tags.some(id => meta.tagIds.includes(id))) return false;
    // State (OR within)
    if (states.length && !states.includes(meta.USState || '')) return false;
    // Date range (inclusive)
    if (startDate && meta.startDate && meta.startDate < startDate) return false;
    if (endDate && meta.startDate && meta.startDate > endDate) return false;

    return true;
  });
}

// ─── Styled ──────────────────────────────────────────────────────────────────

const StyledCol = styled(Col)`
  @media print {
    flex: 0 0 50% !important;
    max-width: 50% !important;
  }
`;

// ─── Component ───────────────────────────────────────────────────────────────

export function AnalyticsPage({
  user,
  data,
  allAccounts,
  allProjects,
  projectCategory,
  isUpstreamView,
  showCategoryTabs,
  projectMetadata = {}
}: PageProps) {
  const router = useRouter();
  const { tags } = useTags(user.org.id);
  const displayAsMetric = useMetricSystem();
  const { abbreviation: currencyAbbreviation } = useCurrency();
  const printRef = useRef(null);

  // ── Filter state ──────────────────────────────────────────────────────────
  const hasMetadata = Object.keys(projectMetadata).length > 0;

  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({
    tags: typeof router.query.tags === 'string' ? router.query.tags.split(',') : [],
    accounts: typeof router.query.accounts === 'string' ? router.query.accounts.split(',') : [],
    states: typeof router.query.states === 'string' ? router.query.states.split(',') : [],
    projects: typeof router.query.projects === 'string' ? router.query.projects.split(',') : []
  });
  const [dateRange, setDateRange] = useState<[string | null, string | null]>([
    (router.query.startDate as string) || null,
    (router.query.endDate as string) || null
  ]);

  // ── Compute filtered data ─────────────────────────────────────────────────
  const filteredProjects = useMemo(() => {
    if (!data) return [];
    if (!hasMetadata) return data.projects; // upstream: already server-filtered
    return applyClientFilter(data.projects, projectMetadata, selectedFilters, dateRange);
  }, [data, hasMetadata, projectMetadata, selectedFilters, dateRange]);

  const filteredSummary = useMemo(() => {
    if (!data) return undefined;
    if (!hasMetadata) return data.summary; // upstream: use pre-computed server summary
    return computeSummary(filteredProjects);
  }, [data, hasMetadata, filteredProjects]);

  // ── returnRate (must be before early return) ──────────────────────────────
  const { displayValue: returnRateDisplayValue, returnRatelabel } = useMemo(() => {
    if (!filteredProjects.length) return getReturnOrShrinkageRate({ returnRate: 100, useShrinkageRate: false });
    const avgReturnRate =
      filteredProjects.reduce((acc, project) => {
        return acc + (project.projections.reusableResults.summary.returnRate?.returnRate ?? 100);
      }, 0) / filteredProjects.length;
    return getReturnOrShrinkageRate({
      returnRate: avgReturnRate,
      useShrinkageRate: user.org.useShrinkageRate
    });
  }, [filteredProjects, user.org]);

  // ── Build filter chip configs ─────────────────────────────────────────────
  const filterConfigs = useMemo<FacetedFilterConfig[]>(() => {
    if (!data) return [];
    const configs: FacetedFilterConfig[] = [];

    // Tags — from the useTags hook
    if (tags.length > 0) {
      configs.push({
        key: 'tags',
        label: 'Tag',
        options: tags.map(t => ({ value: t.id, label: t.label }))
      });
    }

    // Accounts — from allAccounts prop (upstream view) OR derived from metadata
    const accountOptions =
      allAccounts && allAccounts.length > 1
        ? allAccounts.map(a => ({ value: a.id, label: a.name }))
        : hasMetadata
          ? Array.from(
              new Map(
                data.projects.map(p => [
                  projectMetadata[p.id]?.accountId || p.id,
                  { value: projectMetadata[p.id]?.accountId || '', label: p.account.name }
                ])
              ).values()
            ).filter(a => a.value)
          : [];
    if (accountOptions.length > 1) {
      configs.push({ key: 'accounts', label: 'Account', options: accountOptions });
    }

    // States — derived from projectMetadata
    if (hasMetadata) {
      const states = Array.from(
        new Set(
          Object.values(projectMetadata)
            .map(m => m.USState)
            .filter((s): s is string => !!s)
        )
      ).sort();
      if (states.length > 0) {
        configs.push({
          key: 'states',
          label: 'State',
          options: states.map(s => ({ value: s, label: s }))
        });
      }
    }

    // Projects — from allProjects prop (upstream) OR from data.projects
    const projectOptions = allProjects
      ? allProjects.map(p => ({ value: p.id, label: p.name }))
      : data.projects.map(p => ({ value: p.id, label: `${p.account.name}: ${p.name}` }));
    if (projectOptions.length > 1) {
      configs.push({ key: 'projects', label: 'Project', options: projectOptions });
    }

    return configs;
  }, [data, tags, allAccounts, allProjects, projectMetadata, hasMetadata]);

  // ── Filter change handlers ────────────────────────────────────────────────

  function handleFilterChange(key: string, values: string[]) {
    const next = { ...selectedFilters, [key]: values };
    setSelectedFilters(next);

    if (!hasMetadata) {
      // URL-navigation mode (upstream view)
      navigateWithFilters(next, dateRange);
    }
    // else: client-side — the useMemo above recomputes automatically
  }

  function handleDateChange(range: [string | null, string | null]) {
    setDateRange(range);
    if (!hasMetadata) {
      navigateWithFilters(selectedFilters, range);
    }
  }

  function handleClearAll() {
    const empty = Object.fromEntries(Object.keys(selectedFilters).map(k => [k, []]));
    setSelectedFilters(empty);
    setDateRange([null, null]);
    if (!hasMetadata) {
      const base = router.asPath.split('?')[0];
      router.replace(projectCategory !== 'default' ? `${base}?category=${projectCategory}` : base);
    }
  }

  function navigateWithFilters(filters: Record<string, string[]>, range: [string | null, string | null]) {
    const base = router.asPath.split('?')[0];
    const parts: string[] = [];
    if (projectCategory !== 'default') parts.push(`category=${projectCategory}`);
    if (filters.accounts?.length) parts.push(`accounts=${filters.accounts.join(',')}`);
    if (filters.projects?.length) parts.push(`projects=${filters.projects.join(',')}`);
    if (filters.tags?.length) parts.push(`tags=${filters.tags.join(',')}`);
    if (filters.states?.length) parts.push(`states=${filters.states.join(',')}`);
    if (range[0]) parts.push(`startDate=${range[0]}`);
    if (range[1]) parts.push(`endDate=${range[1]}`);
    router.replace(parts.length ? `${base}?${parts.join('&')}` : base);
  }

  function setProjectCategory(category: string) {
    router.replace(`${router.asPath.split('?')[0]}?category=${category}`);
  }

  function exportOrgData() {
    const orgId = data?.projects[0]?.orgId;
    return requestDownload({ api: `/api/org/${orgId}/export`, title: `Chart-Reuse Export` });
  }

  // ── Early return ─────────────────────────────────────────────────────────
  if (!data || !filteredSummary) {
    return <ContentLoader />;
  }

  // ── Derived display values ────────────────────────────────────────────────
  const rows = filteredProjects
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

  const projectHasData = rows.some(p => !p.hasNoData);
  const spacing = 24;

  const bottlesSaved = filteredProjects.reduce((acc, p) => {
    return acc + (p.category === 'event' ? p.projections.bottleStationResults.bottlesSaved : 0);
  }, 0);

  const singleUseItemsAvoided = filteredProjects.reduce((acc, p) => {
    return acc + (p.category === 'event' ? p.projections.singleUseResults.summary.annualUnits.change * -1 : 0);
  }, 0);

  const foodwareItemsAvoided = singleUseItemsAvoided - bottlesSaved;
  const showBottlesAndFoodwareBreakdown = bottlesSaved > 0 && foodwareItemsAvoided > 0;

  // ── Render ────────────────────────────────────────────────────────────────
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

      {/* Faceted filter bar */}
      <div className='dont-print-me'>
        <FacetedFilterBar
          filters={filterConfigs}
          selected={selectedFilters}
          dateRange={dateRange}
          onChange={handleFilterChange}
          onDateChange={handleDateChange}
          onClearAll={handleClearAll}
        />
      </div>

      <Divider style={{ margin: 0 }} />

      <Spacer vertical={spacing} />

      {/* Summary cards */}
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
              value={filteredSummary.savings}
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
              value={filteredSummary.singleUse}
            />
          </StyledCol>
        )}
        <StyledCol xs={24} md={12}>
          <SummaryCardWithGraph
            label={projectCategory === 'event' ? 'Waste to landfill prevented' : 'Waste reduction'}
            isEventProject={projectCategory === 'event'}
            projectHasData={projectHasData}
            units={displayAsMetric ? 'kg' : 'lbs'}
            formatter={val => valueInPounds(val, { displayAsMetric, displayAsTons: false }).toLocaleString()}
            value={filteredSummary.waste}
          />
        </StyledCol>
        <StyledCol xs={24} md={12}>
          <SummaryCardWithGraph
            label={projectCategory === 'event' ? 'GHG emissions' : 'GHG reduction'}
            isEventProject={projectCategory === 'event'}
            projectHasData={projectHasData}
            units='MTC02e'
            value={filteredSummary.gas}
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
                value={filteredSummary.water}
                formatter={val => valueInGallons(val, { displayAsMetric })}
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
          <span>{`${filteredProjects.length} Projects`}</span>
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
