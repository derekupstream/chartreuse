import {
  DeleteOutlined,
  DownOutlined,
  DownloadOutlined,
  ExportOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  PrinterOutlined,
  SaveOutlined
} from '@ant-design/icons';
import type { Org, ProjectCategory, User } from '@prisma/client';
import {
  Badge,
  Button,
  Col,
  DatePicker,
  Divider,
  Dropdown,
  Input,
  Modal,
  Row,
  Select,
  Tabs,
  Tooltip,
  Typography
} from 'antd';
import dayjs from 'dayjs';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import styled from 'styled-components';

import ContentLoader from 'components/common/ContentLoader';
import { PrintHeader } from 'components/common/print/PrintHeader';
import { Spacer } from 'components/common/Spacer';
import Card from 'components/projects/[id]/projections/components/common/Card';
import * as S from 'components/projects/[id]/projections/components/common/styles';
import type { AllProjectsSummary, ProjectSummary } from 'lib/calculator/getProjections';
import { formatToDollar } from 'lib/calculator/utils';
import { requestDownload } from 'lib/files';
import { useMetricSystem } from 'components/_app/MetricSystemProvider';
import { useChartReuse2 } from 'hooks/useChartReuse2';
import { valueInPounds, valueInGallons } from 'lib/number';
import { SummaryCardWithGraph, SummaryCard, SummaryCardSingleUseBreakdown } from './components/SummaryCardWithGraph';
import { useCurrency } from 'components/_app/CurrencyProvider';
import { ScenarioPlanner, getMultipliedSummary, type ScenarioMultipliers } from './components/ScenarioPlanner';
import { ShareAnalyticsButton } from './components/ShareAnalyticsButton';
import { ProjectionTimeline } from './components/ProjectionTimeline';
import { ImpactTimeline } from './components/ImpactTimeline';
import { ScenarioTimeline } from './components/ScenarioTimeline';

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

const LBCard = styled.div`
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 16px;
  background: #fff;
`;

const LBRow = styled.div`
  display: grid;
  grid-template-columns: 1.8fr 90px 90px 80px 55px;
  gap: 8px;
  align-items: center;
  padding: 5px 0;
  font-size: 13px;
  border-bottom: 1px solid #f5f5f5;
  &:last-child {
    border-bottom: none;
  }
`;

const LBHeader = styled(LBRow)`
  font-size: 11px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.45);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border-bottom: 1px solid #e8e8e8 !important;
  padding-bottom: 8px;
  margin-bottom: 4px;
`;

function fmtSigned(n: number, fmt: (abs: number) => string): string {
  const abs = Math.abs(n);
  if (n > 0) return `+${fmt(abs)}`;
  if (n < 0) return `-${fmt(abs)}`;
  return fmt(0);
}

