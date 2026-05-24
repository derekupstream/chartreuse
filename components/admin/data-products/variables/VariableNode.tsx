import { memo } from 'react';
import { Handle, Position } from 'reactflow';

import { VARIABLE_COLORS, VARIABLE_KIND_LABEL } from 'lib/dataProducts/variables';
import type { Variable } from 'lib/dataProducts/variables';

export type VariableNodeData = {
  variable: Variable;
  valuePreview?: string;
  selected?: boolean;
};

function VariableNodeComponent({ data }: { data: VariableNodeData }) {
  const { variable, valuePreview } = data;
  const colors = VARIABLE_COLORS[variable.kind];

  return (
    <div
      style={{
        width: 200,
        background: colors.bg,
        border: `2px solid ${colors.border}`,
        borderRadius: 8,
        overflow: 'hidden',
        fontSize: 12,
        boxShadow: data.selected ? `0 0 0 3px ${colors.border}40` : 'none'
      }}
    >
      <Handle type='target' position={Position.Left} style={{ background: colors.border }} />
      <div
        style={{
          background: colors.border,
          color: '#fff',
          padding: '3px 10px',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: 0.3,
          textTransform: 'uppercase'
        }}
      >
        {VARIABLE_KIND_LABEL[variable.kind]}
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 13,
            color: '#262626',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
          title={variable.name}
        >
          {variable.name}
        </div>
        {valuePreview && (
          <div
            style={{
              marginTop: 4,
              fontSize: 11,
              color: '#595959',
              fontFamily: 'monospace',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
            title={valuePreview}
          >
            = {valuePreview}
          </div>
        )}
        {variable.description && (
          <div
            style={{
              marginTop: 4,
              fontSize: 10,
              color: '#8c8c8c',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {variable.description}
          </div>
        )}
      </div>
      <Handle type='source' position={Position.Right} style={{ background: colors.border }} />
    </div>
  );
}

export const VariableNode = memo(VariableNodeComponent);
