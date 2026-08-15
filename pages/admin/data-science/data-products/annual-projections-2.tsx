/**
 * Test bench for the "Annual Projections (Methodology 2.0)" data product — Madhavi's
 * Dashboard tab as an interactive calculator.
 *
 * Inputs start at the workbook's golden scenario; outputs compute live (client-side, pure
 * functions over the Data Release tables). While inputs equal the golden scenario, every
 * output is checked against the workbook's expected values and badged PASS/FAIL — change
 * anything and the badges step aside, Reset brings them back. That's the confidence loop:
 * prove the math on known ground truth, then explore.
 *
 * Golden source: the workbook's own example (Scenario_SU / Scenario_Reuse / Dishwashing /
 * Dashboard), the same values enforced in CI by combinedModel.golden.spec.ts. Computed
 * workbook-faithful by default (including the known box-water quirk, review feedback #1) so
 * the match to her Dashboard is exact; a switch shows the corrected behaviour.
 */
import { CheckCircleFilled, CloseCircleFilled, UndoOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Col, InputNumber, Row, Select, Spin, Switch, Table, Tag, Typography } from 'antd';
import type { GetServerSideProps } from 'next';
import { useEffect, useMemo, useState } from 'react';

import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import { computeCombinedModel } from 'lib/calculator/v2/combinedModel';
import type { ModelInputs, ModelTables } from 'lib/calculator/v2/combinedModel';
import { getUserFromContext } from 'lib/middleware';
import { ACCESS_DENIED_REDIRECT, checkIsUpstream } from 'lib/middleware/requireUpstream';
import { serializeJSON } from 'lib/objects';
import type { PageProps } from 'pages/_app';
import type { V2ModelTablesResponse } from 'pages/api/admin/v2-model-tables';

const { Title, Text, Paragraph } = Typography;

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context, { org: true });
  if (!user?.org.isUpstream) return ACCESS_DENIED_REDIRECT;
  if (!(await checkIsUpstream(user.org.id))) return ACCESS_DENIED_REDIRECT;
  return { props: serializeJSON({ user }) };
};

/** The workbook's example scenario — the golden dataset. Do not edit; edit copies of it. */
const GOLDEN: ModelInputs = {
  singleUse: [
    {
      productId: 17,
      baselineFrequency: 'Weekly',
      baselineCasesPerFrequency: 10,
      baselineUnitsPerCase: 200,
      baselineCostPerCase: 80,
      forecastFrequency: 'Weekly',
      forecastCasesPerFrequency: 0,
      forecastUnitsPerCase: 200,
      forecastCostPerCase: 80
    },
    {
      productId: 7,
      baselineFrequency: 'Weekly',
      baselineCasesPerFrequency: 15,
      baselineUnitsPerCase: 1000,
      baselineCostPerCase: 30,
      forecastFrequency: 'Weekly',
      forecastCasesPerFrequency: 5,
      forecastUnitsPerCase: 1000,
      forecastCostPerCase: 30
    },
    {
      productId: 3,
      baselineFrequency: 'Weekly',
      baselineCasesPerFrequency: 20,
      baselineUnitsPerCase: 1000,
      baselineCostPerCase: 20,
      forecastFrequency: 'Weekly',
      forecastCasesPerFrequency: 10,
      forecastUnitsPerCase: 1000,
      forecastCostPerCase: 20
    }
  ],
  reusables: [{ productId: 100, initialCases: 10, unitsPerCase: 12, costPerCase: 2.28, annualRepurchaseRate: 0.1 }],
  dishwashing: {
    state: 'California',
    machineType: 'Stationary Single Tank Door',
    temperature: 'High',
    energyStar: true,
    buildingHeaterFuel: 'Electric',
    boosterHeaterFuel: 'Electric',
    operatingDaysPerYear: 365,
    racksPerDay: 80
  }
};

