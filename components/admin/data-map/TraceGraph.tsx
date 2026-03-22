import { useCallback, useEffect, useState } from 'react';

import { Spin } from 'antd';
import type { Edge, Node } from 'reactflow';
import ReactFlow, { Background, Controls, MiniMap, useEdgesState, useNodesState } from 'reactflow';
import 'reactflow/dist/style.css';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

import type { TraceResponse } from './graphLayout';
import { buildTraceGraph } from './graphLayout';
import { NodeDrawer } from './NodeDrawer';
import { TraceNode } from './TraceNode';

interface TraceGraphProps {
  selectedId: string;
}

const nodeTypes = { default: TraceNode };

function getConnectedIds(nodeId: string, edges: Edge[]): Set<string> {
  const ids = new Set<string>([nodeId]);
  // Walk forward and backward from the clicked node
  let changed = true;
  while (changed) {
    changed = false;
    for (const e of edges) {
      if (ids.has(e.source) && !ids.has(e.target)) {
        ids.add(e.target);
        changed = true;
      }
      if (ids.has(e.target) && !ids.has(e.source)) {
        ids.add(e.source);
        changed = true;
      }
    }
  }
  return ids;
}

export function TraceGraph({ selectedId }: TraceGraphProps) {
  const { data, isLoading } = useSWR<TraceResponse>('/api/admin/data-map/periods/' + selectedId + '/trace', fetcher);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [drawerNode, setDrawerNode] = useState<Node | null>(null);
  const [highlightedIds, setHighlightedIds] = useState<Set<string> | null>(null);
  const [baseNodes, setBaseNodes] = useState<Node[]>([]);
  const [baseEdges, setBaseEdges] = useState<Edge[]>([]);

  useEffect(() => {
    if (!data) return;
    const { nodes: n, edges: e } = buildTraceGraph(data);
    setBaseNodes(n);
    setBaseEdges(e);
    setNodes(n);
    setEdges(e);
    setHighlightedIds(null);
  }, [data]);

  // Apply dimming when highlightedIds changes
  useEffect(() => {
    if (!highlightedIds) {
      setNodes(baseNodes);
      setEdges(baseEdges);
      return;
    }

    setNodes(
      baseNodes.map(n => ({
        ...n,
        data: { ...n.data, dimmed: !highlightedIds.has(n.id) }
      }))
    );
    setEdges(
      baseEdges.map(e => ({
        ...e,
        animated: highlightedIds.has(e.source) && highlightedIds.has(e.target) ? e.animated : false,
        style: {
          ...(e.style as Record<string, unknown>),
          opacity: highlightedIds.has(e.source) && highlightedIds.has(e.target) ? 1 : 0.15
        }
      }))
    );
  }, [highlightedIds, baseNodes, baseEdges]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setDrawerNode(node);
      if (highlightedIds?.has(node.id) && highlightedIds.size === getConnectedIds(node.id, baseEdges).size) {
        setHighlightedIds(null);
      } else {
        setHighlightedIds(getConnectedIds(node.id, baseEdges));
      }
    },
    [baseEdges, highlightedIds]
  );

  const handlePaneClick = useCallback(() => {
    setHighlightedIds(null);
  }, []);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Spin size='large' />
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} color='#e8e8e8' />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={n => {
            const style = n.style as Record<string, string> | undefined;
            return style?.background ?? '#f0f0f0';
          }}
          maskColor='rgba(0,0,0,0.05)'
        />
      </ReactFlow>
      <NodeDrawer node={drawerNode} onClose={() => setDrawerNode(null)} />
    </div>
  );
}
