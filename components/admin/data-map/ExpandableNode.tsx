/**
 * ExpandableNode — A ReactFlow node that supports two zoom states:
 *
 * Collapsed (Level 1): Shows entity label + count + health signal (like the old SystemNode)
 * Expanded (Level 2): Shows table schema fields with types and relation indicators
 *
 * Double-click or click the zoom button to toggle.
 */

import { CompressOutlined, DatabaseOutlined, ExpandOutlined, KeyOutlined, LinkOutlined } from '@ant-design/icons';
import { Tag, Tooltip } from 'antd';
import type { NodeProps } from 'reactflow';
import { Handle, Position } from 'reactflow';

import type { SchemaField } from 'lib/admin/schemaTypes';
import { RELATION_SCROLL_MAX, SCALAR_SCROLL_MAX } from './systemGraphLayout';

const LAYER_COLORS: Record<string, string> = {
  source: '#1677ff',
  data: '#666',
  governance: '#722ed1',
  processing: '#fa8c16',
  output: '#52c41a'
};

const HEALTH_COLORS: Record<string, string> = {
  error: '#ff4d4f',
  warning: '#faad14'
};

const TYPE_COLORS: Record<string, string> = {
  String: '#52c41a',
  Int: '#1677ff',
  Float: '#13c2c2',
  Boolean: '#fa8c16',
  DateTime: '#722ed1',
  Json: '#eb2f96',
  Uuid: '#1677ff'
};

function FieldRow({ field, onFieldClick }: { field: SchemaField; onFieldClick?: (field: SchemaField) => void }) {
  const typeColor = TYPE_COLORS[field.type] ?? '#999';

  return (
    <div
      onClick={
        field.isRelation && onFieldClick
          ? e => {
              e.stopPropagation();
              onFieldClick(field);
            }
          : undefined
      }
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 6px',
        fontSize: 10,
        lineHeight: '16px',
        cursor: field.isRelation ? 'pointer' : 'default',
        borderRadius: 3,
        transition: 'background 0.15s'
      }}
      onMouseEnter={e => {
        if (field.isRelation) (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.04)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = 'transparent';
      }}
    >
      {/* Field indicators */}
      {field.isId && (
        <Tooltip title='Primary Key' mouseEnterDelay={0.5}>
          <KeyOutlined style={{ fontSize: 8, color: '#faad14' }} />
        </Tooltip>
      )}
      {field.isRelation && (
        <Tooltip title={`→ ${field.relatedModel}`} mouseEnterDelay={0.5}>
          <LinkOutlined style={{ fontSize: 8, color: '#1677ff' }} />
        </Tooltip>
      )}

      {/* Field name */}
      <span
        style={{
          flex: 1,
          fontFamily: 'SF Mono, Menlo, monospace',
          color: field.isRelation ? '#1677ff' : '#333',
          fontWeight: field.isId ? 600 : 400,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {field.name}
      </span>

      {/* Type tag */}
      <span
        style={{
          fontSize: 9,
          color: typeColor,
          fontFamily: 'SF Mono, Menlo, monospace',
          flexShrink: 0
        }}
      >
        {field.type}
        {field.isList ? '[]' : ''}
        {field.isOptional ? '?' : ''}
      </span>
    </div>
  );
}

