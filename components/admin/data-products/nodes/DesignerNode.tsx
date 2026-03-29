import {
  BarChartOutlined,
  DatabaseOutlined,
  ExperimentOutlined,
  FunctionOutlined,
  MergeCellsOutlined,
  SwapOutlined
} from '@ant-design/icons';
import { memo } from 'react';
import { Handle, Position } from 'reactflow';

import type { DesignerNodeType } from './nodeTypes';
import { NODE_TYPE_DEFS } from './nodeTypes';

const ICONS: Record<string, React.ReactNode> = {
  DatabaseOutlined: <DatabaseOutlined />,
  ExperimentOutlined: <ExperimentOutlined />,
  FunctionOutlined: <FunctionOutlined />,
  MergeCellsOutlined: <MergeCellsOutlined />,
  SwapOutlined: <SwapOutlined />,
  BarChartOutlined: <BarChartOutlined />
};

export type DesignerNodeData = {
  nodeType: DesignerNodeType;
  label: string;
  subtitle?: string;
  subtype?: string;
  factorId?: string;
  factorName?: string;
  calculationName?: string;
  calculationFile?: string;
  metricKey?: string;
  metricUnit?: string;
  config?: Record<string, unknown>;
  dimmed?: boolean;
  selected?: boolean;
};

const handleStyle = (color: string, dimmed: boolean): React.CSSProperties => ({
  width: 10,
  height: 10,
  background: dimmed ? '#d9d9d9' : color,
  border: '2px solid #fff',
  borderRadius: '50%'
});

function DesignerNodeComponent({ data }: { data: DesignerNodeData }) {
  const typeDef = NODE_TYPE_DEFS[data.nodeType];
  if (!typeDef) return null;

  const icon = ICONS[typeDef.icon];

  return (
    <div
      style={{
        width: 200,
        background: data.dimmed ? '#fafafa' : typeDef.color,
        border: `2px solid ${data.dimmed ? '#d9d9d9' : typeDef.borderColor}`,
        borderRadius: 8,
        opacity: data.dimmed ? 0.4 : 1,
        transition: 'opacity 0.2s, border-color 0.2s',
        overflow: 'hidden',
        fontSize: 12
      }}
    >
      {/* Input handle (left) — hidden on Input nodes since they are flow sources */}
      {data.nodeType !== 'input' && (
        <Handle type='target' position={Position.Left} style={handleStyle(typeDef.borderColor, !!data.dimmed)} />
      )}

      {/* Header */}
      <div
        style={{
          background: data.dimmed ? '#f0f0f0' : typeDef.borderColor,
          color: '#fff',
          padding: '4px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          fontWeight: 600
        }}
      >
        {icon}
        {typeDef.label}
      </div>

      {/* Body */}
      <div style={{ padding: '8px 10px' }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 12,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: '#262626'
          }}
        >
          {data.label}
        </div>
        {data.subtitle && (
          <div
            style={{
              fontSize: 10,
              color: '#8c8c8c',
              marginTop: 2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {data.subtitle}
          </div>
        )}
      </div>

      {/* Output handle (right) — hidden on Output nodes since they are flow sinks */}
      {data.nodeType !== 'output' && (
        <Handle type='source' position={Position.Right} style={handleStyle(typeDef.borderColor, !!data.dimmed)} />
      )}
    </div>
  );
}

export const DesignerNode = memo(DesignerNodeComponent);
