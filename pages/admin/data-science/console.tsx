/**
 * Model Console — a workbench for the data scientist: edit the 2.0 engine's inputs and see
 * every Dashboard metric recompute instantly, without touching any project.
 *
 * The engine runs CLIENT-SIDE against the live Data Release tables (same pattern as the
 * Validation page), so a run costs nothing and diffs against the previous run are free.
 * Defaults to the golden scenario (her workbook's Dashboard); any project's inputs can be
 * loaded by pasting its URL or id. A scratchpad evaluates =formulas with live
 * @{Database.column:rowkey} references — the same evaluator the spreadsheet cells use.
 */
import { CodeOutlined, PlayCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Checkbox, Input, Space, Table, Tag, Typography, message } from 'antd';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import type { ModelInputs, ModelOutputs, ModelTables } from 'lib/calculator/v2/combinedModel';
import { computeCombinedModel } from 'lib/calculator/v2/combinedModel';
import { GOLDEN_INPUTS } from 'lib/calculator/v2/goldenDataset';
import { getUserFromContext } from 'lib/middleware';
import { ACCESS_DENIED_REDIRECT, checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';
import type { PageProps } from 'pages/_app';
import type { ConsoleEvaluateResponse } from 'pages/api/admin/model-console/evaluate';
import type { ConsoleProjectInputsResponse } from 'pages/api/admin/model-console/project-inputs';
import type { V2ModelTablesResponse } from 'pages/api/admin/v2-model-tables';

const { Title, Text, Paragraph } = Typography;

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return ACCESS_DENIED_REDIRECT;
  if (!(await checkIsUpstream(user.org.id))) return ACCESS_DENIED_REDIRECT;
  return { props: serializeJSON({ user }) };
};

type MetricRow = { key: string; label: string; value: number; digits: number };

/** Flatten ModelOutputs into the same rows the workbook Dashboard reads. */
function metricRows(o: ModelOutputs): MetricRow[] {
  const rows: MetricRow[] = [
    {
      key: 'baselineCost',
      label: 'Baseline single-use annual cost ($)',
      value: o.financial.baselineSingleUseAnnualCost,
      digits: 2
    },
    {
      key: 'forecastCost',
      label: 'Forecast annual operating cost ($)',
      value: o.financial.forecastAnnualOperatingCost,
      digits: 2
    },
    { key: 'savings', label: 'Annual savings ($)', value: o.financial.annualSavings, digits: 2 },
    { key: 'oneTime', label: 'One-time startup cost ($)', value: o.financial.oneTimeStartupCost, digits: 2 },
    { key: 'roi', label: 'Annual savings ROI', value: o.financial.annualSavingsROI, digits: 4 },
    { key: 'payback', label: 'Payback period (months)', value: o.financial.paybackMonths ?? 0, digits: 2 }
  ];
  const triples: [string, string, ModelOutputs['singleUseUnits'], number][] = [
    ['units', 'Single-use units', o.singleUseUnits, 0],
    ['waste', 'Waste (lb)', o.wasteLb, 2],
    ['ghg', 'GHG (MTCO₂e)', o.ghgMtco2e, 4],
    ['water', 'Water (gal)', o.waterGal, 2]
  ];
  for (const [key, label, t, digits] of triples) {
    rows.push(
      { key: `${key}Baseline`, label: `${label} — baseline`, value: t.baseline, digits },
      { key: `${key}Forecast`, label: `${label} — forecast annual`, value: t.forecastAnnual, digits },
      { key: `${key}Reduction`, label: `${label} — reduction`, value: t.reduction, digits },
      { key: `${key}FirstYear`, label: `${label} — forecast first year`, value: t.forecastFirstYear, digits }
    );
  }
  if (o.dishwashing) {
    rows.push(
      { key: 'dishWater', label: 'Dishwashing — annual water (gal)', value: o.dishwashing.annualWaterGal, digits: 2 },
      { key: 'dishKwh', label: 'Dishwashing — electricity (kWh)', value: o.dishwashing.totalElectricityKwh, digits: 2 },
      { key: 'dishTherms', label: 'Dishwashing — gas (therms)', value: o.dishwashing.totalGasTherms, digits: 2 },
      { key: 'dishCost', label: 'Dishwashing — utility cost ($)', value: o.dishwashing.utilityCost, digits: 2 },
      { key: 'dishGhg', label: 'Dishwashing — GHG (MTCO₂e)', value: o.dishwashing.ghgMtco2e, digits: 4 }
    );
  }
  return rows;
}

const fmt = (v: number, digits: number) =>
  v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: digits });

