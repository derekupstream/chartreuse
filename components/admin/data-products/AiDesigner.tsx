import {
  EditOutlined,
  PlusOutlined,
  RobotOutlined,
  SendOutlined,
  ThunderboltOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { Alert, Badge, Button, Card, Collapse, Input, Radio, Segmented, Space, Spin, Tag, Typography } from 'antd';
import { useCallback, useState } from 'react';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

type DesignType = 'model' | 'calculator' | 'dashboard' | 'workflow';
type DesignMode = 'new' | 'modify';

const TYPE_OPTIONS: Array<{ value: DesignType; label: string; description: string }> = [
  {
    value: 'model',
    label: 'Model',
    description: 'A pure math + I/O definition. Inputs → outputs, deterministic, reusable. No UI.'
  },
  {
    value: 'calculator',
    label: 'Calculator',
    description: 'An interactive surface that exercises a Model. Form-style, one instance, one set of outputs.'
  },
  {
    value: 'dashboard',
    label: 'Dashboard',
    description: 'A presentation of one or more computed results, often saved or shared. May aggregate.'
  },
  {
    value: 'workflow',
    label: 'Workflow',
    description: 'A user journey across Models / Calculators / Dashboards. End-to-end UX.'
  }
];

type Gap = {
  type: 'missing_factor' | 'missing_calculation' | 'missing_data';
  description: string;
  suggestion: string;
};

type AiResult = {
  nodes: unknown[];
  edges: unknown[];
  inputSchema?: { fields?: unknown[] } | null;
  outputSchema?: { metrics?: unknown[] } | null;
  executionCode?: string | null;
  methodologyDocumentId?: string | null;
  methodologyTitle?: string | null;
  gaps: Gap[];
  reasoning: string;
  name?: string;
  description?: string;
};

type Props = {
  productId: string;
  productName: string;
  /** Gaps loaded from the product's persisted flowDefinitionJson, shown until a fresh generation runs */
  persistedGaps?: Gap[];
  /** Reasoning from the last AI generation, persisted on the flow */
  persistedReasoning?: string;
  onFlowGenerated: (result: AiResult) => void;
};

const STARTER_PROMPTS = [
  {
    title: 'School Reuse Calculator',
    prompt:
      'Build a calculator for K-12 schools transitioning from single-use to reusable trays and utensils. We have data on: number of students, meals served per day, current single-use tray costs, proposed reusable tray program costs, dishwasher configuration. We want outputs for: annual waste reduction, GHG savings, cost comparison, and payback period.'
  },
  {
    title: 'RSP Impact Dashboard',
    prompt:
      "Build a dashboard for Reuse Service Providers (RSPs) to show their clients' aggregate impact. Inputs: multiple client accounts with usage data from the RSP API. We want to aggregate across all clients and show: total containers in circulation, total single-use items displaced, cumulative CO2 avoided, cumulative waste diverted, and a per-client breakdown."
  },
  {
    title: 'Funder Impact Report',
    prompt:
      'Build a report output for grant funders who supported reuse programs. Inputs: selected projects over a time period. Outputs: total environmental impact (GHG, water, waste), cost savings achieved, number of organizations impacted, projected 5-year impact if programs continue scaling.'
  }
];

export function AiDesigner({ productId, productName, persistedGaps, persistedReasoning, onFlowGenerated }: Props) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [designType, setDesignType] = useState<DesignType>('calculator');
  const [designMode, setDesignMode] = useState<DesignMode>('new');

  const handleGenerate = useCallback(
    async (text?: string) => {
      const finalPrompt = text ?? prompt;
      if (!finalPrompt.trim()) return;

      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const res = await fetch(`/api/admin/data-products/${productId}/ai-generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: finalPrompt, designType, designMode })
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Generation failed');
        }

        const data: AiResult = await res.json();
        setResult(data);
        onFlowGenerated(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    },
    [productId, prompt, designType, designMode, onFlowGenerated]
  );

  const gapTypeColors: Record<string, string> = {
    missing_factor: 'orange',
    missing_calculation: 'red',
    missing_data: 'blue'
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Space align='center' size={8}>
          <RobotOutlined style={{ fontSize: 28, color: '#722ed1' }} />
          <Title level={3} style={{ margin: 0 }}>
            AI Designer
          </Title>
          <Tag color='purple' style={{ fontWeight: 600, fontSize: 10 }}>
            BETA
          </Tag>
        </Space>
        <Paragraph type='secondary' style={{ marginTop: 8 }}>
          Describe the data product you want to build. The AI will generate a node-based flow using your existing
          factors and calculations, and identify any gaps in your data.
        </Paragraph>
      </div>

      {/* Vocabulary panel */}
      <Collapse
        size='small'
        style={{ marginBottom: 16 }}
        items={[
          {
            key: 'vocabulary',
            label: (
              <Text style={{ fontSize: 12 }}>
                <strong>Glossary:</strong> Model · Calculator · Dashboard · Workflow
              </Text>
            ),
            children: (
              <Space direction='vertical' size={8} style={{ width: '100%' }}>
                {TYPE_OPTIONS.map(t => (
                  <div key={t.value}>
                    <Text strong style={{ fontSize: 12 }}>
                      {t.label}
                    </Text>
                    <Text type='secondary' style={{ fontSize: 12, marginLeft: 8 }}>
                      {t.description}
                    </Text>
                  </div>
                ))}
                <Text type='secondary' style={{ fontSize: 11 }}>
                  These distinctions also shape what the AI generates — picking <strong>Workflow</strong> tells it you
                  want a user journey, not a math model.
                </Text>
              </Space>
            )
          }
        ]}
      />

      {/* Prompt Input */}
      <Card
        style={{
          marginBottom: 24,
          border: '2px solid #722ed1',
          borderRadius: 12
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <Text strong style={{ fontSize: 13 }}>
            What are you building?
          </Text>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Segmented
            block
            value={designType}
            onChange={v => setDesignType(v as DesignType)}
            options={TYPE_OPTIONS.map(t => ({ label: t.label, value: t.value }))}
          />
          <Text type='secondary' style={{ fontSize: 11, display: 'block', marginTop: 6 }}>
            {TYPE_OPTIONS.find(t => t.value === designType)?.description}
          </Text>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Radio.Group
            value={designMode}
            onChange={e => setDesignMode(e.target.value)}
            optionType='button'
            buttonStyle='solid'
            options={[
              {
                label: (
                  <>
                    <PlusOutlined /> Create new
                  </>
                ),
                value: 'new'
              },
              {
                label: (
                  <>
                    <EditOutlined /> Modify existing
                  </>
                ),
                value: 'modify'
              }
            ]}
          />
          <Text type='secondary' style={{ fontSize: 11, display: 'block', marginTop: 6 }}>
            {designMode === 'new'
              ? 'Generate a fresh design — replaces the current flow, schemas, and execution logic.'
              : "Make targeted edits to the existing design — preserves everything you don't explicitly ask to change."}
          </Text>
        </div>

        <div style={{ marginBottom: 12 }}>
          <Text strong style={{ fontSize: 13 }}>
            {designMode === 'new' ? 'Describe what you want to build' : 'What would you like to change?'}
          </Text>
          <br />
          <Text type='secondary' style={{ fontSize: 12 }}>
            {designMode === 'new'
              ? 'What data do you have? What questions do you want to answer? What outputs do you need?'
              : 'Be specific about what to change. E.g., "Rename Number of Students to Total Students enrolled" or "Add a new output for water savings per student."'}
          </Text>
        </div>

        <TextArea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder={`Example: "Build a calculator for universities comparing the cost and environmental impact of switching their dining halls from disposable to reusable foodware. We have data on meal counts, current disposable costs, and proposed reusable program costs. We want GHG savings, waste reduction, water impact, cost comparison, ROI, and payback period as outputs."`}
          rows={5}
          style={{ marginBottom: 12, fontSize: 13 }}
          disabled={loading}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text type='secondary' style={{ fontSize: 11 }}>
            {productName ? `Generating for: ${productName}` : ''}
          </Text>
          <Button
            type='primary'
            icon={loading ? undefined : <ThunderboltOutlined />}
            onClick={() => handleGenerate()}
            loading={loading}
            disabled={!prompt.trim()}
            style={{ background: '#722ed1', borderColor: '#722ed1' }}
          >
            {loading
              ? designMode === 'modify'
                ? 'Applying changes…'
                : 'Generating…'
              : designMode === 'modify'
                ? `Apply changes to this ${designType}`
                : `Generate ${designType}`}
          </Button>
        </div>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card style={{ textAlign: 'center', padding: 40, marginBottom: 24 }}>
          <Spin size='large' />
          <Paragraph type='secondary' style={{ marginTop: 16 }}>
            Analyzing your requirements, mapping to available factors and calculations, building the node graph, and
            identifying data gaps...
          </Paragraph>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Alert
          message='Generation Failed'
          description={error}
          type='error'
          showIcon
          closable
          style={{ marginBottom: 24 }}
          onClose={() => setError(null)}
        />
      )}

      {/* Results */}
      {result && !loading && (
        <>
          {/* Success summary */}
          <Alert
            message='Data Product Generated'
            description={
              <span>
                Created <strong>{result.nodes.length} nodes</strong> and{' '}
                <strong>{result.edges.length} connections</strong>
                {result.inputSchema?.fields?.length ? (
                  <>
                    , <strong>{result.inputSchema.fields.length} input fields</strong>
                  </>
                ) : null}
                {result.outputSchema?.metrics?.length ? (
                  <>
                    , <strong>{result.outputSchema.metrics.length} output metrics</strong>
                  </>
                ) : null}
                {result.executionCode ? <>, and live execution logic</> : null}.
                {result.methodologyTitle && (
                  <>
                    {' '}
                    Linked methodology: <strong>{result.methodologyTitle}</strong>.
                  </>
                )}
                {result.name && (
                  <>
                    {' '}
                    Product name updated to <strong>{result.name}</strong>.
                  </>
                )}{' '}
                Switch to <strong>Designer</strong> to edit the flow, or <strong>Tests</strong> to try the live
                calculator.
              </span>
            }
            type='success'
            showIcon
            style={{ marginBottom: 16 }}
          />

          {/* Reasoning */}
          {result.reasoning && (
            <Card
              size='small'
              title={
                <Space>
                  <RobotOutlined />
                  <span>Design Reasoning</span>
                </Space>
              }
              style={{ marginBottom: 16 }}
            >
              <Text style={{ fontSize: 13, lineHeight: 1.7 }}>{result.reasoning}</Text>
            </Card>
          )}

          {/* Data Gaps */}
          {result.gaps.length > 0 && (
            <Card
              size='small'
              title={
                <Space>
                  <WarningOutlined style={{ color: '#fa8c16' }} />
                  <span>
                    Data Gaps Identified <Badge count={result.gaps.length} style={{ backgroundColor: '#fa8c16' }} />
                  </span>
                </Space>
              }
              style={{ marginBottom: 16, borderColor: '#ffd591' }}
            >
              <Paragraph type='secondary' style={{ fontSize: 12, marginBottom: 12 }}>
                These factors, calculations, or data sources are needed for this product but don&apos;t exist in your
                system yet. Address these gaps to make the product fully functional.
              </Paragraph>
              {result.gaps.map((gap, i) => (
                <div
                  key={i}
                  style={{
                    padding: '10px 12px',
                    background: '#fffbe6',
                    borderRadius: 6,
                    marginBottom: 8,
                    border: '1px solid #fff1b8'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Tag color={gapTypeColors[gap.type] ?? 'default'} style={{ margin: 0, fontSize: 10 }}>
                      {gap.type.replace(/_/g, ' ')}
                    </Tag>
                    <Text strong style={{ fontSize: 12 }}>
                      {gap.description}
                    </Text>
                  </div>
                  <Text type='secondary' style={{ fontSize: 11 }}>
                    <SendOutlined style={{ marginRight: 4 }} />
                    {gap.suggestion}
                  </Text>
                </div>
              ))}
            </Card>
          )}
        </>
      )}

      {/* Persisted gaps + reasoning (shown when there's no fresh result, e.g. after a page reload) */}
      {!result && !loading && (persistedGaps?.length || persistedReasoning) && (
        <div style={{ marginBottom: 24 }}>
          <Alert
            type='info'
            showIcon
            style={{ marginBottom: 12 }}
            message='Previous AI Generation'
            description='This product was generated by the AI Designer. The design reasoning and data gaps from that run are shown below. Run a new prompt above to regenerate.'
          />
          {persistedReasoning && (
            <Card
              size='small'
              title={
                <Space>
                  <RobotOutlined />
                  <span>Design Reasoning</span>
                </Space>
              }
              style={{ marginBottom: 16 }}
            >
              <Text style={{ fontSize: 13, lineHeight: 1.7 }}>{persistedReasoning}</Text>
            </Card>
          )}
          {persistedGaps && persistedGaps.length > 0 && (
            <Card
              size='small'
              title={
                <Space>
                  <WarningOutlined style={{ color: '#fa8c16' }} />
                  <span>
                    Data Gaps Identified <Badge count={persistedGaps.length} style={{ backgroundColor: '#fa8c16' }} />
                  </span>
                </Space>
              }
              style={{ marginBottom: 16, borderColor: '#ffd591' }}
            >
              <Paragraph type='secondary' style={{ fontSize: 12, marginBottom: 12 }}>
                These factors, calculations, or data sources are needed for this product but don&apos;t exist in your
                system yet. Nodes that depend on them are marked with a red dot in the Designer tab.
              </Paragraph>
              {persistedGaps.map((gap, i) => (
                <div
                  key={i}
                  style={{
                    padding: '10px 12px',
                    background: '#fffbe6',
                    borderRadius: 6,
                    marginBottom: 8,
                    border: '1px solid #fff1b8'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Tag color={gapTypeColors[gap.type] ?? 'default'} style={{ margin: 0, fontSize: 10 }}>
                      {gap.type.replace(/_/g, ' ')}
                    </Tag>
                    <Text strong style={{ fontSize: 12 }}>
                      {gap.description}
                    </Text>
                  </div>
                  <Text type='secondary' style={{ fontSize: 11 }}>
                    <SendOutlined style={{ marginRight: 4 }} />
                    {gap.suggestion}
                  </Text>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}

      {/* Starter Prompts */}
      {!result && !loading && (
        <div>
          <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>
            Or try a starter prompt:
          </Text>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {STARTER_PROMPTS.map((sp, i) => (
              <Card
                key={i}
                size='small'
                hoverable
                onClick={() => {
                  setPrompt(sp.prompt);
                  handleGenerate(sp.prompt);
                }}
                style={{ cursor: 'pointer', borderColor: '#d9d9d9' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ThunderboltOutlined style={{ color: '#722ed1', fontSize: 16 }} />
                  <div>
                    <Text strong style={{ fontSize: 13 }}>
                      {sp.title}
                    </Text>
                    <br />
                    <Text type='secondary' style={{ fontSize: 11 }}>
                      {sp.prompt.slice(0, 120)}...
                    </Text>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
