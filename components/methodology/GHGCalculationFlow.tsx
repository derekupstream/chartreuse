import ReactFlow, { Background, Controls, type Node, type Edge, Position } from 'reactflow';
import 'reactflow/dist/style.css';
import styled from 'styled-components';

const FlowWrapper = styled.div`
  width: 100%;
  height: 520px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
  margin: 24px 0;
  background: #fafafa;
`;

const nodeStyle = (bg: string) => ({
  background: bg,
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '12px 16px',
  fontSize: 12,
  fontWeight: 600,
  textAlign: 'center' as const,
  width: 160
});

const stepStyle = {
  background: '#fff',
  border: '2px solid #1890ff',
  borderRadius: 8,
  padding: '10px 14px',
  fontSize: 11,
  width: 180,
  textAlign: 'center' as const
};

const nodes: Node[] = [
  // Input layer
  {
    id: 'baseline',
    position: { x: 40, y: 30 },
    data: { label: 'Baseline Purchasing\n(Single-Use Items)' },
    style: nodeStyle('#e74c3c'),
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top
  },
  {
    id: 'forecast',
    position: { x: 540, y: 30 },
    data: { label: 'Forecast Purchasing\n(Reusable Items)' },
    style: nodeStyle('#27ae60'),
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top
  },

  // Step 1 & 2
  {
    id: 'step1',
    position: { x: 20, y: 140 },
    data: { label: 'Step 1: Convert to Material Weights\n(case weight × cases, split box/product)' },
    style: stepStyle,
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top
  },
  {
    id: 'step2',
    position: { x: 520, y: 140 },
    data: { label: 'Step 2: Convert to Material Weights\n(same process for reusables)' },
    style: stepStyle,
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top
  },

  // Step 3
  {
    id: 'step3',
    position: { x: 270, y: 260 },
    data: { label: 'Step 3: Calculate Weight Differences\n(forecast − baseline per material)' },
    style: { ...stepStyle, border: '2px solid #722ed1', width: 200 },
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top
  },

  // Step 4
  {
    id: 'step4',
    position: { x: 270, y: 370 },
    data: { label: 'Step 4: Apply EPA WARM v16\nEmission Factors (kg CO₂e/lb)' },
    style: { ...stepStyle, border: '2px solid #eb2f96', width: 200 },
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top
  },

  // Data sources (side)
  {
    id: 'warm',
    position: { x: 560, y: 310 },
    data: { label: 'EPA WARM v16\nSource Reduction\nPathway' },
    style: { ...nodeStyle('#8e44ad'), width: 130, fontSize: 10 },
    sourcePosition: Position.Left,
    targetPosition: Position.Right
  },
  {
    id: 'transport',
    position: { x: 560, y: 410 },
    data: { label: 'International\nShipping Factors\n(Shanghai → LA)' },
    style: { ...nodeStyle('#2980b9'), width: 130, fontSize: 10 },
    sourcePosition: Position.Left,
    targetPosition: Position.Right
  },

  // Output
  {
    id: 'output',
    position: { x: 250, y: 470 },
    data: { label: 'Net Annual GHG Change\n(MTCO₂e avoided)' },
    style: { ...nodeStyle('#16a085'), width: 220 },
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top
  }
];

const edges: Edge[] = [
  { id: 'e-baseline-s1', source: 'baseline', target: 'step1', animated: true, style: { stroke: '#e74c3c' } },
  { id: 'e-forecast-s2', source: 'forecast', target: 'step2', animated: true, style: { stroke: '#27ae60' } },
  { id: 'e-s1-s3', source: 'step1', target: 'step3', animated: true, style: { stroke: '#1890ff' } },
  { id: 'e-s2-s3', source: 'step2', target: 'step3', animated: true, style: { stroke: '#1890ff' } },
  { id: 'e-s3-s4', source: 'step3', target: 'step4', animated: true, style: { stroke: '#722ed1' } },
  { id: 'e-warm-s4', source: 'warm', target: 'step4', style: { stroke: '#8e44ad', strokeDasharray: '5 5' } },
  { id: 'e-transport-s4', source: 'transport', target: 'step4', style: { stroke: '#2980b9', strokeDasharray: '5 5' } },
  { id: 'e-s4-out', source: 'step4', target: 'output', animated: true, style: { stroke: '#16a085' } }
];

export default function GHGCalculationFlow() {
  return (
    <FlowWrapper>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={false}
        nodesConnectable={false}
        zoomOnScroll={false}
        panOnDrag={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} color='#e8e8e8' />
        <Controls showInteractive={false} />
      </ReactFlow>
    </FlowWrapper>
  );
}
