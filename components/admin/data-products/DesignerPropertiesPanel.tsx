import { EditOutlined } from '@ant-design/icons';
import { Button, Form, Input, Select, Spin, Typography } from 'antd';
import { useEffect, useState } from 'react';
import type { Node } from 'reactflow';

import type { RegisteredFunction } from 'lib/admin/calculatorRegistry';

import type { DesignerNodeData } from './nodes/DesignerNode';
import { NODE_TYPE_DEFS } from './nodes/nodeTypes';

const { Text } = Typography;

type Factor = {
  id: string;
  name: string;
  currentValue: number;
  unit: string;
  category?: { name: string };
};

type Props = {
  selectedNode: Node<DesignerNodeData> | null;
  factors: Factor[];
  calculations: RegisteredFunction[];
  onNodeUpdate: (nodeId: string, data: Partial<DesignerNodeData>) => void;
};

export function DesignerPropertiesPanel({ selectedNode, factors, calculations, onNodeUpdate }: Props) {
  const [source, setSource] = useState<string | null>(null);
  const [sourceLoading, setSourceLoading] = useState(false);

  // Fetch the calculation source whenever a calculation node is selected with a
  // chosen function. Lets the data scientist see the actual formula in-place
  // instead of having to leave the canvas.
  const calcName = selectedNode?.data.nodeType === 'calculation' ? selectedNode.data.calculationName : undefined;
  const calcFile = selectedNode?.data.nodeType === 'calculation' ? selectedNode.data.calculationFile : undefined;

  useEffect(() => {
    if (!calcName || !calcFile) {
      setSource(null);
      return;
    }
    let cancelled = false;
    setSourceLoading(true);
    fetch(
      `/api/admin/calculations/source?filePath=${encodeURIComponent(calcFile)}&name=${encodeURIComponent(calcName)}`
    )
      .then(r => (r.ok ? r.json() : { source: null }))
      .then(data => {
        if (!cancelled) setSource(data.source ?? null);
      })
      .catch(() => {
        if (!cancelled) setSource(null);
      })
      .finally(() => {
        if (!cancelled) setSourceLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [calcName, calcFile]);

  if (!selectedNode) {
    return (
      <div
        style={{
          width: 300,
          borderLeft: '1px solid #f0f0f0',
          background: '#fafafa',
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Text type='secondary' style={{ fontSize: 12 }}>
          Select a node to view properties
        </Text>
      </div>
    );
  }

  const data = selectedNode.data;
  const typeDef = NODE_TYPE_DEFS[data.nodeType];

  return (
    <div
      style={{
        width: 300,
        borderLeft: '1px solid #f0f0f0',
        background: '#fafafa',
        overflowY: 'auto',
        height: '100%'
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
          background: typeDef.borderColor,
          color: '#fff'
        }}
      >
        <Text strong style={{ fontSize: 13, color: '#fff' }}>
          {typeDef.label} Properties
        </Text>
      </div>

      <div style={{ padding: 16 }}>
        <Form layout='vertical' size='small'>
          {/* Common fields */}
          <Form.Item label='Label'>
            <Input
              value={data.label}
              onChange={e => onNodeUpdate(selectedNode.id, { label: e.target.value })}
              placeholder='Node label'
            />
          </Form.Item>

          {/* Subtype selector */}
          {typeDef.subtypes.length > 0 && (
            <Form.Item label='Type'>
              <Select
                value={data.subtype}
                onChange={v => {
                  const st = typeDef.subtypes.find(s => s.value === v);
                  onNodeUpdate(selectedNode.id, {
                    subtype: v,
                    subtitle: st?.label
                  });
                }}
                options={typeDef.subtypes.map(st => ({ value: st.value, label: st.label }))}
                placeholder='Select type'
                allowClear
              />
            </Form.Item>
          )}

          {/* Factor-specific: factor picker */}
          {data.nodeType === 'factor' && (
            <>
              <Form.Item label='Factor'>
                <Select
                  showSearch
                  value={data.factorId}
                  onChange={v => {
                    const f = factors.find(f => f.id === v);
                    onNodeUpdate(selectedNode.id, {
                      factorId: v,
                      factorName: f?.name,
                      subtitle: f ? `${f.name} (${f.currentValue} ${f.unit})` : undefined
                    });
                  }}
                  options={factors.map(f => ({
                    value: f.id,
                    label: `${f.name} — ${f.currentValue} ${f.unit}${f.category ? ` (${f.category.name})` : ''}`
                  }))}
                  placeholder='Search factors...'
                  filterOption={(input, option) =>
                    (option?.label as string)?.toLowerCase().includes(input.toLowerCase()) ?? false
                  }
                  allowClear
                />
              </Form.Item>
              {data.factorId ? (
                <Button
                  type='primary'
                  icon={<EditOutlined />}
                  size='small'
                  block
                  style={{ marginBottom: 16 }}
                  onClick={() => window.open(`/admin/data-science/constants/${data.factorId}/edit`, '_blank')}
                >
                  Edit Factor
                </Button>
              ) : (
                <Button
                  type='primary'
                  icon={<EditOutlined />}
                  size='small'
                  block
                  style={{ marginBottom: 16 }}
                  onClick={() => {
                    // Extract a useful search term from the factorName pattern
                    // e.g. "MATERIALS[*].waterUsageGalPerLb" → "waterUsageGalPerLb"
                    // e.g. "TRANSPORTATION_CO2_EMISSIONS_FACTOR" → "TRANSPORTATION_CO2_EMISSIONS_FACTOR"
                    const raw = data.factorName || data.label || '';
                    const dotIdx = raw.lastIndexOf('.');
                    const search = dotIdx >= 0 ? raw.substring(dotIdx + 1) : raw;
                    window.open(
                      `/admin/data-science/constants${search ? `?factor=${encodeURIComponent(search)}` : ''}`,
                      '_blank'
                    );
                  }}
                >
                  View / Edit Factor
                </Button>
              )}
            </>
          )}

          {/* Calculation-specific: calculation picker */}
          {data.nodeType === 'calculation' && (
            <>
              <Form.Item label='Calculation'>
                <Select
                  showSearch
                  value={data.calculationName}
                  onChange={v => {
                    const c = calculations.find(c => c.name === v);
                    onNodeUpdate(selectedNode.id, {
                      calculationName: v,
                      calculationFile: c?.filePath,
                      subtitle: c ? `${c.name}() → ${c.outputMetrics.length} metrics` : undefined
                    });
                  }}
                  options={calculations.map(c => ({
                    value: c.name,
                    label: `${c.name}() — ${c.outputMetrics.slice(0, 2).join(', ')}${c.outputMetrics.length > 2 ? '...' : ''}`
                  }))}
                  placeholder='Search calculations...'
                  filterOption={(input, option) =>
                    (option?.label as string)?.toLowerCase().includes(input.toLowerCase()) ?? false
                  }
                  allowClear
                />
              </Form.Item>
              {data.calculationFile && (
                <div style={{ marginBottom: 8 }}>
                  <Text type='secondary' style={{ fontSize: 10, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {data.calculationFile}
                  </Text>
                </div>
              )}

              {/* Inline source viewer — shows the actual function body so the data
                  scientist can see the formula without leaving the canvas. */}
              {data.calculationName && (
                <div style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 4
                    }}
                  >
                    <Text strong style={{ fontSize: 11 }}>
                      Formula
                    </Text>
                    {sourceLoading && <Spin size='small' />}
                  </div>
                  {source ? (
                    <pre
                      style={{
                        background: '#1e1e2e',
                        color: '#cdd6f4',
                        padding: 10,
                        borderRadius: 4,
                        fontSize: 11,
                        lineHeight: 1.5,
                        margin: 0,
                        maxHeight: 360,
                        overflow: 'auto',
                        whiteSpace: 'pre',
                        fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace"
                      }}
                    >
                      {source}
                    </pre>
                  ) : (
                    !sourceLoading && (
                      <Text type='secondary' style={{ fontSize: 11 }}>
                        Source unavailable.
                      </Text>
                    )
                  )}
                </div>
              )}

              <Button
                icon={<EditOutlined />}
                size='small'
                block
                style={{ marginBottom: 16 }}
                onClick={() =>
                  window.open(
                    `/admin/data-science/calculations${data.calculationName ? `?fn=${encodeURIComponent(data.calculationName)}` : ''}`,
                    '_blank'
                  )
                }
              >
                {data.calculationName ? `Open ${data.calculationName}() to edit` : 'Browse Calculations'}
              </Button>
            </>
          )}

          {/* Output-specific: metric key + unit */}
          {data.nodeType === 'output' && (
            <>
              <Form.Item label='Metric Key'>
                <Input
                  value={data.metricKey}
                  onChange={e => onNodeUpdate(selectedNode.id, { metricKey: e.target.value })}
                  placeholder='e.g. annualGHGChange'
                />
              </Form.Item>
              <Form.Item label='Unit'>
                <Input
                  value={data.metricUnit}
                  onChange={e =>
                    onNodeUpdate(selectedNode.id, {
                      metricUnit: e.target.value,
                      subtitle: `${data.metricKey ?? 'metric'} (${e.target.value})`
                    })
                  }
                  placeholder='e.g. MTCO2e'
                />
              </Form.Item>
            </>
          )}

          {/* Node ID (read-only) */}
          <Form.Item label='Node ID'>
            <Input value={selectedNode.id} disabled style={{ fontSize: 10, fontFamily: 'monospace' }} />
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