function LeaderboardCard({
  project,
  isEvent,
  onExclude,
  onReinclude,
  isExcluded
}: {
  project: ProjectSummary;
  isEvent: boolean;
  onExclude?: () => void;
  onReinclude?: () => void;
  isExcluded?: boolean;
}) {
  const displayAsMetric = useMetricSystem();
  const { abbreviation: currency } = useCurrency();
  const s = project.projections.annualSummary;
  const env = project.projections.environmentalResults;
  const wt = (abs: number) =>
    Math.round(valueInPounds(abs, { displayAsMetric, displayAsTons: false })).toLocaleString();

  type RowData = {
    label: string;
    c1: string;
    c2: string;
    changeNum: number;
    pct: number;
    fmtAbs: (n: number) => string;
  };

  const metricRows: RowData[] = isEvent
    ? [
        {
          label: 'Single-use reduction (units)',
          c1: Math.round(s.singleUseProductCount.baseline).toLocaleString(),
          c2: '0',
          changeNum: s.singleUseProductCount.change * -1,
          pct: (s.singleUseProductCount.changePercent ?? 0) * -1,
          fmtAbs: n => Math.round(n).toLocaleString()
        },
        {
          label: `Waste prevention (${displayAsMetric ? 'kg' : 'lb'})`,
          c1: wt(s.wasteWeight.baseline),
          c2: wt(s.wasteWeight.forecast),
          changeNum: s.wasteWeight.change * -1,
          pct: (s.wasteWeight.changePercent ?? 0) * -1,
          fmtAbs: wt
        },
        {
          label: 'GHG emissions (MTC02e)',
          c1: s.greenhouseGasEmissions.total.baseline.toFixed(2),
          c2: s.greenhouseGasEmissions.total.forecast.toFixed(2),
          changeNum: s.greenhouseGasEmissions.total.change * -1,
          pct: (s.greenhouseGasEmissions.total.changePercent ?? 0) * -1,
          fmtAbs: n => n.toFixed(2)
        },
        {
          label: `Water usage (${displayAsMetric ? 'L' : 'gal'})`,
          c1: Math.round(env.annualWaterUsageChanges.total.baseline).toLocaleString(),
          c2: Math.round(env.annualWaterUsageChanges.total.forecast).toLocaleString(),
          changeNum: env.annualWaterUsageChanges.total.change * -1,
          pct: (env.annualWaterUsageChanges.total.changePercent ?? 0) * -1,
          fmtAbs: n => Math.round(n).toLocaleString()
        }
      ]
    : [
        {
          label: 'Estimated savings',
          c1: formatToDollar(s.dollarCost.baseline, currency),
          c2: formatToDollar(s.dollarCost.forecast, currency),
          changeNum: s.dollarCost.change * -1,
          pct: (s.dollarCost.changePercent ?? 0) * -1,
          fmtAbs: n => formatToDollar(n, currency)
        },
        {
          label: `Waste reduction (${displayAsMetric ? 'kg' : 'lb'})`,
          c1: wt(s.wasteWeight.baseline),
          c2: wt(s.wasteWeight.forecast),
          changeNum: s.wasteWeight.change * -1,
          pct: (s.wasteWeight.changePercent ?? 0) * -1,
          fmtAbs: wt
        },
        {
          label: 'Single-use reduction (units)',
          c1: Math.round(s.singleUseProductCount.baseline).toLocaleString(),
          c2: Math.round(s.singleUseProductCount.forecast).toLocaleString(),
          changeNum: s.singleUseProductCount.change * -1,
          pct: (s.singleUseProductCount.changePercent ?? 0) * -1,
          fmtAbs: n => Math.round(n).toLocaleString()
        },
        {
          label: 'GHG reduction (MTC02e)',
          c1: s.greenhouseGasEmissions.total.baseline.toFixed(2),
          c2: s.greenhouseGasEmissions.total.forecast.toFixed(2),
          changeNum: s.greenhouseGasEmissions.total.change * -1,
          pct: (s.greenhouseGasEmissions.total.changePercent ?? 0) * -1,
          fmtAbs: n => n.toFixed(2)
        }
      ];

  return (
    <LBCard>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {project.name}
          </Typography.Title>
          <Typography.Text type='secondary' style={{ fontSize: 12 }}>
            {(project as any).account?.name}
          </Typography.Text>
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <Tooltip title='Open project'>
            <a href={`/projects/${project.id}`} target='_blank' rel='noreferrer'>
              <Button size='small' type='text' icon={<ExportOutlined />} />
            </a>
          </Tooltip>
          {isExcluded ? (
            <Tooltip title='Re-include in analytics'>
              <Button size='small' type='text' icon={<EyeOutlined />} onClick={onReinclude} />
            </Tooltip>
          ) : (
            <Tooltip title='Exclude from analytics'>
              <Button size='small' type='text' icon={<EyeInvisibleOutlined />} onClick={onExclude} />
            </Tooltip>
          )}
        </div>
      </div>
      <LBHeader>
        <span>Metric</span>
        <span>{isEvent ? 'Single-use' : 'Baseline'}</span>
        <span>{isEvent ? 'Reusable' : 'Forecast'}</span>
        <span>Change</span>
        <span>%</span>
      </LBHeader>
      {metricRows.map(row => {
        const pos = row.changeNum > 0;
        const neg = row.changeNum < 0;
        const color = pos ? '#52c41a' : neg ? '#ff4d4f' : 'inherit';
        const pctStr = row.pct !== 0 ? `${row.pct > 0 ? '+' : ''}${Math.round(row.pct)}%` : '—';
        return (
          <LBRow key={row.label}>
            <span>{row.label}</span>
            <span style={{ color: 'rgba(0,0,0,0.65)' }}>{row.c1}</span>
            <span style={{ color: 'rgba(0,0,0,0.65)' }}>{row.c2}</span>
            <span style={{ color, fontWeight: 500 }}>{fmtSigned(row.changeNum, row.fmtAbs)}</span>
            <span style={{ color }}>{pctStr}</span>
          </LBRow>
        );
      })}
    </LBCard>
  );
}

