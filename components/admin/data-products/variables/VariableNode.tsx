import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Popconfirm } from 'antd';
import { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';

import { VARIABLE_COLORS, VARIABLE_KIND_LABEL } from 'lib/dataProducts/variables';
import type { Variable } from 'lib/dataProducts/variables';

export type VariableNodeData = {
  variable: Variable;
  valuePreview?: string;
  selected?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
};

function VariableNodeComponent({ data }: { data: VariableNodeData }) {
  const { variable, valuePreview, onEdit, onDelete } = data;
  const colors = VARIABLE_COLORS[variable.kind];
  const [hovering, setHovering] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const actionsVisible = hovering || confirmOpen;

  return (
    <div
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        position: 'relative',
        width: 200,
        background: colors.bg,
        border: `2px solid ${colors.border}`,
        borderRadius: 8,
        overflow: 'visible',
        fontSize: 12,
        boxShadow: data.selected ? `0 0 0 3px ${colors.border}40` : 'none'
      }}
    >
      {/* Hover actions: edit + delete. Always mounted so the Popconfirm anchor
          doesn't disappear mid-interaction; just toggled visible on hover.
          Stop ReactFlow from seeing these events so node-click doesn't fire. */}
      {(onEdit || onDelete) && (
        <div
          className='nodrag'
          style={{
            position: 'absolute',
            top: -10,
            right: -10,
            display: 'flex',
            gap: 4,
            zIndex: 5,
            opacity: actionsVisible ? 1 : 0,
            pointerEvents: actionsVisible ? 'auto' : 'none',
            transition: 'opacity 120ms'
          }}
          onPointerDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
        >
          {onEdit && (
            <button
              type='button'
              aria-label='Edit variable'
              onClick={() => onEdit(variable.id)}
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                border: '1px solid #d9d9d9',
                background: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                padding: 0,
                color: '#555',
                boxShadow: '0 1px 4px rgba(0,0,0,0.12)'
              }}
            >
              <EditOutlined />
            </button>
          )}
          {onDelete && (
            <Popconfirm
              title={`Delete "${variable.name}"?`}
              okText='Delete'
              okButtonProps={{ danger: true }}
              onConfirm={() => onDelete(variable.id)}
              onOpenChange={setConfirmOpen}
            >
              <button
                type='button'
                aria-label='Delete variable'
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  border: '1px solid #ffccc7',
                  background: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  padding: 0,
                  color: '#ff4d4f',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.12)'
                }}
              >
                <DeleteOutlined />
              </button>
            </Popconfirm>
          )}
        </div>
      )}

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
