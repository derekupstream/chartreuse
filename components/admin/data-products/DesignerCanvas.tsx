import { PartitionOutlined, QuestionCircleOutlined, SaveOutlined } from '@ant-design/icons';
import { Button, Drawer, message, Space, Typography } from 'antd';
import { useCallback, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  ConnectionMode,
  Controls,
  MarkerType,
  MiniMap,
  useEdgesState,
  useNodesState
} from 'reactflow';
import type { Connection, Edge, Node, ReactFlowInstance } from 'reactflow';
import 'reactflow/dist/style.css';

import type { RegisteredFunction } from 'lib/admin/calculatorRegistry';

import { DesignerNodePalette } from './DesignerNodePalette';
import { DesignerPropertiesPanel } from './DesignerPropertiesPanel';
import { autoLayoutNodes } from './designerLayout';
import type { DesignerNodeData } from './nodes/DesignerNode';
import { DesignerNode } from './nodes/DesignerNode';
import type { DesignerNodeType } from './nodes/nodeTypes';
import { NODE_TYPE_DEFS } from './nodes/nodeTypes';

const { Text } = Typography;

type Factor = {
  id: string;
  name: string;
  currentValue: number;
  unit: string;
  category?: { name: string };
};

type Props = {
  productId: string;
  initialNodes: Node<DesignerNodeData>[];
  initialEdges: Edge[];
  factors: Factor[];
  calculations: RegisteredFunction[];
};

const nodeTypes = { designer: DesignerNode };

let nodeIdCounter = 0;
function getNodeId() {
  return `node_${Date.now()}_${nodeIdCounter++}`;
}

