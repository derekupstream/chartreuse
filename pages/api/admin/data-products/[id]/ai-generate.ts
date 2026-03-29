import Anthropic from '@anthropic-ai/sdk';
import type { NextApiResponse } from 'next';

import { CALCULATOR_REGISTRY } from 'lib/admin/calculatorRegistry';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import prisma from 'lib/prisma';

export default handlerWithUser().post(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured.' });
  }

  const { id } = req.query as { id: string };
  const { prompt } = req.body as { prompt: string };
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });

  // Gather context: available factors + calculations
  const factors = await prisma.factor.findMany({
    where: { isActive: true },
    include: { category: { select: { name: true } } },
    orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }]
  });

  const factorSummary = factors
    .map(
      f =>
        `- "${f.name}" (${f.category?.name ?? 'uncategorized'}) = ${f.currentValue} ${f.unit}${f.region ? `, region: ${f.region}` : ''}`
    )
    .join('\n');

  const calcSummary = CALCULATOR_REGISTRY.map(
    c => `- ${c.name}() in ${c.filePath} → outputs: ${c.outputMetrics.join(', ')} [${c.metricCategory}]`
  ).join('\n');

  const systemPrompt = `You are an expert data product designer for ChartReuse, a SaaS platform that calculates environmental and financial impacts of switching from single-use to reusable foodware.

You design node-based data flows using these node types:
- input: Data entering the flow (subtypes: user_input, project_data, api_data, imported_data, baseline_purchasing, forecast_purchasing)
- factor: Governed constants from the Factor Library (subtypes: emission_factor, grid_intensity, utility_rate, material_property, lifespan_assumption)
- calculation: Reusable logic blocks from the Calculations Registry
- aggregation: Combine or reshape data (subtypes: sum, group, merge, normalize, total_by_category)
- comparison: Compare two branches (subtypes: baseline_vs_forecast, scenario_a_vs_b, before_vs_after)
- output: Results (subtypes: metric, dataset, dashboard_feed, report, chart_output)

AVAILABLE FACTORS IN THE SYSTEM:
${factorSummary || '(no factors seeded yet)'}

AVAILABLE CALCULATIONS:
${calcSummary}

When the user describes a data product they want to build, you MUST respond with ONLY a JSON object (no markdown, no explanation before or after) with this exact shape:
{
  "name": "Product Name",
  "description": "What this product does",
  "productType": "calculator|dashboard|scenario|report",
  "nodes": [
    {
      "id": "unique-id",
      "type": "designer",
      "position": { "x": number, "y": number },
      "data": {
        "nodeType": "input|factor|calculation|aggregation|comparison|output",
        "label": "Human Label",
        "subtitle": "Brief description",
        "subtype": "optional subtype from list above",
        "calculationName": "functionName (only for calculation nodes)",
        "factorName": "factor name (only for factor nodes)",
        "metricKey": "key (only for output nodes)",
        "metricUnit": "unit (only for output nodes)"
      }
    }
  ],
  "edges": [
    {
      "id": "e-source-target",
      "source": "source-node-id",
      "target": "target-node-id",
      "animated": true,
      "markerEnd": { "type": "arrowclosed", "color": "#hex" },
      "style": { "stroke": "#hex", "strokeWidth": 2 }
    }
  ],
  "gaps": [
    {
      "type": "missing_factor|missing_calculation|missing_data",
      "description": "What is missing and why it matters",
      "suggestion": "How to address this gap"
    }
  ],
  "reasoning": "Brief explanation of the design decisions and flow structure"
}

IMPORTANT RULES:
- Position nodes in columns left-to-right: inputs (x=0), factors (x=280), calculations (x=560), aggregation (x=840), comparison (x=1080), outputs (x=1340)
- Space nodes vertically by ~110px within each column
- Use these edge colors: input=#52c41a (green), factor=#1677ff (blue), calculation=#fa8c16 (orange), aggregation=#eb2f96 (pink), comparison=#ff4d4f (red), output=#722ed1 (purple)
- Edge color should match the SOURCE node type
- For calculation nodes, use calculationName matching an available calculation from the registry above
- For factor nodes, match factorName to an available factor when possible. If no matching factor exists, still include the node but add a "gap" entry
- Always include a "gaps" array identifying any factors, calculations, or data sources that don't exist yet but would be needed
- The "reasoning" field should explain your design decisions briefly`;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
      system: systemPrompt
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    // Extract JSON from the response (handle potential markdown wrapping)
    let jsonStr = text.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const result = JSON.parse(jsonStr);

    // Save the flow to the data product
    await prisma.dataProductDefinition.update({
      where: { id },
      data: {
        flowDefinitionJson: {
          nodes: result.nodes,
          edges: result.edges,
          viewport: { x: 0, y: 0, zoom: 0.65 }
        },
        ...(result.name && { name: result.name }),
        ...(result.description && { description: result.description }),
        ...(result.productType && { productType: result.productType }),
        updatedByUserId: req.user.id
      }
    });

    res.json({
      nodes: result.nodes,
      edges: result.edges,
      gaps: result.gaps ?? [],
      reasoning: result.reasoning ?? '',
      name: result.name,
      description: result.description
    });
  } catch (err: unknown) {
    console.error('AI generation error:', err);
    const errorMessage = err instanceof Error ? err.message : 'AI generation failed';
    res.status(500).json({ error: errorMessage });
  }
});