export default function ModelConsolePage(_: { user: DashboardUser }) {
  const [tables, setTables] = useState<ModelTables | null>(null);
  const [tablesMissing, setTablesMissing] = useState(false);
  const [inputsText, setInputsText] = useState(() => JSON.stringify(GOLDEN_INPUTS, null, 2));
  const [inputsLabel, setInputsLabel] = useState('Golden scenario (her workbook Dashboard)');
  const [workbookFaithful, setWorkbookFaithful] = useState(true);
  const [parseError, setParseError] = useState<string | null>(null);
  const [mappingNotes, setMappingNotes] = useState<string[]>([]);
  const [current, setCurrent] = useState<MetricRow[] | null>(null);
  const [previous, setPrevious] = useState<Map<string, number> | null>(null);

  // project loader
  const [projectRef, setProjectRef] = useState('');
  const [loadingProject, setLoadingProject] = useState(false);

  // scratchpad
  const [formula, setFormula] = useState('= 2 * @{Purchase Frequency.Annual_Factor:weekly}');
  const [evalResult, setEvalResult] = useState<ConsoleEvaluateResponse | null>(null);
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    fetch('/api/admin/v2-model-tables')
      .then(r => r.json())
      .then((body: V2ModelTablesResponse) => {
        if (body.available && body.tables) setTables(body.tables);
        else setTablesMissing(true);
      })
      .catch(() => setTablesMissing(true));
  }, []);

  function run() {
    if (!tables) return;
    let inputs: ModelInputs;
    try {
      inputs = JSON.parse(inputsText);
    } catch (e) {
      setParseError(`Not valid JSON: ${(e as Error).message}`);
      return;
    }
    setParseError(null);
    try {
      const outputs = computeCombinedModel(inputs, tables, { replicateWorkbookBoxLookup: workbookFaithful });
      setPrevious(current ? new Map(current.map(r => [r.key, r.value])) : null);
      setCurrent(metricRows(outputs));
    } catch (e) {
      setParseError(`The engine rejected those inputs: ${(e as Error).message}`);
    }
  }

  async function loadProject() {
    // Accept a bare id or any project URL — Madhavi pastes whatever she has.
    const match = projectRef.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    if (!match) {
      message.warning('Paste a project URL or its id');
      return;
    }
    setLoadingProject(true);
    try {
      const res = await fetch(`/api/admin/model-console/project-inputs?projectId=${match[0]}`);
      const body: ConsoleProjectInputsResponse = await res.json();
      if (!body.ok) throw new Error(body.reason);
      setInputsText(JSON.stringify(body.inputs, null, 2));
      setInputsLabel(`Project: ${body.project.name}`);
      const notes: string[] = [];
      if (body.unmatchedSingleUse) notes.push(`${body.unmatchedSingleUse} single-use line(s) matched no 2.0 product`);
      if (body.unmatchedReusables) notes.push(`${body.unmatchedReusables} reusable line(s) matched no 2.0 product`);
      if (body.excluded.length) notes.push(`Excluded from 2.0: ${body.excluded.join(', ')}`);
      setMappingNotes(notes);
      message.success(`Loaded inputs from "${body.project.name}" — edits here never touch the project`);
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setLoadingProject(false);
    }
  }

  async function evaluate() {
    setEvaluating(true);
    setEvalResult(null);
    try {
      const res = await fetch('/api/admin/model-console/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formula })
      });
      setEvalResult(await res.json());
    } catch {
      setEvalResult({ ok: false, error: 'The evaluate request failed' });
    } finally {
      setEvaluating(false);
    }
  }

  const deltaFor = (row: MetricRow) => {
    if (!previous || !previous.has(row.key)) return null;
    const before = previous.get(row.key)!;
    return row.value - before;
  };

  return (
    <>
      <Title level={2} style={{ marginBottom: 0 }}>
        <CodeOutlined /> Model Console
      </Title>
      <Paragraph type='secondary' style={{ maxWidth: 760 }}>
        A workbench for the 2.0 engine: edit the inputs, run, and watch every Dashboard metric recompute — against the
        live databases, touching nothing. Load any project&apos;s inputs to experiment on a copy. Model-control checks
        live on the <Link href='/admin/data-science/quality'>Validation page</Link>.
      </Paragraph>

      {tablesMissing && (
        <Alert
          type='warning'
          showIcon
          style={{ marginBottom: 16 }}
          message='The Data Release tables are not loaded in this environment, so the engine cannot run.'
        />
      )}

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <Card size='small' title='Inputs' extra={<Tag>{inputsLabel}</Tag>} style={{ flex: '1 1 460px', minWidth: 380 }}>
          <Space.Compact style={{ width: '100%', marginBottom: 8 }}>
            <Input
              placeholder='Load from a project — paste its URL or id'
              value={projectRef}
              onChange={e => setProjectRef(e.target.value)}
              onPressEnter={loadProject}
            />
            <Button onClick={loadProject} loading={loadingProject}>
              Load
            </Button>
          </Space.Compact>
          {mappingNotes.map(note => (
            <Alert key={note} type='info' showIcon message={note} style={{ marginBottom: 8 }} />
          ))}
          <Input.TextArea
            value={inputsText}
            onChange={e => setInputsText(e.target.value)}
            autoSize={{ minRows: 16, maxRows: 28 }}
            style={{ fontFamily: 'monospace', fontSize: 12 }}
          />
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
            <Button type='primary' icon={<PlayCircleOutlined />} onClick={run} disabled={!tables}>
              Run the model
            </Button>
            <Checkbox checked={workbookFaithful} onChange={e => setWorkbookFaithful(e.target.checked)}>
              Workbook-faithful{' '}
              <Text type='secondary' style={{ fontSize: 12 }}>
                (keep her box-water lookup quirk — uncheck to preview the correction)
              </Text>
            </Checkbox>
            <Button
              size='small'
              type='text'
              onClick={() => {
                setInputsText(JSON.stringify(GOLDEN_INPUTS, null, 2));
                setInputsLabel('Golden scenario (her workbook Dashboard)');
                setMappingNotes([]);
              }}
            >
              Reset to golden scenario
            </Button>
          </div>
          {parseError && <Alert type='error' showIcon message={parseError} style={{ marginTop: 12 }} />}
        </Card>

        <Card size='small' title='Outputs — the Dashboard metrics' style={{ flex: '1 1 480px', minWidth: 400 }}>
          {!current ? (
            <Text type='secondary'>Run the model to see every metric. The next run also shows what changed.</Text>
          ) : (
            <Table
              size='small'
              rowKey='key'
              pagination={false}
              dataSource={current}
              columns={[
                { title: 'Metric', dataIndex: 'label' },
                {
                  title: 'Value',
                  align: 'right' as const,
                  render: (_: unknown, r: MetricRow) => (
                    <Text style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(r.value, r.digits)}</Text>
                  )
                },
                {
                  title: 'Δ vs last run',
                  align: 'right' as const,
                  width: 140,
                  render: (_: unknown, r: MetricRow) => {
                    const d = deltaFor(r);
                    if (d === null) return <Text type='secondary'>—</Text>;
                    if (Math.abs(d) < 1e-9) return <Text type='secondary'>unchanged</Text>;
                    return (
                      <Text style={{ color: '#ad6800', fontVariantNumeric: 'tabular-nums' }} strong>
                        {d > 0 ? '+' : ''}
                        {fmt(d, r.digits)}
                      </Text>
                    );
                  }
                }
              ]}
            />
          )}
        </Card>
      </div>

      <Card
        size='small'
        title={
          <>
            <ThunderboltOutlined /> Formula scratchpad
          </>
        }
        style={{ marginTop: 16, maxWidth: 760 }}
      >
        <Paragraph type='secondary' style={{ fontSize: 13, marginBottom: 8 }}>
          Evaluates against the live databases with the spreadsheet&apos;s own evaluator — nothing is stored. Reference
          any value as <Text code>@{'{Database.column:rowkey}'}</Text> (composite keys join with <Text code>|</Text>,
          lowercase). For the interactive @ picker, use a{' '}
          <Link href='/admin/data-science/databases'>database spreadsheet</Link>.
        </Paragraph>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            value={formula}
            onChange={e => setFormula(e.target.value)}
            onPressEnter={evaluate}
            style={{ fontFamily: 'monospace' }}
          />
          <Button onClick={evaluate} loading={evaluating}>
            Evaluate
          </Button>
        </Space.Compact>
        {evalResult &&
          (evalResult.ok ? (
            <div style={{ marginTop: 10 }}>
              <Text strong style={{ fontSize: 16 }}>
                = {evalResult.value.toLocaleString()}
              </Text>
              {evalResult.tokens.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  {evalResult.tokens.map(t => (
                    <Tag key={t.raw} color={t.resolved === null ? 'red' : 'geekblue'} style={{ marginBottom: 4 }}>
                      {t.raw} → {t.resolved === null ? 'unresolved' : t.resolved.toLocaleString()}
                    </Tag>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Alert type='error' showIcon message={evalResult.error} style={{ marginTop: 10 }} />
          ))}
      </Card>
    </>
  );
}

ModelConsolePage.getLayout = (page: React.ReactNode, pageProps: PageProps) => (
  <AdminLayout {...(pageProps as any)} selectedMenuItem='data-science/console' title='Model Console'>
    {page}
  </AdminLayout>
);
