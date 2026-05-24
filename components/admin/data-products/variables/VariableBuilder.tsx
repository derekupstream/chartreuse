import { SaveOutlined } from '@ant-design/icons';
import { Button, Space, Typography, message } from 'antd';
import { useCallback, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type ReactFlowInstance
} from 'reactflow';
import 'reactflow/dist/style.css';

import type { Variable } from 'lib/dataProducts/variables';

import { VariableModal } from './VariableModal';
import { VariableNode, type VariableNodeData } from './VariableNode';
import { VariableSidebar } from './VariableSidebar';

const { Text } = Typography;

type Factor = {
  id: string;
  name: string;
  currentValue: number;
  unit: string;
};

type Props = {
  productId: string;
  initialVariables: Variable[];
  /** Existing flowDefinitionJson on the data product — preserved on save so legacy designer keeps working */
  initialFlowExtras?: Record<string, unknown>;
  factors: Factor[];
};

const nodeTypes = { variable: VariableNode };

export function VariableBuilder({ productId, initialVariables, initialFlowExtras, factors }: Props) {
  const [variables, setVariables] = useState<Variable[]>(initialVariables);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Variable | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const flowRef = useRef<ReactFlowInstance | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Build ReactFlow nodes from any variable that has a position set
  const initialNodes = useMemo<Node<VariableNodeData>[]>(
    () =>
      initialVariables
        .filter(v => v.position)
        .map(v => ({
          id: v.id,
          type: 'variable',
          position: v.position!,
          data: { variable: v, valuePreview: previewValue(v, factors) }
        })),
    // intentional: only on first render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<VariableNodeData>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  function refreshNodesFor(updated: Variable[]) {
    setNodes(curr =>
      curr
        .filter(n => updated.some(v => v.id === n.id))
        .map(n => {
          const v = updated.find(x => x.id === n.id);
          if (!v) return n;
          return { ...n, data: { variable: v, valuePreview: previewValue(v, factors) } };
        })
    );
  }

  const handleAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (v: Variable) => {
    setEditing(v);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setVariables(prev => prev.filter(v => v.id !== id));
    setNodes(curr => curr.filter(n => n.id !== id));
    setDirty(true);
  };

  const handleSave = (v: Variable) => {
    setVariables(prev => {
      const exists = prev.some(x => x.id === v.id);
      const next = exists ? prev.map(x => (x.id === v.id ? v : x)) : [...prev, v];
      refreshNodesFor(next);
      return next;
    });
    setDirty(true);
    setModalOpen(false);
  };

  // Drag-from-sidebar → drop-on-canvas → place a node for that variable
  const handleSidebarDragStart = useCallback((v: Variable, e: React.DragEvent) => {
    e.dataTransfer.setData('application/x-variable-id', v.id);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleCanvasDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleCanvasDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const variableId = e.dataTransfer.getData('application/x-variable-id');
      if (!variableId || !flowRef.current || !wrapperRef.current) return;
      const v = variables.find(x => x.id === variableId);
      if (!v) return;
      const bounds = wrapperRef.current.getBoundingClientRect();
      const position = flowRef.current.project({
        x: e.clientX - bounds.left,
        y: e.clientY - bounds.top
      });
      // Update the variable's stored position
      setVariables(prev => prev.map(x => (x.id === variableId ? { ...x, position } : x)));
      // Add (or move) the node on the canvas
      setNodes(curr => {
        const existing = curr.find(n => n.id === variableId);
        if (existing) {
          return curr.map(n => (n.id === variableId ? { ...n, position } : n));
        }
        return [
          ...curr,
          {
            id: variableId,
            type: 'variable',
            position,
            data: { variable: v, valuePreview: previewValue(v, factors) }
          }
        ];
      });
      setDirty(true);
    },
    [variables, factors, setNodes]
  );

  // When user drags a node within the canvas, sync the new position back to variables
  const handleNodeDragStop = useCallback((_e: React.MouseEvent, node: Node<VariableNodeData>) => {
    setVariables(prev => prev.map(v => (v.id === node.id ? { ...v, position: node.position } : v)));
    setDirty(true);
  }, []);

  // Click a node on the canvas → open the edit modal so its settings/values are inspectable
  const handleNodeClick = useCallback(
    (_e: React.MouseEvent, node: Node<VariableNodeData>) => {
      const v = variables.find(x => x.id === node.id);
      if (v) {
        setEditing(v);
        setModalOpen(true);
      }
    },
    [variables]
  );

  const persist = async () => {
    setSaving(true);
    try {
      const flowDefinitionJson = {
        ...(initialFlowExtras || {}),
        variables
      };
      const res = await fetch(`/api/admin/data-products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flowDefinitionJson })
      });
      if (!res.ok) throw new Error('Save failed');
      setDirty(false);
      message.success('Saved');
    } catch (err: any) {
      message.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        height: 'calc(100vh - 280px)',
        minHeight: 480,
        border: '1px solid #f0f0f0',
        borderRadius: 6,
        overflow: 'hidden',
        background: '#fff'
      }}
    >
      <VariableSidebar
        variables={variables}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDragStartVariable={handleSidebarDragStart}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            padding: '6px 12px',
            borderBottom: '1px solid #f0f0f0',
            background: '#fafafa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Text type='secondary' style={{ fontSize: 12 }}>
            Drag variables from the sidebar onto the canvas. {variables.length} variable
            {variables.length === 1 ? '' : 's'} defined.
          </Text>
          <Space>
            {dirty && (
              <Text type='warning' style={{ fontSize: 12 }}>
                Unsaved changes
              </Text>
            )}
            <Button
              type='primary'
              icon={<SaveOutlined />}
              size='small'
              onClick={persist}
              loading={saving}
              disabled={!dirty}
            >
              Save
            </Button>
          </Space>
        </div>
        <div ref={wrapperRef} style={{ flex: 1 }} onDragOver={handleCanvasDragOver} onDrop={handleCanvasDrop}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDragStop={handleNodeDragStop}
            onNodeClick={handleNodeClick}
            onInit={instance => (flowRef.current = instance)}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition='bottom-left'
          >
            <Background gap={16} size={1} />
            <Controls />
            <MiniMap pannable zoomable />
          </ReactFlow>
        </div>
      </div>

      <VariableModal
        open={modalOpen}
        initialVariable={editing ?? undefined}
        existingNames={variables.map(v => v.name)}
        factors={factors}
        onSave={handleSave}
        onCancel={() => setModalOpen(false)}
        onDelete={id => {
          handleDelete(id);
          setModalOpen(false);
        }}
      />
    </div>
  );
}

function previewValue(v: Variable, factors: Factor[]): string | undefined {
  if (v.kind === 'constant' && v.constant) {
    if (v.constant.source === 'literal') {
      return v.constant.literalValue !== undefined
        ? `${v.constant.literalValue}${v.constant.literalUnit ? ' ' + v.constant.literalUnit : ''}`
        : undefined;
    }
    if (v.constant.source === 'factor' && v.constant.factorId) {
      const f = factors.find(x => x.id === v.constant!.factorId);
      return f ? `${f.currentValue} ${f.unit}` : undefined;
    }
  }
  if (v.kind === 'user_input' && v.userInput?.defaultValue !== undefined) {
    return `${v.userInput.defaultValue}${v.userInput.unit ? ' ' + v.userInput.unit : ''}`;
  }
  if (v.kind === 'calculation' && v.calculation?.formulaText) {
    return v.calculation.formulaText.length > 24
      ? v.calculation.formulaText.slice(0, 24) + '…'
      : v.calculation.formulaText;
  }
  return undefined;
}
