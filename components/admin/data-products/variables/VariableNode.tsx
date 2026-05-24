import { CloseOutlined, EditOutlined } from '@ant-design/icons';
import { InputNumber, Slider, Input, Tooltip } from 'antd';
import { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';

import { VARIABLE_COLORS, VARIABLE_KIND_LABEL } from 'lib/dataProducts/variables';
import type { Variable } from 'lib/dataProducts/variables';

export type VariableNodeData = {
  variable: Variable;
  valuePreview?: string;
  selected?: boolean;
  onEdit?: (id: string) => void;
  /** Remove from the canvas only — variable persists in the sidebar */
  onRemoveFromCanvas?: (id: string) => void;
  /** Current per-session test value for a user_input variable */
  testValue?: number | string;
  /** Update the test value (calc nodes recompute live as it changes) */
  onTestValueChange?: (id: string, value: number | string) => void;
};

function VariableNodeComponent({ data }: { data: VariableNodeData }) {
  const { variable, valuePreview, onEdit, onRemoveFromCanvas, testValue, onTestValueChange } = data;
  const colors = VARIABLE_COLORS[variable.kind];
  const [hovering, setHovering] = useState(false);

  const actionsVisible = hovering;

  // For user_input: render an editable control right on the canvas. The
  // value lives in per-session test state in the builder; calc nodes
  // recompute as it changes.
  const renderInputControl = () => {
    if (variable.kind !== 'user_input' || !onTestValueChange) return null;
    const cfg = variable.userInput;
    if (!cfg) return null;
    const current = testValue ?? cfg.defaultValue ?? (cfg.widget === 'text' ? '' : 0);
    const stop = (e: React.SyntheticEvent) => e.stopPropagation();
    if (cfg.widget === 'slider') {
      return (
        <div className='nodrag' onPointerDown={stop} onMouseDown={stop} style={{ marginTop: 6 }}>
          <Slider
            min={cfg.min ?? 0}
            max={cfg.max ?? 100}
            step={cfg.step ?? 1}
            value={typeof current === 'number' ? current : Number(current) || 0}
            onChange={v => onTestValueChange(variable.id, v as number)}
            tooltip={{ formatter: v => `${v}${cfg.unit ? ' ' + cfg.unit : ''}` }}
          />
          <div style={{ fontSize: 11, color: '#595959', textAlign: 'right', marginTop: -4 }}>
            {current}
            {cfg.unit ? ' ' + cfg.unit : ''}
          </div>
        </div>
      );
    }
    if (cfg.widget === 'number') {
      return (
        <div className='nodrag' onPointerDown={stop} onMouseDown={stop} style={{ marginTop: 6 }}>
          <InputNumber
            size='small'
            value={typeof current === 'number' ? current : Number(current) || 0}
            onChange={v => onTestValueChange(variable.id, (v as number) ?? 0)}
            style={{ width: '100%' }}
            addonAfter={cfg.unit || undefined}
          />
        </div>
      );
    }
    return (
      <div className='nodrag' onPointerDown={stop} onMouseDown={stop} style={{ marginTop: 6 }}>
        <Input
          size='small'
          value={String(current ?? '')}
          onChange={e => onTestValueChange(variable.id, e.target.value)}
        />
      </div>
    );
  };

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
      {/* Hover actions: edit + remove-from-canvas. The X just takes the variable
          off the canvas — it stays in the sidebar and can be dragged back.
          Real deletion of the variable lives on the sidebar trash icon. */}
      {(onEdit || onRemoveFromCanvas) && (
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
          {onRemoveFromCanvas && (
            <Tooltip title='Remove from canvas (variable stays in sidebar)' mouseEnterDelay={0.6}>
              <button
                type='button'
                aria-label='Remove from canvas'
                onClick={() => onRemoveFromCanvas(variable.id)}
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
                  color: '#595959',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.12)'
                }}
              >
                <CloseOutlined />
              </button>
            </Tooltip>
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
        {/* For user_input: live editable control inline; for others: read-only preview */}
        {variable.kind === 'user_input'
          ? renderInputControl()
          : valuePreview && (
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
