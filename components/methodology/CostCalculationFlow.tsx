import ReactFlow, { Background, Controls, type Node, type Edge, Position } from 'reactflow';
import 'reactflow/dist/style.css';
import styled from 'styled-components';

const FlowWrapper = styled.div`
  width: 100%;
  height: 440px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
  margin: 24px 0;
  background: #fafafa;
`;

const costNode = (color: string) => ({
  background: '#fff',
  border: `2px solid ${color}`,
  borderRadius: 8,
  padding: '10px 14px',
  fontSize: 11,
  width: 160,
  textAlign: 'center' as const,
  fontWeight: 600
});

const resultNode = (bg: string) => ({
  background: bg,
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '12px 16px',
  fontSize: 12,
  fontWeight: 600,
  textAlign: 'center' as const,
  width: 180
});

const nodes: Node[] = [
  // Single-use costs (left column)
  {
    id: 'su-procurement',
    position: { x: 30, y: 30 },
    data: { label: 'Single-Use\nProcurement Costs\n(qty × $/case)' },
    style: costNode('#e74c3c'),
    sourcePosition: Position.Right
  },
  {
    id: 'su-waste',
    position: { x: 30, y: 140 },
    data: { label: 'Waste Hauling\nCosts' },
    style: costNode('#e74c3c'),
    sourcePosition: Position.Right
  },

  // Reuse costs (center-left)
  {
    id: 're-procurement',
    position: { x: 30, y: 260 },
    data: { label: 'Reusable\nProcurement Costs\n(start-up investment)' },
    style: costNode('#27ae60'),
    sourcePosition: Position.Right
  },
  {
    id: 're-dishwashing',
    position: { x: 30, y: 370 },
    data: { label: 'Dishwashing Equipment\n+ Supplies' },
    style: costNode('#27ae60'),
    sourcePosition: Position.Right
  },

  // Operating costs
  {
    id: 'labor',
    position: { x: 240, y: 260 },
    data: { label: 'Labor Costs' },
    style: costNode('#2980b9'),
    sourcePosition: Position.Right,
    targetPosition: Position.Left
  },
  {
    id: 'utility',
    position: { x: 240, y: 370 },
    data: { label: 'Utility Costs\n(state-specific DOE rates\n× dishwashing energy)' },
    style: costNode('#2980b9'),
    sourcePosition: Position.Right,
    targetPosition: Position.Left
  },

  // Totals
  {
    id: 'su-total',
    position: { x: 260, y: 30 },
    data: { label: 'Annual Single-Use\nOperating Costs' },
    style: resultNode('#e74c3c'),
    sourcePosition: Position.Right,
    targetPosition: Position.Left
  },
  {
    id: 're-total',
    position: { x: 260, y: 140 },
    data: { label: 'Annual Reuse\nOperating Costs' },
    style: resultNode('#27ae60'),
    sourcePosition: Position.Right,
    targetPosition: Position.Left
  },

  // ROI calculations
  {
    id: 'roi',
    position: { x: 510, y: 30 },
    data: { label: 'Annual Cost Savings ROI\n(SU − Reuse) / Start-Up\n= % recovered per year' },
    style: resultNode('#531dab'),
    targetPosition: Position.Left
  },
  {
    id: 'payback',
    position: { x: 510, y: 160 },
    data: { label: 'Payback Period\nStart-Up / (SU − Reuse)\n× 12 = months' },
    style: resultNode('#08979c'),
    targetPosition: Position.Left
  }
];

const edges: Edge[] = [
  { id: 'e-su-proc', source: 'su-procurement', target: 'su-total', animated: true, style: { stroke: '#e74c3c' } },
  { id: 'e-su-waste', source: 'su-waste', target: 'su-total', animated: true, style: { stroke: '#e74c3c' } },
  { id: 'e-re-proc', source: 're-procurement', target: 're-total', animated: true, style: { stroke: '#27ae60' } },
  { id: 'e-re-dish', source: 're-dishwashing', target: 're-total', animated: true, style: { stroke: '#27ae60' } },
  { id: 'e-labor', source: 'labor', target: 're-total', animated: true, style: { stroke: '#2980b9' } },
  { id: 'e-utility', source: 'utility', target: 're-total', animated: true, style: { stroke: '#2980b9' } },
  { id: 'e-su-roi', source: 'su-total', target: 'roi', animated: true, style: { stroke: '#531dab' } },
  { id: 'e-re-roi', source: 're-total', target: 'roi', animated: true, style: { stroke: '#531dab' } },
  { id: 'e-su-pay', source: 'su-total', target: 'payback', animated: true, style: { stroke: '#08979c' } },
  { id: 'e-re-pay', source: 're-total', target: 'payback', animated: true, style: { stroke: '#08979c' } }
];

export default function CostCalculationFlow() {
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
