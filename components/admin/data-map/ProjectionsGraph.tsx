import { useCallback, useEffect, useMemo, useState } from 'react';

import { Spin, Typography } from 'antd';
import type { Edge, Node } from 'reactflow';
import ReactFlow, { Background, Controls, MiniMap, useEdgesState, useNodesState } from 'reactflow';
import 'reactflow/dist/style.css';
import useSWR from 'swr';

import { NodeDrawer } from './NodeDrawer';
import type { ProjectionsTraceResponse } from './projectionsGraphLayout';
import { buildProjectionsGraph } from './projectionsGraphLayout';
import type { ProjectRow } from './ProjectsFeedPanel';
import { ProjectsFeedPanel } from './ProjectsFeedPanel';
import { TraceNode } from './TraceNode';
import { getConnectedEdges, getConnectedPath } from './systemGraphLayout';

const fetcher = (url: string) => fetch(url).then(r => r.json());
const nodeTypes = { default: TraceNode };

interface Props {
  projects: ProjectRow[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
}

export function ProjectionsGraph({ projects, selectedProjectId, onSelectProject }: Props) {
  const { data: traceData, isLoading } = useSWR<ProjectionsTraceResponse>(
    selectedProjectId ? `/api/admin/data-map/projections-trace?projectId=${selectedProjectId}` : null,
    fetcher
  );

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [drawerNode, setDrawerNode] = useState<Node | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [rawNodes, setRawNodes] = useState<Node[]>([]);
  const [rawEdges, setRawEdges] = useState<Edge[]>([]);

  useEffect(() => {
    if (!traceData?.project) return;
    const { nodes: n, edges: e } = buildProjectionsGraph(traceData);
    setRawNodes(n);
    setRawEdges(e);
    setSelectedNodeId(null);
    setDrawerNode(null);
  }, [traceData]);

  const highlightedGraph = useMemo(() => {
    if (!selectedNodeId) return { nodes: rawNodes, edges: rawEdges };
    const connectedNodes = getConnectedPath(selectedNodeId, rawEdges);
    const connectedEdgeIds = getConnectedEdges(connectedNodes, rawEdges);
    return {
      nodes: rawNodes.map(n => {
        const isConnected = connectedNodes.has(n.id);
        return { ...n, data: { ...n.data, dimmed: !isConnected } };
      }),
      edges: rawEdges.map(e => {
        const isConnected = connectedEdgeIds.has(e.id);
        return {
          ...e,
          animated: isConnected,
          style: { ...e.style, strokeWidth: isConnected ? 3 : 1, opacity: isConnected ? 1 : 0.15 }
        };
      })
    };
  }, [selectedNodeId, rawNodes, rawEdges]);

  useEffect(() => {
    setNodes(highlightedGraph.nodes);
    setEdges(highlightedGraph.edges);
  }, [highlightedGraph]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (selectedNodeId === node.id) {
        setSelectedNodeId(null);
        setDrawerNode(null);
      } else {
        setSelectedNodeId(node.id);
        setDrawerNode(node);
      }
    },
    [selectedNodeId]
  );

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setDrawerNode(null);
  }, []);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px - 46px - 46px)', overflow: 'hidden' }}>
      <div style={{ width: '38%', borderRight: '1px solid #f0f0f0', overflow: 'auto', padding: '16px' }}>
        <Typography.Title level={4} style={{ marginTop: 0 }}>
          All Projects
        </Typography.Title>
        <ProjectsFeedPanel
          projects={projects}
          selectedId={selectedProjectId}
          onSelect={onSelectProject}
          mode='projections'
        />
      </div>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Spin size='large' />
          </div>
        )}
        {!isLoading && !selectedProjectId && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography.Text type='secondary'>Select a project to view its projections trace</Typography.Text>
          </div>
        )}
        {(traceData as any)?.error && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography.Text type='danger'>API error: {(traceData as any).error}</Typography.Text>
          </div>
        )}
        {!isLoading && selectedProjectId && traceData?.project && !(traceData as any)?.error && (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            onPaneClick={handlePaneClick}
            fitView
            fitViewOptions={{ padding: 0.2 }}
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        )}
      </div>
      <NodeDrawer
        node={drawerNode}
        onClose={() => {
          setDrawerNode(null);
          setSelectedNodeId(null);
        }}
      />
    </div>
  );
}
