import dagre from '@dagrejs/dagre';
import type { Edge, Node } from 'reactflow';

import { DESIGNER_NODE_HEIGHT, DESIGNER_NODE_WIDTH } from './nodes/nodeTypes';

/**
 * Apply dagre LR auto-layout to designer nodes.
 * Follows the same pattern as components/admin/data-map/systemGraphLayout.ts.
 */
export function autoLayoutNodes(nodes: Node[], edges: Edge[]): Node[] {
  if (nodes.length === 0) return nodes;

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 50, ranksep: 120 });

  for (const node of nodes) {
    g.setNode(node.id, { width: DESIGNER_NODE_WIDTH, height: DESIGNER_NODE_HEIGHT });
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  return nodes.map(node => {
    const pos = g.node(node.id);
    if (!pos) return node;
    return {
      ...node,
      position: {
        x: pos.x - DESIGNER_NODE_WIDTH / 2,
        y: pos.y - DESIGNER_NODE_HEIGHT / 2
      }
    };
  });
}
