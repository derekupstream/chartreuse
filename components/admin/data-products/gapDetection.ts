import type { Edge, Node } from 'reactflow';

import type { DesignerNodeData } from './nodes/DesignerNode';

type FactorSummary = { name: string };
type CalcSummary = { name: string };

/**
 * Derive "data gap" annotations — only for nodes that are themselves fabricated
 * or broken references. We do NOT propagate gap flags downstream; only the
 * factor/calculation nodes with made-up data get the red dot.
 *
 * Two sources of gap truth, merged:
 *  1. **AI-tagged gaps** — the AI Designer sets `data.hasGap` + `data.gapReason`
 *     on factor/calculation nodes it invented or substituted. These capture
 *     *semantic* gaps (close-but-imperfect) that name matching can never detect.
 *  2. **Name-mismatch gaps** — any factor node whose factorName is not in the
 *     current Factor Library, or calculation node whose calculationName is not
 *     in the Calculator Registry. Catches broken references after renames and
 *     self-resolves when a missing factor is added to the library.
 */
export function annotateGaps(
  nodes: Node<DesignerNodeData>[],
  _edges: Edge[],
  factors: FactorSummary[],
  calculations: CalcSummary[]
): Node<DesignerNodeData>[] {
  const factorNames = new Set(factors.map(f => f.name.trim().toLowerCase()));
  const calcNames = new Set(calculations.map(c => c.name.trim().toLowerCase()));

  return nodes.map(node => {
    const data: DesignerNodeData = { ...node.data };

    // Only factor and calculation nodes can be gap sources.
    // Inputs/aggregations/comparisons/outputs: never marked (even if downstream of a gap).
    if (data.nodeType !== 'factor' && data.nodeType !== 'calculation') {
      data.hasGap = false;
      data.gapReason = undefined;
      return { ...node, data };
    }

    // Preserve AI-set flag if present; otherwise check for broken reference.
    if (!data.hasGap) {
      if (data.nodeType === 'factor' && data.factorName) {
        if (!factorNames.has(data.factorName.trim().toLowerCase())) {
          data.hasGap = true;
          data.gapReason = `Factor "${data.factorName}" is not in the Factor Library — reference is broken.`;
        }
      } else if (data.nodeType === 'calculation' && data.calculationName) {
        if (!calcNames.has(data.calculationName.trim().toLowerCase())) {
          data.hasGap = true;
          data.gapReason = `Calculation "${data.calculationName}()" is not in the Calculator Registry — reference is broken.`;
        }
      }
    }

    return { ...node, data };
  });
}