type SavedView = {
  id: string;
  name: string;
  tagIds: string[];
  projectTypes: string[];
  startDate: string | null;
  endDate: string | null;
};

function useSavedViews(orgId: string) {
  const key = `cr_analytics_views_${orgId}`;

  function getStored(): SavedView[] {
    try {
      return JSON.parse(localStorage.getItem(key) ?? '[]');
    } catch {
      return [];
    }
  }

  // Defer localStorage read to useEffect — first server + client paint must match.
  const [views, setViews] = useState<SavedView[]>([]);
  useEffect(() => {
    setViews(getStored());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  function saveView(name: string, filters: Omit<SavedView, 'id' | 'name'>) {
    const next: SavedView = { id: Date.now().toString(), name, ...filters };
    const updated = [...views, next];
    localStorage.setItem(key, JSON.stringify(updated));
    setViews(updated);
  }

  function deleteView(id: string) {
    const updated = views.filter(v => v.id !== id);
    localStorage.setItem(key, JSON.stringify(updated));
    setViews(updated);
  }

  return { views, saveView, deleteView };
}

type ActiveTab = 'projections' | 'actuals' | 'scenarios';

export interface PageProps {
  isUpstreamView?: boolean;
  showCategoryTabs?: boolean;
  isReadOnly?: boolean;
  projectCategory: ProjectCategory;
  user: User & { org: Org & { analyticsSlug?: string | null } };
  data?: AllProjectsSummary;
  availableProjectTypes?: string[];
  initialTab?: ActiveTab;
  initialScenarioMultipliers?: ScenarioMultipliers;
  initialTimelineYear?: number;
  /** When true, the Scenarios tab is hidden — used by /org/analytics so the
   * reporting page is just projections/actuals. The standalone /scenarios
   * route still passes initialTab='scenarios' without this flag. */
  hideScenariosTab?: boolean;
}

export function AnalyticsPage({
  user,
  data,
  availableProjectTypes = [],
  projectCategory,
  isUpstreamView,
  showCategoryTabs,
  isReadOnly,
  initialTab,
  initialScenarioMultipliers,
  initialTimelineYear,
  hideScenariosTab
}: PageProps) {
  const router = useRouter();
  const { tags } = useTags(user.org.id);
  const displayAsMetric = useMetricSystem();
  // Impact Projection timeline is Chart-Reuse 2.0 only in-app; public share pages
  // (isReadOnly) keep it so existing share links don't lose content.
  const { enabled: v2Enabled } = useChartReuse2();
  const showProjectionTimeline = v2Enabled || isReadOnly;
  const { abbreviation: currencyAbbreviation } = useCurrency();
  const printRef = useRef(null);
  const { views: savedViews, saveView, deleteView } = useSavedViews(user.org.id);
  const [scenarioMultipliers, setScenarioMultipliers] = useState<ScenarioMultipliers>({});
  const [timelineYear, setTimelineYear] = useState<number>(initialTimelineYear ?? 10);
  const [activeTab, setActiveTab] = useState<ActiveTab>(
    initialTab ?? (projectCategory === 'event' ? 'actuals' : 'projections')
  );

  const [activeViewId, setActiveViewId] = useState<string | undefined>(undefined);
  const [excludedProjectIds, setExcludedProjectIds] = useState<Set<string>>(new Set());
  const [showExcluded, setShowExcluded] = useState(false);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `${user.org.name} Projects Overview - Chart-Reuse`
  });

  function excludeProject(id: string) {
    setExcludedProjectIds(prev => new Set(Array.from(prev).concat(id)));
  }

  function includeProject(id: string) {
    setExcludedProjectIds(prev => {
      const next = new Set(Array.from(prev));
      next.delete(id);
      return next;
    });
  }

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

  // Client-side filter applied on top of SSR-filtered data — makes stat cards & table reactive
  const filteredProjects = useMemo(() => {
    if (!data) return [];
    const hasFilters =
      selectedTagIds.length > 0 || selectedProjectTypes.length > 0 || dateRange[0] != null || dateRange[1] != null;
    if (!hasFilters && excludedProjectIds.size === 0) return data.projects;
    return data.projects.filter(p => {
      if (excludedProjectIds.has(p.id)) return false;
      const pAny = p as any;
      if (selectedTagIds.length > 0) {
        if (!selectedTagIds.some(id => (pAny.tags ?? []).some((t: any) => t.tagId === id))) return false;
      }
      if (selectedProjectTypes.length > 0) {
        const pType = pAny.metadata?.type;
        if (!pType || !selectedProjectTypes.includes(pType)) return false;
      }
      if (dateRange[0] || dateRange[1]) {
        const d = pAny.startDate ? new Date(pAny.startDate) : new Date(pAny.createdAt);
        if (dateRange[0] && d < (dateRange[0] as dayjs.Dayjs).toDate()) return false;
        if (dateRange[1] && d > (dateRange[1] as dayjs.Dayjs).toDate()) return false;
      }
      return true;
    });
  }, [data, selectedTagIds, selectedProjectTypes, dateRange, excludedProjectIds]);

  const excludedProjectsForDisplay = useMemo(() => {
    if (!data || excludedProjectIds.size === 0) return [];
    return data.projects.filter(p => excludedProjectIds.has(p.id));
  }, [data, excludedProjectIds]);

  // Summary derived from filtered projects + scenario multipliers + timeline
  const activeSummary = useMemo(() => {
    return getMultipliedSummary(
      filteredProjects,
      projectCategory === 'event' ? {} : scenarioMultipliers,
      projectCategory === 'event' ? 1 : timelineYear
    );
  }, [filteredProjects, projectCategory, scenarioMultipliers, timelineYear]);

  if (!data) {
    return <ContentLoader />;
  }

  function promptSaveView() {
    let viewName = '';
    Modal.confirm({
      title: 'Save current view',
      content: (
        <Input
          placeholder='View name (e.g. "Q1 Projections")'
          autoFocus
          onChange={e => {
            viewName = e.target.value;
          }}
        />
      ),
      onOk() {
        if (viewName.trim()) {
          saveView(viewName.trim(), {
            tagIds: selectedTagIds,
            projectTypes: selectedProjectTypes,
            startDate: dateRange[0]?.format('YYYY-MM-DD') ?? null,
            endDate: dateRange[1]?.format('YYYY-MM-DD') ?? null
          });
        }
      },
      okText: 'Save',
      cancelText: 'Cancel'
    });
  }

  function loadView(view: SavedView) {
    setActiveViewId(view.id);
    setSelectedTagIds(view.tagIds);
    setSelectedProjectTypes(view.projectTypes);
    setDateRange([view.startDate ? dayjs(view.startDate) : null, view.endDate ? dayjs(view.endDate) : null]);
    syncFiltersToUrl({
      tagIds: view.tagIds,
      projectTypes: view.projectTypes,
      startDate: view.startDate,
      endDate: view.endDate
    });
  }

  function syncFiltersToUrl(overrides: {
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
    setActiveViewId(undefined);
    setSelectedTagIds([]);
    setSelectedProjectTypes([]);
    setDateRange([null, null]);
    const basePath = router.asPath.split('?')[0];
    router.replace(projectCategory !== 'default' ? `${basePath}?category=${projectCategory}` : basePath);
  }

  function handleTabChange(key: string) {
    const tab = key as ActiveTab;
    setActiveTab(tab);
    if (tab === 'scenarios') return; // client-side only, no URL change
    const basePath = router.asPath.split('?')[0];
    if (tab === 'actuals') {
      router.replace(`${basePath}?category=event`);
    } else {
      router.replace(basePath);
    }
  }

  function exportOrgData(category?: string) {
    const orgId = data?.projects[0]?.orgId;
    const catParam = category ? `?category=${category}` : '';
    return requestDownload({
      api: `/api/org/${orgId}/export${catParam}`,
      title: `Chart-Reuse Export`
    });
  }

  function computeRow(project: ProjectSummary) {
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
  }

  const rows = filteredProjects.map(computeRow).sort((a, b) => a.score - b.score);
  const excludedRows = excludedProjectsForDisplay.map(computeRow);

  const projectHasData = rows.some(project => !project.hasNoData);
  const spacing = 24;

  const bottlesSaved = filteredProjects.reduce((acc, project) => {
    if (project.category === 'event') {
      acc += project.projections.bottleStationResults.bottlesSaved;
    }
    return acc;
  }, 0);

  const singleUseItemsAvoided = filteredProjects.reduce((acc, project) => {
    if (project.category === 'event') {
      acc += project.projections.singleUseResults.summary.annualUnits.change * -1;
    }
    return acc;
  }, 0);

  const foodwareItemsAvoided = singleUseItemsAvoided - bottlesSaved;
  const showBottlesAndFoodwareBreakdown = bottlesSaved > 0 && foodwareItemsAvoided > 0;

  const tabItems = [
    { key: 'projections', label: 'Projections' },
    ...(showCategoryTabs ? [{ key: 'actuals', label: 'Actuals' }] : []),
    ...(hideScenariosTab ? [] : [{ key: 'scenarios', label: 'Scenarios' }])
  ];

  return (
    <div ref={printRef}>
      <PrintHeader orgName={user.org.name} />
      <S2.HeaderRow>
        <Typography.Title className='dont-print-me'>
          {isUpstreamView ? 'Upstream Analytics' : `${user.org.name}'s Analytics`}
        </Typography.Title>

        <div style={{ display: 'flex', gap: '1em' }} className='dont-print-me'>
          <Dropdown.Button
            onClick={handlePrint}
            icon={<DownOutlined />}
            menu={{
              items: [
                { key: 'projections', label: 'Print Projections' },
                { key: 'actuals', label: 'Print Actuals' }
              ],
              onClick: () => handlePrint()
            }}
          >
            <PrinterOutlined /> Print
          </Dropdown.Button>
          <Dropdown.Button
            onClick={() => exportOrgData()}
            icon={<DownOutlined />}
            menu={{
              items: [
                { key: 'all', label: 'Export All' },
                { key: 'default', label: 'Export Projections' },
                { key: 'event', label: 'Export Actuals' }
              ],
              onClick: ({ key }) => exportOrgData(key === 'all' ? undefined : key)
            }}
          >
            <DownloadOutlined /> Export Data
          </Dropdown.Button>
          {!isReadOnly && (
            <ShareAnalyticsButton
              orgId={user.org.id}
              initialSlug={user.org.analyticsSlug ?? null}
              currentScope={activeTab}
              filterParams={{
                tags: selectedTagIds,
                projectTypes: selectedProjectTypes,
                startDate: dateRange[0]?.format('YYYY-MM-DD') ?? null,
                endDate: dateRange[1]?.format('YYYY-MM-DD') ?? null
              }}
            />
          )}
        </div>
      </S2.HeaderRow>

      <Spacer vertical={spacing} />

      {/* ── Sticky header block: tabs + filters + summary cards pin together ── */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: '#f4f3f0',
          paddingTop: 8,
          paddingBottom: 12,
          marginBottom: 4,
          boxShadow: '0 4px 8px -4px rgba(0,0,0,0.08)'
        }}
        className='dont-print-me-sticky'
      >
        <Tabs activeKey={activeTab} style={{ marginBottom: 0 }} onChange={handleTabChange} items={tabItems} />

        {/* ── FilterRow — all tabs ─────────────────────────────────────────── */}
        <FilterRow className='dont-print-me'>
          {savedViews.length > 0 && (
            <Select
              placeholder='Load saved view'
              style={{ minWidth: 160 }}
              value={activeViewId}
              onSelect={(id: string | undefined) => {
                if (!id) return;
                const view = savedViews.find(v => v.id === id);
                if (view) loadView(view);
              }}
              options={savedViews.map(v => ({
                label: (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span>{v.name}</span>
                    <DeleteOutlined
                      style={{ color: '#ff4d4f', fontSize: 12 }}
                      onClick={e => {
                        e.stopPropagation();
                        deleteView(v.id);
                      }}
                    />
                  </div>
                ),
                value: v.id
              }))}
            />
          )}
          <Select
            mode='multiple'
            placeholder='Filter by project type'
            style={{ minWidth: 215 }}
            options={availableProjectTypes.map(t => ({ label: t, value: t }))}
            value={selectedProjectTypes}
            onChange={vals => {
              setSelectedProjectTypes(vals);
              syncFiltersToUrl({ projectTypes: vals });
            }}
            allowClear
          />
          {activeTab === 'actuals' && (
            <DatePicker.RangePicker
              value={dateRange as any}
              placeholder={['Start date', 'End date']}
              allowEmpty={[true, true]}
              onChange={range => {
                const newRange: [any, any] = [range?.[0] ?? null, range?.[1] ?? null];
                setDateRange(newRange);
                syncFiltersToUrl({
                  startDate: newRange[0]?.format('YYYY-MM-DD') ?? null,
                  endDate: newRange[1]?.format('YYYY-MM-DD') ?? null
                });
              }}
            />
          )}
          <Select
            mode='multiple'
            placeholder='Filter by tag'
            style={{ minWidth: 160 }}
            options={tags.map(t => ({ label: t.label, value: t.id }))}
            value={selectedTagIds}
            onChange={vals => {
              setSelectedTagIds(vals);
              syncFiltersToUrl({ tagIds: vals });
            }}
            allowClear
          />
          {hasActiveFilters && <Button onClick={clearFilters}>Clear filters</Button>}
          <Tooltip title='Save current filters as a named view'>
            <Button icon={<SaveOutlined />} onClick={promptSaveView}>
              Save view
            </Button>
          </Tooltip>
        </FilterRow>

        <Divider style={{ margin: 0 }} />

        <Spacer vertical={spacing} />

        {/* ── Summary cards — all tabs ──────────────────────────────────────── */}
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
                inspectMeta={{
                  id: 'analytics-single-use-avoided',
                  label: 'Single-Use Items Avoided',
                  type: 'calculation',
                  path: 'annualSummary.singleUseProductCount + bottleStationResults.bottlesSaved',
                  description:
                    'Sum of foodware items avoided + bottles saved from bottle stations across all filtered projects',
                  calculatorFunction: 'getSingleUseResults() + getBottleStationResults()'
                }}
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
                value={activeSummary.savings}
                inspectMeta={{
                  id: 'analytics-est-savings',
                  label: 'Estimated Savings (Aggregate)',
                  type: 'calculation',
                  path: 'annualSummary.dollarCost',
                  description: 'Aggregated annual cost savings across all filtered projects',
                  calculatorFunction: 'getAnnualCostChanges()',
                  sourceFile: 'lib/calculator/calculations/costs/getAnnualCostChanges.ts'
                }}
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
                value={activeSummary.singleUse}
                inspectMeta={{
                  id: 'analytics-single-use-reduction',
                  label: 'Single-Use Reduction (Aggregate)',
                  type: 'calculation',
                  path: 'annualSummary.singleUseProductCount',
                  description: 'Aggregated single-use unit count reduction across all filtered projects',
                  calculatorFunction: 'getSingleUseResults()',
                  sourceFile: 'lib/calculator/calculations/foodware/getSingleUseResults.ts'
                }}
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
              value={activeSummary.waste}
              inspectMeta={{
                id: 'analytics-waste',
                label: 'Waste Reduction (Aggregate)',
                type: 'calculation',
                path: 'annualSummary.wasteWeight',
                description: 'Aggregated waste weight reduction across all filtered projects',
                calculatorFunction: 'getAnnualWasteChanges()',
                sourceFile: 'lib/calculator/calculations/waste/getAnnualWasteChanges.ts'
              }}
            />
          </StyledCol>
          <StyledCol xs={24} md={12}>
            <SummaryCardWithGraph
              label={projectCategory === 'event' ? 'GHG emissions' : 'GHG reduction'}
              isEventProject={projectCategory === 'event'}
              projectHasData={projectHasData}
              units='MTC02e'
              value={activeSummary.gas}
              reverseChangePercent={projectCategory === 'event'}
              inspectMeta={{
                id: 'analytics-ghg',
                label: 'GHG Reduction (Aggregate)',
                type: 'calculation',
                path: 'annualSummary.greenhouseGasEmissions.total',
                description: 'Aggregated GHG emission reduction across all filtered projects',
                calculatorFunction: 'getAnnualGasEmissionChanges()',
                sourceFile: 'lib/calculator/calculations/ghg/getAnnualGasEmissionChanges.ts'
              }}
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
                  value={activeSummary.water}
                  formatter={val => Math.round(valueInGallons(val, { displayAsMetric })).toLocaleString()}
                  reverseChangePercent={projectCategory === 'event'}
                  inspectMeta={{
                    id: 'analytics-water',
                    label: 'Water Usage (Aggregate)',
                    type: 'calculation',
                    path: 'annualSummary.waterUsage',
                    description: 'Aggregated water usage change across all filtered projects',
                    calculatorFunction: 'getAnnualWaterUsageChanges()',
                    sourceFile: 'lib/calculator/calculations/water/getAnnualWaterUsageChanges.ts'
                  }}
                />
              </StyledCol>
            </>
          )}
        </Row>
      </div>

      {/* ── Projections timeline ─────────────────────────────────────────── */}
      {showProjectionTimeline && activeTab === 'projections' && filteredProjects.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <ProjectionTimeline
            projects={filteredProjects}
            multipliers={{}}
            timelineYear={timelineYear}
            onTimelineYearChange={setTimelineYear}
          />
        </div>
      )}

      {/* ── Actuals timeline (milestone snapshots) ───────────────────────── */}
      {activeTab === 'actuals' && (
        <div style={{ marginTop: 16 }}>
          <ImpactTimeline />
        </div>
      )}

      {/* ── Projections / Actuals leaderboard ────────────────────────────── */}
      {activeTab !== 'scenarios' && (
        <>
          <div className='page-break' />

          <Spacer vertical={spacing} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <Typography.Title level={3} style={{ marginBottom: 0 }}>
              Project Leaderboard
            </Typography.Title>
            <S.SectionHeader
              style={{ color: 'grey', marginBottom: 0, display: 'flex', justifyContent: 'space-between' }}
            >
              <span>{`${filteredProjects.length} Projects`}</span>
            </S.SectionHeader>
          </div>
          <Spacer vertical={spacing} />
          <Divider style={{ margin: 0 }} />
          <Spacer vertical={spacing} />

          <div>
            {rows.map(project => (
              <LeaderboardCard
                key={project.id}
                project={project}
                isEvent={projectCategory === 'event'}
                onExclude={() => excludeProject(project.id)}
              />
            ))}
            {excludedRows.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Divider />
                <div
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: showExcluded ? 16 : 0
                  }}
                  onClick={() => setShowExcluded(v => !v)}
                >
                  <EyeInvisibleOutlined style={{ color: 'rgba(0,0,0,0.45)' }} />
                  <Typography.Text type='secondary'>
                    Projects excluded from analytics ({excludedRows.length})
                  </Typography.Text>
                  <span style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>{showExcluded ? '▲' : '▼'}</span>
                </div>
                {showExcluded &&
                  excludedRows.map(project => (
                    <LeaderboardCard
                      key={project.id}
                      project={project}
                      isEvent={projectCategory === 'event'}
                      isExcluded
                      onReinclude={() => includeProject(project.id)}
                    />
                  ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Scenarios tab ──────────────────────────────────────────────── */}
      {activeTab === 'scenarios' && (
        <div style={{ paddingTop: 24 }}>
          <ScenarioTimeline
            projects={filteredProjects}
            orgId={user.org.id}
            activeMultipliers={scenarioMultipliers}
            timelineYear={timelineYear}
            onTimelineYearChange={setTimelineYear}
          />
          <ScenarioPlanner
            data={data}
            orgId={user.org.id}
            onMultipliersChange={setScenarioMultipliers}
            initialMultipliers={initialScenarioMultipliers}
            isReadOnly={isReadOnly}
          />
        </div>
      )}
    </div>
  );
}
