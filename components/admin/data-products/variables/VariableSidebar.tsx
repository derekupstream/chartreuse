import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Empty, Popconfirm, Space, Typography } from 'antd';

import { VARIABLE_COLORS, VARIABLE_KIND_LABEL } from 'lib/dataProducts/variables';
import type { Variable, VariableKind } from 'lib/dataProducts/variables';

const { Text } = Typography;

type Props = {
  variables: Variable[];
  onAdd: () => void;
  onEdit: (v: Variable) => void;
  onDelete: (id: string) => void;
  /** Called when a pill is dragged out (used to drop on the canvas) */
  onDragStartVariable?: (v: Variable, e: React.DragEvent) => void;
};

const KIND_ORDER: VariableKind[] = ['user_input', 'calculation', 'constant'];

export function VariableSidebar({ variables, onAdd, onEdit, onDelete, onDragStartVariable }: Props) {
  const byKind = KIND_ORDER.map(k => ({
    kind: k,
    items: variables.filter(v => v.kind === k)
  }));

  return (
    <div
      style={{
        width: 260,
        borderRight: '1px solid #f0f0f0',
        background: '#fafafa',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
    >
      <div style={{ padding: 12, borderBottom: '1px solid #f0f0f0', background: '#fff' }}>
        <Button type='primary' icon={<PlusOutlined />} onClick={onAdd} block>
          Add variable
        </Button>
      </div>
      <div style={{ overflow: 'auto', flex: 1, padding: '8px 8px 24px' }}>
        {variables.length === 0 && (
          <div style={{ paddingTop: 24 }}>
            <Empty
              imageStyle={{ height: 60 }}
              description={
                <Text type='secondary' style={{ fontSize: 12 }}>
                  No variables yet. Click <strong>Add variable</strong> to start.
                </Text>
              }
            />
          </div>
        )}
        {byKind.map(group =>
          group.items.length === 0 ? null : (
            <div key={group.kind} style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  color: '#8c8c8c',
                  textTransform: 'uppercase',
                  padding: '4px 8px'
                }}
              >
                {VARIABLE_KIND_LABEL[group.kind]} ({group.items.length})
              </div>
              {group.items.map(v => (
                <VariablePill
                  key={v.id}
                  variable={v}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onDragStart={onDragStartVariable}
                />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

type PillProps = {
  variable: Variable;
  onEdit: (v: Variable) => void;
  onDelete: (id: string) => void;
  onDragStart?: (v: Variable, e: React.DragEvent) => void;
};

function VariablePill({ variable, onEdit, onDelete, onDragStart }: PillProps) {
  const colors = VARIABLE_COLORS[variable.kind];
  return (
    <div
      draggable={!!onDragStart}
      onDragStart={e => onDragStart?.(variable, e)}
      style={{
        background: '#fff',
        border: `1px solid ${colors.border}`,
        borderLeft: `4px solid ${colors.border}`,
        borderRadius: 4,
        padding: '6px 8px',
        marginBottom: 6,
        cursor: onDragStart ? 'grab' : 'default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 6
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#262626',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
          title={variable.name}
        >
          {variable.name}
        </div>
        {variable.description && (
          <div
            style={{
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
      <Space size={0}>
        <Button size='small' type='text' icon={<EditOutlined />} onClick={() => onEdit(variable)} />
        <Popconfirm
          title={`Delete variable "${variable.name}"?`}
          okText='Delete'
          okButtonProps={{ danger: true }}
          onConfirm={() => onDelete(variable.id)}
        >
          <Button size='small' type='text' icon={<DeleteOutlined />} />
        </Popconfirm>
      </Space>
    </div>
  );
}