export function DesignerCanvas({ productId, initialNodes, initialEdges, factors, calculations }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node<DesignerNodeData> | null>(null);
  const [saving, setSaving] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const flowRef = useRef<ReactFlowInstance | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Keep selected node in sync with nodes state
  const currentSelectedNode = useMemo(() => {
    if (!selectedNode) return null;
    return nodes.find(n => n.id === selectedNode.id) ?? null;
  }, [nodes, selectedNode]);

  const onConnect = useCallback(
    (connection: Connection) => {
      const sourceNode = nodes.find(n => n.id === connection.source);
      const typeDef = sourceNode ? NODE_TYPE_DEFS[sourceNode.data.nodeType] : null;
      const color = typeDef?.borderColor ?? '#8c8c8c';

      setEdges(eds =>
        addEdge(
          {
            ...connection,
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed, color },
            style: { stroke: color, strokeWidth: 2 }
          },
          eds
        )
      );
    },
    [nodes, setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const nodeType = event.dataTransfer.getData('application/reactflow-node-type') as DesignerNodeType;
      if (!nodeType || !NODE_TYPE_DEFS[nodeType]) return;

      const subtype = event.dataTransfer.getData('application/reactflow-node-subtype') || undefined;
      const typeDef = NODE_TYPE_DEFS[nodeType];
      const subtypeDef = subtype ? typeDef.subtypes.find(s => s.value === subtype) : undefined;

      const reactFlowBounds = wrapperRef.current?.getBoundingClientRect();
      if (!reactFlowBounds || !flowRef.current) return;

      const position = flowRef.current.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY
      });

      const newNode: Node<DesignerNodeData> = {
        id: getNodeId(),
        type: 'designer',
        position,
        data: {
          nodeType,
          label: subtypeDef?.label ?? `${typeDef.label} Node`,
          subtitle: subtypeDef?.label,
          subtype
        }
      };

      setNodes(nds => nds.concat(newNode));
    },
    [setNodes]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node<DesignerNodeData>) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const onNodeUpdate = useCallback(
    (nodeId: string, updates: Partial<DesignerNodeData>) => {
      setNodes(nds =>
        nds.map(n => {
          if (n.id !== nodeId) return n;
          return { ...n, data: { ...n.data, ...updates } };
        })
      );
    },
    [setNodes]
  );

  const handleAutoLayout = useCallback(() => {
    const layouted = autoLayoutNodes(nodes, edges);
    setNodes(layouted);
    setTimeout(() => flowRef.current?.fitView({ padding: 0.3 }), 50);
  }, [nodes, edges, setNodes]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const viewport = flowRef.current?.getViewport();
      const res = await fetch(`/api/admin/data-products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flowDefinitionJson: { nodes, edges, viewport }
        })
      });
      if (res.ok) {
        message.success('Flow saved');
      } else {
        message.error('Failed to save');
      }
    } catch {
      message.error('Failed to save');
    } finally {
      setSaving(false);
    }
  }, [productId, nodes, edges]);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 220px)', border: '1px solid #f0f0f0', borderRadius: 8 }}>
      {/* Left: Node Palette */}
      <DesignerNodePalette />

      {/* Center: Canvas */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Toolbar */}
        <div
          style={{
            padding: '8px 16px',
            borderBottom: '1px solid #f0f0f0',
            background: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Text type='secondary' style={{ fontSize: 11 }}>
            {nodes.length} nodes, {edges.length} edges
          </Text>
          <Space size={8}>
            <Button size='small' icon={<QuestionCircleOutlined />} onClick={() => setHelpOpen(true)}>
              How to Use
            </Button>
            <Button size='small' icon={<PartitionOutlined />} onClick={handleAutoLayout}>
              Auto Layout
            </Button>
            <Button size='small' type='primary' icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
              Save
            </Button>
          </Space>
        </div>

        {/* ReactFlow Canvas */}
        <div ref={wrapperRef} style={{ flex: 1 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onInit={instance => {
              flowRef.current = instance;
            }}
            connectionMode={ConnectionMode.Loose}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            deleteKeyCode={['Backspace', 'Delete']}
          >
            <Background />
            <Controls />
            <MiniMap
              nodeColor={node => {
                const data = node.data as DesignerNodeData;
                return NODE_TYPE_DEFS[data?.nodeType]?.borderColor ?? '#8c8c8c';
              }}
            />
          </ReactFlow>
        </div>
      </div>

      {/* Right: Properties Panel */}
      <DesignerPropertiesPanel
        selectedNode={currentSelectedNode}
        factors={factors}
        calculations={calculations}
        onNodeUpdate={onNodeUpdate}
      />

      {/* How to Use Drawer */}
      <Drawer
        title='How to Use the Data Product Designer'
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        width={520}
      >
        <div style={{ fontSize: 13, lineHeight: 1.8 }}>
          <h3>Overview</h3>
          <p>
            The Data Product Designer lets you visually build governed data flows by wiring together inputs, factors,
            calculations, and outputs. Each flow becomes a <strong>Data Product</strong> — a calculator, dashboard,
            scenario model, or report.
          </p>

          <h3>The Three Panels</h3>
          <ul>
            <li>
              <strong>Node Palette (left)</strong> — Drag nodes from here onto the canvas.
            </li>
            <li>
              <strong>Canvas (center)</strong> — Your workspace. Place, connect, and arrange nodes here.
            </li>
            <li>
              <strong>Properties (right)</strong> — Click any node to configure it. Factor and Calculation nodes have
              searchable pickers that connect to your existing libraries.
            </li>
          </ul>

          <h3>Adding Nodes</h3>
          <p>Drag any item from the left palette onto the canvas. Each node type serves a different role:</p>
          <ul>
            <li>
              <strong style={{ color: '#52c41a' }}>Input</strong> — Data entering the flow (user input, project data,
              API data, imported data)
            </li>
            <li>
              <strong style={{ color: '#1677ff' }}>Factor</strong> — Governed constants from the Factor Library
              (emission factors, utility rates, material properties)
            </li>
            <li>
              <strong style={{ color: '#fa8c16' }}>Calculation</strong> — Reusable logic blocks from the Calculations
              Registry (e.g., getDishwasherStats, getAnnualGasEmissionChanges)
            </li>
            <li>
              <strong style={{ color: '#eb2f96' }}>Aggregation</strong> — Combine or reshape data (sum, group by, merge,
              normalize)
            </li>
            <li>
              <strong style={{ color: '#ff4d4f' }}>Comparison</strong> — Compare two branches (baseline vs forecast,
              scenario A vs B)
            </li>
            <li>
              <strong style={{ color: '#722ed1' }}>Output</strong> — Results that feed into dashboards, reports, or
              metrics
            </li>
          </ul>

          <h3>Connecting Nodes</h3>
          <p>
            Each node has <strong>colored dots</strong> (handles) on its sides:
          </p>
          <ul>
            <li>
              <strong>Left dot</strong> = input (receives data from upstream nodes)
            </li>
            <li>
              <strong>Right dot</strong> = output (sends data to downstream nodes)
            </li>
          </ul>
          <p>
            To create a connection: <strong>click and drag</strong> from the right dot of one node to the left dot of
            another node. An animated arrow will appear showing the data flow direction.
          </p>
          <p>
            <em>Tip:</em> Input nodes have no left dot (they are flow sources). Output nodes have no right dot (they are
            flow sinks). All other nodes have both.
          </p>

          <h3>Configuring Nodes</h3>
          <p>Click any node to select it and see its properties on the right panel:</p>
          <ul>
            <li>
              <strong>Factor nodes</strong> — Search and select from your Factor Library. The node subtitle will show
              the factor name, current value, and unit.
            </li>
            <li>
              <strong>Calculation nodes</strong> — Search and select from the 28 registered calculator functions. The
              subtitle shows how many output metrics the function produces.
            </li>
            <li>
              <strong>Output nodes</strong> — Set a metric key (e.g., &quot;annualGHGChange&quot;) and unit (e.g.,
              &quot;MTCO2e&quot;).
            </li>
          </ul>

          <h3>Toolbar Actions</h3>
          <ul>
            <li>
              <strong>Auto Layout</strong> — Automatically arrange nodes in a clean left-to-right flow using the dagre
              layout engine.
            </li>
            <li>
              <strong>Save</strong> — Persist the current flow to the database. You can close the page and return later
              — your flow will be restored.
            </li>
          </ul>

          <h3>Keyboard Shortcuts</h3>
          <ul>
            <li>
              <strong>Backspace / Delete</strong> — Remove selected nodes or edges
            </li>
            <li>
              <strong>Scroll</strong> — Zoom in/out
            </li>
            <li>
              <strong>Click + Drag canvas</strong> — Pan around
            </li>
            <li>
              <strong>Click + Drag node</strong> — Move a node
            </li>
          </ul>

          <h3>Building a Flow (Example)</h3>
          <p>Here is how to model the GHG calculation from our methodology:</p>
          <ol>
            <li>
              Drag a <strong>Baseline Purchasing</strong> input node onto the canvas
            </li>
            <li>
              Drag a <strong>Material Property</strong> factor node (select a WARM emission factor)
            </li>
            <li>
              Drag a <strong>Calculation</strong> node (select &quot;getAnnualGasEmissionChanges&quot;)
            </li>
            <li>Connect Baseline Purchasing → Calculation</li>
            <li>Connect Material Property → Calculation</li>
            <li>
              Drag an <strong>Output</strong> node (set metric key to &quot;annualGHGChange&quot;, unit
              &quot;MTCO2e&quot;)
            </li>
            <li>Connect Calculation → Output</li>
            <li>
              Click <strong>Auto Layout</strong> to clean up the arrangement
            </li>
            <li>
              Click <strong>Save</strong>
            </li>
          </ol>

          <h3>Tabs</h3>
          <ul>
            <li>
              <strong>Overview</strong> — Edit name, description, type, and audience
            </li>
            <li>
              <strong>Designer</strong> — The visual node canvas (you are here)
            </li>
            <li>
              <strong>Inputs</strong> — Define the input schema (JSON)
            </li>
            <li>
              <strong>Outputs</strong> — Define the output schema (JSON)
            </li>
            <li>
              <strong>Methodology</strong> — Link to a methodology document for governance
            </li>
            <li>
              <strong>Tests</strong> — Coming soon: validate against golden datasets
            </li>
            <li>
              <strong>Publish</strong> — Move through the workflow: Draft → Review → Published
            </li>
          </ul>
        </div>
      </Drawer>
    </div>
  );
}