/** Expected outputs, verbatim from the workbook's Dashboard tab (workbook-faithful mode). */
const EXPECTED = [
  { key: 'baselineCost', label: 'Baseline single-use annual cost ($)', value: 85800, digits: 2 },
  { key: 'forecastCost', label: 'Forecast annual operating cost ($)', value: 19633.10745, digits: 2 },
  { key: 'savings', label: 'Annual savings ($)', value: 66166.89255, digits: 2 },
  { key: 'oneTime', label: 'One-time startup cost ($)', value: 22.8, digits: 2 },
  { key: 'unitsBase', label: 'Single-use units — baseline', value: 1924000, digits: 0 },
  { key: 'unitsFcst', label: 'Single-use units — forecast', value: 780000, digits: 0 },
  { key: 'wasteBase', label: 'Waste / purchased mass (lb) — baseline', value: 33644, digits: 2 },
  { key: 'wasteFcst', label: 'Waste (lb) — forecast annual', value: 8690.75, digits: 2 },
  { key: 'wasteFy', label: 'Waste (lb) — first year', value: 8758.25, digits: 2 },
  { key: 'ghgBase', label: 'GHG (MTCO₂e) — baseline', value: 104.9831739, digits: 4 },
  { key: 'ghgFcst', label: 'GHG (MTCO₂e) — forecast annual', value: 22.77655856, digits: 4 },
  { key: 'ghgFy', label: 'GHG (MTCO₂e) — first year', value: 22.84475347, digits: 4 },
  { key: 'waterBase', label: 'Water (gal) — baseline', value: 213305.5011, digits: 2 },
  { key: 'waterFcst', label: 'Water (gal) — forecast annual', value: 95161.94939, digits: 2 },
  { key: 'waterFy', label: 'Water (gal) — first year', value: 95377.24762, digits: 2 }
];

const REL_TOLERANCE = 1e-6;

