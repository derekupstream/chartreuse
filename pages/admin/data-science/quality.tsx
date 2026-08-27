/**
 * Validation — the workbook's Validation tab as a running tool, not a table of stored
 * labels. On load it (1) recomputes all 15 Dashboard metrics from the golden scenario and
 * compares them to Madhavi's expected values, and (2) executes her nine Validation-tab
 * checks against the live Data Release tables, showing the numbers behind every verdict.
 * The same checks are pinned in CI (validationChecks.spec.ts / combinedModel.golden.spec.ts).
 */
import { CheckCircleFilled, CloseCircleFilled, ReloadOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Spin, Table, Tag, Typography } from 'antd';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import type { DashboardUser } from 'interfaces';
import { AdminLayout } from 'layouts/AdminLayout';
import type { ModelTables } from 'lib/calculator/v2/combinedModel';
import type { CheckResult, GoldenMetricResult } from 'lib/calculator/v2/validationChecks';
import { runGoldenVerification, runValidationChecks } from 'lib/calculator/v2/validationChecks';
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

const PassTag = ({ pass }: { pass: boolean }) =>
  pass ? (
    <Tag color='green' icon={<CheckCircleFilled />}>
      PASS
    </Tag>
  ) : (
    <Tag color='red' icon={<CloseCircleFilled />}>
      FAIL
    </Tag>
  );

export default function ValidationPage(_: { user: DashboardUser }) {
  const [tables, setTables] = useState<ModelTables | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [ranAt, setRanAt] = useState<Date | null>(null);
  const [checks, setChecks] = useState<CheckResult[] | null>(null);
  const [golden, setGolden] = useState<GoldenMetricResult[] | null>(null);

  const run = useCallback((t: ModelTables) => {
    setChecks(runValidationChecks(t));
    setGolden(runGoldenVerification(t));
    setRanAt(new Date());
  }, []);

  const load = useCallback(() => {
    setChecks(null);
    setGolden(null);
    fetch('/api/admin/v2-model-tables')
      .then(r => r.json())
      .then((body: V2ModelTablesResponse) => {
        if (body.available && body.tables) {
          setTables(body.tables);
          run(body.tables);
        } else setUnavailable(true);
      })
      .catch(() => setUnavailable(true));
  }, [run]);

  useEffect(() => {
    load();
  }, [load]);

  if (unavailable) {
    return <Alert type='warning' showIcon message='Data Release 2.0 tables are not loaded in this environment.' />;
  }
  if (!tables || !checks || !golden) return <Spin style={{ display: 'block', margin: '80px auto' }} />;

  const failing = checks.filter(c => !c.pass).length + golden.filter(m => !m.pass).length;
  const total = checks.length + golden.length;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 16 }}>
        <div>
          <Title level={2} style={{ marginBottom: 0 }}>
            <SafetyCertificateOutlined /> Validation
          </Title>
          <Paragraph type='secondary' style={{ maxWidth: 740 }}>
            The workbook&apos;s Validation tab, executed. Every check below ran just now against the live Data Release
            tables and the 2.0 engine — the verdicts are computed, never stored. The same checks run in CI on every
            change.
          </Paragraph>
        </div>
        <Button icon={<ReloadOutlined />} onClick={load}>
          Re-run all checks
        </Button>
      </div>

      <Alert
        type={failing === 0 ? 'success' : 'error'}
        showIcon
        style={{ marginBottom: 16 }}
        message={
          failing === 0
            ? `All ${total} checks pass — ${golden.length} golden metrics reproduced, ${checks.length} data checks held. Ran ${ranAt?.toLocaleTimeString()}.`
            : `${failing} of ${total} checks FAILED — the data release or the engine has drifted. Do not ship until this is green.`
        }
      />

      <Card size='small' title='Data & reconciliation checks (Validation tab, executed)' style={{ marginBottom: 16 }}>
        <Table
          size='small'
          rowKey='check'
          pagination={false}
          dataSource={checks}
          columns={[
            { title: 'Check', dataIndex: 'check', width: 320 },
            { title: 'Purpose', dataIndex: 'purpose', width: 130, render: (v: string) => <Tag>{v}</Tag> },
            {
              title: 'Evidence (computed just now)',
              dataIndex: 'evidence',
              render: (v: string) => (
                <Text type='secondary' style={{ fontSize: 12, fontFamily: 'monospace' }}>
                  {v}
                </Text>
              )
            },
            {
              title: '',
              width: 80,
              align: 'center' as const,
              render: (_: unknown, row: CheckResult) => <PassTag pass={row.pass} />
            }
          ]}
        />
      </Card>

      <Card size='small' title='Golden verification — the 15 Dashboard metrics, recomputed vs the workbook'>
        <Table
          size='small'
          rowKey='key'
          pagination={false}
          dataSource={golden}
          columns={[
            { title: 'Metric', dataIndex: 'label', ellipsis: true },
            {
              title: 'Computed now',
              align: 'right' as const,
              render: (_: unknown, row: GoldenMetricResult) =>
                row.computed.toLocaleString(undefined, { maximumFractionDigits: row.digits })
            },
            {
              title: 'Workbook expected',
              align: 'right' as const,
              render: (_: unknown, row: GoldenMetricResult) => (
                <Text type='secondary'>
                  {row.expected.toLocaleString(undefined, { maximumFractionDigits: row.digits })}
                </Text>
              )
            },
            {
              title: '',
              width: 80,
              align: 'center' as const,
              render: (_: unknown, row: GoldenMetricResult) => <PassTag pass={row.pass} />
            }
          ]}
        />
        <Paragraph type='secondary' style={{ fontSize: 12, marginTop: 8, marginBottom: 0 }}>
          Computed workbook-faithful (including the known box-water lookup quirk) so the comparison to her Dashboard is
          exact. Explore the calculation interactively on{' '}
          <Link href='/admin/data-science/data-products/annual-projections-2'>Annual Projections</Link>; deeper
          governance lives in <Link href='/admin/data-science/test-runs'>Test Runs &amp; Golden Datasets</Link> and the{' '}
          <Link href='/admin/data-science/runs'>Calculation Log</Link>.
        </Paragraph>
      </Card>
    </>
  );
}

ValidationPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => (
  <AdminLayout {...(pageProps as any)} selectedMenuItem='data-science/quality' title='Validation'>
    {page}
  </AdminLayout>
);
