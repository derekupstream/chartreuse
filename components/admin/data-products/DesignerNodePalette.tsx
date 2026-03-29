import {
  BarChartOutlined,
  DatabaseOutlined,
  ExperimentOutlined,
  FunctionOutlined,
  MergeCellsOutlined,
  SwapOutlined
} from '@ant-design/icons';
import { Collapse, Typography } from 'antd';

import type { DesignerNodeType } from './nodes/nodeTypes';
import { NODE_TYPE_DEFS } from './nodes/nodeTypes';

const { Text } = Typography;

const ICONS: Record<string, React.ReactNode> = {
  DatabaseOutlined: <DatabaseOutlined />,
  ExperimentOutlined: <ExperimentOutlined />,
  FunctionOutlined: <FunctionOutlined />,
  MergeCellsOutlined: <MergeCellsOutlined />,
  SwapOutlined: <SwapOutlined />,
  BarChartOutlined: <BarChartOutlined />
};

function onDragStart(event: React.DragEvent, nodeType: DesignerNodeType) {
  event.dataTransfer.setData('application/reactflow-node-type', nodeType);
  event.dataTransfer.effectAllowed = 'move';
}

export function DesignerNodePalette() {
  const types = Object.entries(NODE_TYPE_DEFS) as [DesignerNodeType, (typeof NODE_TYPE_DEFS)[DesignerNodeType]][];

  return (
    <div
      style={{
        width: 200,
        borderRight: '1px solid #f0f0f0',
        background: '#fafafa',
        overflowY: 'auto',
        height: '100%'
      }}
    >
      <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid #f0f0f0' }}>
        <Text strong style={{ fontSize: 12 }}>
          Node Palette
        </Text>
      </div>

      <Collapse
        ghost
        defaultActiveKey={types.map(([key]) => key)}
        style={{ fontSize: 12 }}
        items={types.map(([key, def]) => ({
          key,
          label: (
            <span style={{ fontSize: 12, fontWeight: 600 }}>
              {ICONS[def.icon]} {def.label}
            </span>
          ),
          children: (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* Default node of this type */}
              <div
                draggable
                onDragStart={e => onDragStart(e, key)}
                style={{
                  padding: '6px 8px',
                  background: def.color,
                  border: `1px solid ${def.borderColor}`,
                  borderRadius: 6,
                  cursor: 'grab',
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {ICONS[def.icon]}
                <span>{def.label} Node</span>
              </div>
              {/* Subtypes */}
              {def.subtypes.map(st => (
                <div
                  key={st.value}
                  draggable
                  onDragStart={e => {
                    e.dataTransfer.setData('application/reactflow-node-type', key);
                    e.dataTransfer.setData('application/reactflow-node-subtype', st.value);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  style={{
                    padding: '4px 8px',
                    background: '#fff',
                    border: `1px solid ${def.borderColor}40`,
                    borderRadius: 4,
                    cursor: 'grab',
                    fontSize: 10,
                    color: '#595959',
                    marginLeft: 8
                  }}
                >
                  {st.label}
                </div>
              ))}
            </div>
          )
        }))}
      />
    </div>
  );
}
