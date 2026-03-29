import { Form, Input, Select, Typography } from 'antd';
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
          )}

          {/* Calculation-specific: calculation picker */}
          {data.nodeType === 'calculation' && (
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