export function ExpandableNode({ data }: NodeProps) {
  const layer = data.layer as string;
  const label = data.label as string;
  const subtitle = data.subtitle as string | undefined;
  const signal = data.healthSignal as string | null;
  const severity = data.healthSeverity as string | null;
  const dimmed = data.dimmed as boolean | undefined;
  const expanded = data.expanded as boolean | undefined;
  const fields = data.fields as SchemaField[] | undefined;
  const onToggle = data.onToggle as (() => void) | undefined;
  const onFieldClick = data.onFieldClick as ((field: SchemaField, sourceNodeId: string) => void) | undefined;
  const onViewData = data.onViewData as ((nodeId: string) => void) | undefined;
  const modelName = data.modelName as string | undefined;
  const nodeId = data.nodeId as string | undefined;

  const layerColor = LAYER_COLORS[layer] ?? '#333';

  if (!expanded) {
    // ── Collapsed state (Level 1) ──
    return (
      <>
        <Handle type='target' position={Position.Left} style={{ opacity: 0 }} />
        <div
          style={{
            padding: '8px 14px',
            fontSize: 12,
            textAlign: 'center',
            minWidth: 140,
            opacity: dimmed ? 0.25 : 1,
            transition: 'opacity 0.2s',
            position: 'relative'
          }}
        >
          <div style={{ fontWeight: 600, color: layerColor }}>{label}</div>
          {subtitle && <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{subtitle}</div>}
          {signal && (
            <div style={{ fontSize: 10, color: HEALTH_COLORS[severity ?? 'warning'], marginTop: 3, fontWeight: 500 }}>
              {severity === 'error' ? '\u274C' : '\u26A0\uFE0F'} {signal}
            </div>
          )}
          {onToggle && (
            <Tooltip title='Expand schema' mouseEnterDelay={0.5}>
              <div
                onClick={e => {
                  e.stopPropagation();
                  onToggle();
                }}
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  cursor: 'pointer',
                  fontSize: 10,
                  color: '#bbb',
                  padding: 2,
                  borderRadius: 3,
                  lineHeight: 1
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.color = layerColor;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.color = '#bbb';
                }}
              >
                <ExpandOutlined />
              </div>
            </Tooltip>
          )}
        </div>
        <Handle type='source' position={Position.Right} style={{ opacity: 0 }} />
      </>
    );
  }

  // ── Expanded state (Level 2) — Schema fields visible ──
  const scalarFields = (fields ?? []).filter(f => !f.isRelation);
  const relationFields = (fields ?? []).filter(f => f.isRelation);

  return (
    <>
      <Handle type='target' position={Position.Left} style={{ opacity: 0 }} />
      <div
        style={{
          minWidth: 240,
          maxWidth: 280,
          opacity: dimmed ? 0.25 : 1,
          transition: 'opacity 0.2s'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '6px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${layerColor}33`
          }}
        >
          <div>
            <div style={{ fontWeight: 600, color: layerColor, fontSize: 12 }}>{label}</div>
            {modelName && (
              <div style={{ fontSize: 9, color: '#999', fontFamily: 'SF Mono, Menlo, monospace' }}>
                model {modelName}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {onViewData && nodeId && (
              <Tooltip title='View sample data' mouseEnterDelay={0.5}>
                <div
                  onClick={e => {
                    e.stopPropagation();
                    onViewData(nodeId);
                  }}
                  style={{ cursor: 'pointer', fontSize: 11, color: '#999', padding: 2 }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.color = layerColor;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.color = '#999';
                  }}
                >
                  <DatabaseOutlined />
                </div>
              </Tooltip>
            )}
            {onToggle && (
              <Tooltip title='Collapse' mouseEnterDelay={0.5}>
                <div
                  onClick={e => {
                    e.stopPropagation();
                    onToggle();
                  }}
                  style={{ cursor: 'pointer', fontSize: 11, color: '#999', padding: 2 }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.color = layerColor;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.color = '#999';
                  }}
                >
                  <CompressOutlined />
                </div>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Scalar fields */}
        <div style={{ padding: '4px 0', maxHeight: SCALAR_SCROLL_MAX, overflowY: 'auto' }}>
          {scalarFields.map(f => (
            <FieldRow key={f.name} field={f} />
          ))}
        </div>

        {/* Relations section */}
        {relationFields.length > 0 && (
          <>
            <div
              style={{
                padding: '2px 6px',
                fontSize: 9,
                color: '#999',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderTop: '1px solid #f0f0f0'
              }}
            >
              Relations ({relationFields.length})
            </div>
            <div style={{ padding: '2px 0 4px', maxHeight: RELATION_SCROLL_MAX, overflowY: 'auto' }}>
              {relationFields.map(f => (
                <FieldRow
                  key={f.name}
                  field={f}
                  onFieldClick={onFieldClick && nodeId ? field => onFieldClick(field, nodeId) : undefined}
                />
              ))}
            </div>
          </>
        )}

        {/* Footer: field count summary */}
        <div
          style={{
            padding: '4px 8px',
            fontSize: 9,
            color: '#bbb',
            borderTop: '1px solid #f0f0f0',
            display: 'flex',
            gap: 8
          }}
        >
          <Tag color='default' style={{ fontSize: 9, lineHeight: '14px', margin: 0 }}>
            {scalarFields.length} fields
          </Tag>
          {relationFields.length > 0 && (
            <Tag color='blue' style={{ fontSize: 9, lineHeight: '14px', margin: 0 }}>
              {relationFields.length} relations
            </Tag>
          )}
        </div>
      </div>
      <Handle type='source' position={Position.Right} style={{ opacity: 0 }} />
    </>
  );
}
