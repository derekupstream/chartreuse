import ReactFlow, { Background, Controls, type Node, type Edge, Position } from 'reactflow';
import 'reactflow/dist/style.css';
import styled from 'styled-components';

const FlowWrapper = styled.div`
  width: 100%;
  height: 480px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
  margin: 24px 0;
  background: #fafafa;
`;

const inputStyle = {
  background: '#fff',
  border: '2px solid #595959',
  borderRadius: 8,
  padding: '10px 14px',
  fontSize: 11,
  width: 150,
  textAlign: 'center' as const,
  fontWeight: 600
};

const metricStyle = (color: string) => ({
  background: color,
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '12px 16px',
  fontSize: 12,
  fontWeight: 600,
  textAlign: 'center' as const,
  width: 160
});

const dataStyle = {
  background: '#f0f5ff',
  border: '1px solid #adc6ff',
  borderRadius: 6,
  padding: '8px 12px',
  fontSize: 10,
  width: 140,
  textAlign: 'center' as const
};

const nodes: Node[] = [
  // Input columns
  {
    id: 'su-items',
    position: { x: 30, y: 20 },
    data: { label: 'Single-Use Items\n(baseline purchases)' },
    style: inputStyle,
    sourcePosition: Position.Right
  },
  {
    id: 'reuse-items',
    position: { x: 30, y: 120 },
    data: { label: 'Reusable Items\n(forecast purchases)' },
    style: inputStyle,
    sourcePosition: Position.Right
  },
  {
    id: 'dishwashing',
    position: { x: 30, y: 220 },
    data: { label: 'Dishwashing\nOperations' },
    style: inputStyle,
    sourcePosition: Position.Right
  },
  {
    id: 'utilities',
    position: { x: 30, y: 320 },
    data: { label: 'State Utility\nRates (DOE)' },
    style: inputStyle,
    sourcePosition: Position.Right
  },

  // Central processing
  {
    id: 'calc-engine',
    position: { x: 240, y: 150 },
    data: { label: 'Calculator Engine\n(getProjections)' },
    style: {
      background: '#262626',
      color: '#fff',
      border: 'none',
      borderRadius: 12,
      padding: '14px 18px',
      fontSize: 13,
      fontWeight: 700,
      width: 170,
      textAlign: 'center' as const
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left
  },

  // Data sources
  {
    id: 'warm-data',
    position: { x: 230, y: 10 },
    data: { label: 'EPA WARM v16\nEmission Factors' },
    style: dataStyle,
    sourcePosition: Position.Bottom
  },
  {
    id: 'water-data',
    position: { x: 230, y: 310 },
    data: { label: 'Water Use Factors\n(LCA synthesis)' },
    style: dataStyle,
    sourcePosition: Position.Top
  },

  // Output metrics
  {
    id: 'ghg',
    position: { x: 490, y: 20 },
    data: { label: 'GHG Emissions\n(MTCO₂e avoided)' },
    style: metricStyle('#389e0d'),
    targetPosition: Position.Left
  },
  {
    id: 'waste',
    position: { x: 490, y: 110 },
    data: { label: 'Waste Diverted\n(lbs of materials)' },
    style: metricStyle('#d48806'),
    targetPosition: Position.Left
  },
  {
    id: 'units',
    position: { x: 490, y: 200 },
    data: { label: 'Single-Use Units\nAvoided' },
    style: metricStyle('#cf1322'),
    targetPosition: Position.Left
  },
  {
    id: 'water',
    position: { x: 490, y: 290 },
    data: { label: 'Water Saved\n(gallons)' },
    style: metricStyle('#096dd9'),
    targetPosition: Position.Left
  },
  {
    id: 'cost',
    position: { x: 490, y: 380 },
    data: { label: 'Cost Savings\n(Annual $ + ROI)' },
    style: metricStyle('#531dab'),
    targetPosition: Position.Left
  }
];

const edges: Edge[] = [
  // Inputs → engine
  { id: 'e-su', source: 'su-items', target: 'calc-engine', animated: true, style: { stroke: '#595959' } },
  { id: 'e-reuse', source: 'reuse-items', target: 'calc-engine', animated: true, style: { stroke: '#595959' } },
  { id: 'e-dish', source: 'dishwashing', target: 'calc-engine', animated: true, style: { stroke: '#595959' } },
  { id: 'e-util', source: 'utilities', target: 'calc-engine', animated: true, style: { stroke: '#595959' } },

  // Data sources → engine
  { id: 'e-warm', source: 'warm-data', target: 'calc-engine', style: { stroke: '#adc6ff', strokeDasharray: '5 5' } },
  { id: 'e-wdata', source: 'water-data', target: 'calc-engine', style: { stroke: '#adc6ff', strokeDasharray: '5 5' } },

  // Engine → outputs
  { id: 'e-ghg', source: 'calc-engine', target: 'ghg', animated: true, style: { stroke: '#389e0d' } },
  { id: 'e-waste', source: 'calc-engine', target: 'waste', animated: true, style: { stroke: '#d48806' } },
  { id: 'e-units', source: 'calc-engine', target: 'units', animated: true, style: { stroke: '#cf1322' } },
  { id: 'e-water', source: 'calc-engine', target: 'water', animated: true, style: { stroke: '#096dd9' } },
  { id: 'e-cost', source: 'calc-engine', target: 'cost', animated: true, style: { stroke: '#531dab' } }
];

export default function EnvironmentalMetricsFlow() {
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