export default function AnnualProjections2Bench(_: { user: DashboardUser }) {
  const [tables, setTables] = useState<ModelTables | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [inputs, setInputs] = useState<ModelInputs>(() => JSON.parse(JSON.stringify(GOLDEN)));
  const [workbookFaithful, setWorkbookFaithful] = useState(true);

  useEffect(() => {
    fetch('/api/admin/v2-model-tables')
      .then(r => r.json())
      .then((body: V2ModelTablesResponse) =>
        body.available && body.tables ? setTables(body.tables) : setUnavailable(true)
      )
      .catch(() => setUnavailable(true));
  }, []);

  const isGolden = useMemo(() => JSON.stringify(inputs) === JSON.stringify(GOLDEN), [inputs]);

  const outputs = useMemo(
    () => (tables ? computeCombinedModel(inputs, tables, { replicateWorkbookBoxLookup: workbookFaithful }) : null),
    [tables, inputs, workbookFaithful]
  );

  const computedByKey: Record<string, number> = outputs
    ? {
        baselineCost: outputs.financial.baselineSingleUseAnnualCost,
        forecastCost: outputs.financial.forecastAnnualOperatingCost,
        savings: outputs.financial.annualSavings,
        oneTime: outputs.financial.oneTimeStartupCost,
        unitsBase: outputs.singleUseUnits.baseline,
        unitsFcst: outputs.singleUseUnits.forecastAnnual,
        wasteBase: outputs.wasteLb.baseline,
        wasteFcst: outputs.wasteLb.forecastAnnual,
        wasteFy: outputs.wasteLb.forecastFirstYear,
        ghgBase: outputs.ghgMtco2e.baseline,
        ghgFcst: outputs.ghgMtco2e.forecastAnnual,
        ghgFy: outputs.ghgMtco2e.forecastFirstYear,
        waterBase: outputs.waterGal.baseline,
        waterFcst: outputs.waterGal.forecastAnnual,
        waterFy: outputs.waterGal.forecastFirstYear
      }
    : {};

  const goldenComparable = isGolden && workbookFaithful;
  const allPass =
    goldenComparable &&
    outputs &&
    EXPECTED.every(e => Math.abs(computedByKey[e.key] - e.value) / Math.max(1, Math.abs(e.value)) < REL_TOLERANCE);

  function updateSuLine(index: number, patch: Partial<ModelInputs['singleUse'][number]>) {
    setInputs(prev => ({
      ...prev,
      singleUse: prev.singleUse.map((line, i) => (i === index ? { ...line, ...patch } : line))
    }));
  }
  function updateReuseLine(index: number, patch: Partial<ModelInputs['reusables'][number]>) {
    setInputs(prev => ({
      ...prev,
      reusables: prev.reusables.map((line, i) => (i === index ? { ...line, ...patch } : line))
    }));
  }
  function updateDish(patch: Partial<NonNullable<ModelInputs['dishwashing']>>) {
    setInputs(prev => ({ ...prev, dishwashing: { ...prev.dishwashing!, ...patch } }));
  }

  if (unavailable) {
    return <Alert type='warning' showIcon message='Data Release 2.0 tables are not loaded in this environment.' />;
  }
  if (!tables || !outputs) return <Spin style={{ display: 'block', margin: '80px auto' }} />;

  const suOptions = tables.singleUseProducts.map(p => ({
    value: Number(p.product_id),
    label: `${p.product_id} — ${p.product}`
  }));
  const reuseOptions = tables.reusableProducts.map(p => ({
    value: Number(p.product_id),
    label: `${p.product_id} — ${p.product ?? p.cr_product}`
  }));
  const freqOptions = tables.purchaseFrequency.map(f => ({ value: f.Frequency, label: f.Frequency }));
  const stateOptions = tables.utilityRates.map(r => ({ value: r.state, label: r.state }));
  const machineOptions = Array.from(new Set(tables.dishwasherFactors.map(m => m.machine_type))).map(m => ({
    value: m,
    label: m
  }));

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 16 }}>
        <div>
          <Title level={2} style={{ marginBottom: 0 }}>
            Annual Projections (Methodology 2.0)
          </Title>
          <Paragraph type='secondary' style={{ maxWidth: 700 }}>
            The Dashboard tab of the Combined Model as a live calculator. Inputs start at the workbook&apos;s golden
            scenario; while they match it, every output is verified against her expected values below.
          </Paragraph>
        </div>
        <Button
          icon={<UndoOutlined />}
          onClick={() => setInputs(JSON.parse(JSON.stringify(GOLDEN)))}
          disabled={isGolden}
        >
          Reset to golden dataset
        </Button>
      </div>

      {goldenComparable ? (
        allPass ? (
          <Alert
            type='success'
            showIcon
            style={{ marginBottom: 16 }}
            message='Inputs match the golden dataset and every output matches the workbook — the calculation is verified. Change any input to explore.'
          />
        ) : (
          <Alert
            type='error'
            showIcon
            style={{ marginBottom: 16 }}
            message='Inputs match the golden dataset but an output differs from the workbook — the model or the data release has drifted. This should never be red.'
          />
        )
      ) : (
        <Alert
          type='info'
          showIcon
          style={{ marginBottom: 16 }}
          message={
            isGolden
              ? 'Corrected mode: the box-water quirk is fixed, so water intentionally differs from the workbook by a known amount.'
              : 'Custom inputs — outputs are live 2.0 calculations. Reset to re-verify against the golden dataset.'
          }
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={13}>
          <Card size='small' title='Single-use lines (baseline → forecast)' style={{ marginBottom: 16 }}>
            {inputs.singleUse.map((line, i) => (
              <div key={i} style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 10, marginBottom: 10 }}>
                <Select
                  showSearch
                  style={{ width: '100%', marginBottom: 6 }}
                  value={line.productId}
                  options={suOptions}
                  onChange={v => updateSuLine(i, { productId: v })}
                  filterOption={(input, opt) =>
                    String(opt?.label ?? '')
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                />
                <Row gutter={8} align='middle'>
                  <Col span={5}>
                    <Select
                      size='small'
                      style={{ width: '100%' }}
                      value={line.baselineFrequency}
                      options={freqOptions}
                      onChange={v => updateSuLine(i, { baselineFrequency: v, forecastFrequency: v })}
                    />
                  </Col>
                  <Col span={5}>
                    <InputNumber
                      size='small'
                      style={{ width: '100%' }}
                      addonBefore='base'
                      value={line.baselineCasesPerFrequency}
                      onChange={v => updateSuLine(i, { baselineCasesPerFrequency: v ?? 0 })}
                    />
                  </Col>
                  <Col span={5}>
                    <InputNumber
                      size='small'
                      style={{ width: '100%' }}
                      addonBefore='fcst'
                      value={line.forecastCasesPerFrequency}
                      onChange={v => updateSuLine(i, { forecastCasesPerFrequency: v ?? 0 })}
                    />
                  </Col>
                  <Col span={4}>
                    <InputNumber
                      size='small'
                      style={{ width: '100%' }}
                      addonBefore='u/c'
                      value={line.baselineUnitsPerCase}
                      onChange={v => updateSuLine(i, { baselineUnitsPerCase: v ?? 0, forecastUnitsPerCase: v ?? 0 })}
                    />
                  </Col>
                  <Col span={5}>
                    <InputNumber
                      size='small'
                      style={{ width: '100%' }}
                      addonBefore='$/case'
                      value={line.baselineCostPerCase}
                      onChange={v => updateSuLine(i, { baselineCostPerCase: v ?? 0, forecastCostPerCase: v ?? 0 })}
                    />
                  </Col>
                </Row>
              </div>
            ))}
            <Text type='secondary' style={{ fontSize: 11 }}>
              base/fcst = cases per frequency; u/c = units per case. Forecast frequency, units and cost follow baseline
              in this bench.
            </Text>
          </Card>

          <Card size='small' title='Reusables' style={{ marginBottom: 16 }}>
            {inputs.reusables.map((line, i) => (
              <Row gutter={8} key={i} align='middle'>
                <Col span={8}>
                  <Select
                    showSearch
                    size='small'
                    style={{ width: '100%' }}
                    value={line.productId}
                    options={reuseOptions}
                    onChange={v => updateReuseLine(i, { productId: v })}
                    filterOption={(input, opt) =>
                      String(opt?.label ?? '')
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  />
                </Col>
                <Col span={4}>
                  <InputNumber
                    size='small'
                    style={{ width: '100%' }}
                    addonBefore='cases'
                    value={line.initialCases}
                    onChange={v => updateReuseLine(i, { initialCases: v ?? 0 })}
                  />
                </Col>
                <Col span={4}>
                  <InputNumber
                    size='small'
                    style={{ width: '100%' }}
                    addonBefore='u/c'
                    value={line.unitsPerCase}
                    onChange={v => updateReuseLine(i, { unitsPerCase: v ?? 0 })}
                  />
                </Col>
                <Col span={4}>
                  <InputNumber
                    size='small'
                    style={{ width: '100%' }}
                    addonBefore='$'
                    value={line.costPerCase}
                    onChange={v => updateReuseLine(i, { costPerCase: v ?? 0 })}
                  />
                </Col>
                <Col span={4}>
                  <InputNumber
                    size='small'
                    style={{ width: '100%' }}
                    addonBefore='rep%'
                    value={Math.round(line.annualRepurchaseRate * 100)}
                    onChange={v => updateReuseLine(i, { annualRepurchaseRate: (v ?? 0) / 100 })}
                  />
                </Col>
              </Row>
            ))}
          </Card>

          <Card size='small' title='Dishwashing'>
            <Row gutter={[8, 8]}>
              <Col span={8}>
                <Select
                  showSearch
                  size='small'
                  style={{ width: '100%' }}
                  value={inputs.dishwashing!.state}
                  options={stateOptions}
                  onChange={v => updateDish({ state: v })}
                />
              </Col>
              <Col span={8}>
                <Select
                  size='small'
                  style={{ width: '100%' }}
                  value={inputs.dishwashing!.machineType}
                  options={machineOptions}
                  onChange={v => updateDish({ machineType: v })}
                />
              </Col>
              <Col span={8}>
                <Select
                  size='small'
                  style={{ width: '100%' }}
                  value={inputs.dishwashing!.temperature}
                  options={[
                    { value: 'High', label: 'High temperature' },
                    { value: 'Low', label: 'Low temperature' }
                  ]}
                  onChange={v => updateDish({ temperature: v })}
                />
              </Col>
              <Col span={8}>
                <Text style={{ fontSize: 12 }}>
                  Energy Star{' '}
                  <Switch
                    size='small'
                    checked={inputs.dishwashing!.energyStar}
                    onChange={v => updateDish({ energyStar: v })}
                  />
                </Text>
              </Col>
              <Col span={8}>
                <InputNumber
                  size='small'
                  style={{ width: '100%' }}
                  addonBefore='days/yr'
                  value={inputs.dishwashing!.operatingDaysPerYear}
                  onChange={v => updateDish({ operatingDaysPerYear: v ?? 0 })}
                />
              </Col>
              <Col span={8}>
                <InputNumber
                  size='small'
                  style={{ width: '100%' }}
                  addonBefore='racks/day'
                  value={inputs.dishwashing!.racksPerDay}
                  onChange={v => updateDish({ racksPerDay: v ?? 0 })}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} xl={11}>
          <Card
            size='small'
            title='Outputs vs golden dataset'
            extra={
              <Text style={{ fontSize: 12 }}>
                Workbook-faithful <Switch size='small' checked={workbookFaithful} onChange={setWorkbookFaithful} />
              </Text>
            }
          >
            <Table
              size='small'
              rowKey='key'
              pagination={false}
              dataSource={EXPECTED}
              columns={[
                { title: 'Metric', dataIndex: 'label', ellipsis: true },
                {
                  title: 'Computed',
                  align: 'right' as const,
                  render: (_: unknown, row) =>
                    computedByKey[row.key]?.toLocaleString(undefined, { maximumFractionDigits: row.digits })
                },
                {
                  title: 'Golden',
                  align: 'right' as const,
                  render: (_: unknown, row) => (
                    <Text type='secondary'>
                      {row.value.toLocaleString(undefined, { maximumFractionDigits: row.digits })}
                    </Text>
                  )
                },
                {
                  title: '',
                  width: 70,
                  align: 'center' as const,
                  render: (_: unknown, row) => {
                    if (!goldenComparable) return <Tag>custom</Tag>;
                    const pass =
                      Math.abs(computedByKey[row.key] - row.value) / Math.max(1, Math.abs(row.value)) < REL_TOLERANCE;
                    return pass ? (
                      <Tag color='green' icon={<CheckCircleFilled />}>
                        PASS
                      </Tag>
                    ) : (
                      <Tag color='red' icon={<CloseCircleFilled />}>
                        FAIL
                      </Tag>
                    );
                  }
                }
              ]}
            />
            <Paragraph type='secondary' style={{ fontSize: 11, marginTop: 8, marginBottom: 0 }}>
              Golden values are the workbook&apos;s Dashboard tab, computed workbook-faithful (including the known
              box-water lookup quirk, review feedback #1). The same values are enforced in CI. Payback and ROI are
              derived from the rows above.
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </>
  );
}

AnnualProjections2Bench.getLayout = (page: React.ReactNode, pageProps: PageProps) => (
  <AdminLayout {...(pageProps as any)} selectedMenuItem='data-science/data-products' title='Annual Projections 2.0'>
    {page}
  </AdminLayout>
);
