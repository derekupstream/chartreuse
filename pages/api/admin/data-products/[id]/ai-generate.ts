import Anthropic from '@anthropic-ai/sdk';
import type { NextApiResponse } from 'next';

import { CALCULATOR_REGISTRY } from 'lib/admin/calculatorRegistry';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import prisma from 'lib/prisma';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Convert simple `{heading, body}[]` sections to TipTap JSON doc used by MethodologyDocument.content */
function sectionsToTipTapDoc(sections: Array<{ heading: string; body: string }>) {
  const content: unknown[] = [];
  for (const section of sections) {
    if (section.heading) {
      content.push({
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: section.heading }]
      });
    }
    const paragraphs = (section.body ?? '').split(/\n{2,}/).filter(p => p.trim());
    for (const para of paragraphs) {
      content.push({
        type: 'paragraph',
        content: [{ type: 'text', text: para.trim() }]
      });
    }
  }
  return { type: 'doc', content };
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ─── Handler ────────────────────────────────────────────────────────────────

export default handlerWithUser().post(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured.' });
  }

  const { id } = req.query as { id: string };
  const {
    prompt,
    designType = 'calculator',
    designMode = 'new'
  } = req.body as {
    prompt: string;
    designType?: 'model' | 'calculator' | 'dashboard' | 'workflow';
    designMode?: 'new' | 'modify';
  };
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });

  // For modify mode we load the existing product and pass it as context so the AI
  // makes targeted edits instead of regenerating from scratch.
  const existing =
    designMode === 'modify'
      ? await prisma.dataProductDefinition.findUnique({
          where: { id },
          select: {
            name: true,
            description: true,
            productType: true,
            flowDefinitionJson: true,
            inputSchemaJson: true,
            outputSchemaJson: true,
            executionCode: true
          }
        })
      : null;

  const TYPE_GUIDANCE: Record<string, string> = {
    model:
      'You are designing a MODEL: a math + I/O contract. Focus on a clean, deterministic flow graph (inputs → factors → calculations → outputs). The "Calculator" interactive surface is built on top of this Model — but right now you are defining the Model itself, not the UI around it.',
    calculator:
      'You are designing a CALCULATOR: a Model wrapped in an interactive form-style surface. Inputs schema should be ergonomic for users to fill in (sensible labels, units, defaults). Outputs should be the headline metrics a user reads at a glance. Execution logic must be live and synchronous.',
    dashboard:
      'You are designing a DASHBOARD: a presentation of computed results, often aggregated across multiple instances. De-emphasize input forms; emphasize layout, output groupings, and how a viewer reads the story. Execution code may be omitted if the dashboard is purely presentational over upstream data.',
    workflow:
      'You are designing a WORKFLOW: a user journey that strings together Models, Calculators, and Dashboards. Output a flow that represents the SEQUENCE OF STEPS a user moves through (e.g., "create org → add inputs → see projection → save snapshot → share dashboard"), not a math computation graph. Each node should be a step in the journey or a tool the user touches at that step.'
  };

  const MODE_GUIDANCE =
    designMode === 'modify'
      ? `MODIFY MODE: You are receiving an existing product definition below. Make MINIMAL TARGETED CHANGES. Preserve every field, node, edge, schema entry, and code line EXACTLY AS-IS unless the user's prompt explicitly asks to change it. If the user asks to rename a field, only rename that field. If they ask to add a metric, only add that metric. Do not regenerate the whole product. Return the FULL product JSON with your edits applied — do not return a diff.

EXISTING PRODUCT:
${JSON.stringify(existing ?? {}, null, 2)}`
      : 'CREATE MODE: Generate a fresh design from scratch.';

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

${TYPE_GUIDANCE[designType] ?? TYPE_GUIDANCE.calculator}

${MODE_GUIDANCE}


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
        "metricUnit": "unit (only for output nodes)",
        "hasGap": "boolean — OMIT unless this node represents estimated/substituted data (see DATA GAP RULES)",
        "gapReason": "string, ≤80 chars — required when hasGap is true"
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
  "inputSchema": {
    "fields": [
      {
        "key": "camelCaseKey",
        "label": "Human Label",
        "type": "number|text|select",
        "unit": "optional unit (e.g. students, meals/day, $)",
        "defaultValue": number or string,
        "min": optional number,
        "max": optional number,
        "helpText": "short description",
        "options": [{ "value": "a", "label": "A" }]
      }
    ]
  },
  "outputSchema": {
    "metrics": [
      {
        "key": "camelCaseKey",
        "label": "Human Label",
        "unit": "unit (e.g. MTCO2e, USD, gallons)",
        "description": "what this metric represents",
        "format": "number|currency|percent",
        "decimals": 0
      }
    ]
  },
  "executionCode": "JavaScript function BODY that takes a single argument named 'inputs' (object keyed by inputSchema field keys) and returns an object keyed by outputSchema metric keys. Must be pure, synchronous, deterministic. Bake factor values in as literal numbers (pulled from the AVAILABLE FACTORS list above). Use 'const' / 'let' for locals. Do NOT reference any external variables. Example: 'const students = Number(inputs.students) || 0; const mealsPerDay = Number(inputs.mealsPerDay) || 0; const annualMeals = students * mealsPerDay * 180; const co2PerSingleUse = 0.015; const co2PerReusable = 0.003; const ghgSavings = annualMeals * (co2PerSingleUse - co2PerReusable) / 1000; const costPerSingleUse = 0.12; const annualCostSavings = annualMeals * (costPerSingleUse - 0.02); return { ghgSavings, annualCostSavings, traysDisplaced: annualMeals };'",
  "methodology": {
    "title": "Methodology document title",
    "sections": [
      { "heading": "Overview", "body": "Plain text paragraph(s). Use blank lines to separate paragraphs." },
      { "heading": "Inputs", "body": "..." },
      { "heading": "Calculation Steps", "body": "..." },
      { "heading": "Factors Used", "body": "..." },
      { "heading": "Assumptions", "body": "..." },
      { "heading": "Limitations", "body": "..." }
    ]
  },
  "gaps": [
    {
      "type": "missing_factor|missing_calculation|missing_data",
      "description": "What is missing and why it matters",
      "suggestion": "How to address this gap"
    }
  ],
  "reasoning": "Brief explanation of the design decisions and flow structure"
}

DATA GAP RULES (drives the red notification dot in the designer):
- Only factor nodes and calculation nodes can be gap nodes. Never tag inputs, aggregations, comparisons, or outputs — even if they consume a gap upstream.
- A factor node is a gap node in ANY of these cases:
  (a) You invented a numeric value for it because no matching factor exists, OR
  (b) You picked a close-but-imperfect factor as a substitute (e.g. using a generic paper factor when the real use case needs a PLA-lined paper factor) — still a gap because the number is approximate.
- A calculation node is a gap node in ANY of these cases:
  (a) You invented math inline because no matching function exists in AVAILABLE CALCULATIONS, OR
  (b) You picked a close function but its inputs/outputs don't perfectly match the intended calculation.
- A factor or calculation node fully backed by an exact library match with correct semantics must NOT have hasGap set.
- gapReason must be concise and user-facing (≤80 chars). Example: "Approximated with generic paper factor — specific PLA-liner factor not in library".
- Every entry in the top-level "gaps" array should correspond to at least one tagged node (and vice versa) so the bottom gap list and the node badges agree.

IMPORTANT RULES:
- Position nodes in columns left-to-right: inputs (x=0), factors (x=280), calculations (x=560), aggregation (x=840), comparison (x=1080), outputs (x=1340)
- Space nodes vertically by ~110px within each column
- Use these edge colors: input=#52c41a (green), factor=#1677ff (blue), calculation=#fa8c16 (orange), aggregation=#eb2f96 (pink), comparison=#ff4d4f (red), output=#722ed1 (purple)
- Edge color should match the SOURCE node type
- For calculation nodes, use calculationName matching an available calculation from the registry above
- For factor nodes, match factorName to an available factor when possible. If no matching factor exists, still include the node but add a "gap" entry
- Always include a "gaps" array identifying any factors, calculations, or data sources that don't exist yet but would be needed
- inputSchema.fields keys MUST match the variable names referenced in executionCode via inputs.KEY
- outputSchema.metrics keys MUST match the keys returned from executionCode
- Every output metric MUST have a corresponding output node in the nodes array (with matching metricKey)
- Every input field SHOULD have a corresponding input node in the nodes array
- executionCode must be production-safe: only arithmetic, Math.*, Number(), parseFloat(), conditionals, loops. No eval, no fetch, no require, no imports
- Bake real factor values as literal numbers in executionCode (read them from AVAILABLE FACTORS list, or use defensible estimates if missing and add a gap)
- The "reasoning" field should explain your design decisions briefly`;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 12000,
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

    // ── Create or reuse a MethodologyDocument ─────────────────────────────
    let methodologyDocumentId: string | undefined;
    if (result.methodology?.title && Array.isArray(result.methodology?.sections)) {
      const title: string = result.methodology.title;
      const baseSlug = slugify(title) || `methodology-${id.slice(0, 8)}`;
      // Ensure slug uniqueness
      const existing = await prisma.methodologyDocument.findUnique({ where: { slug: baseSlug } });
      const finalSlug = existing ? `${baseSlug}-${Date.now()}` : baseSlug;
      const tiptap = sectionsToTipTapDoc(result.methodology.sections);
      const doc = await prisma.methodologyDocument.create({
        data: {
          title,
          slug: finalSlug,
          content: tiptap as any,
          status: 'draft',
          sectionNumber: ''
        }
      });
      methodologyDocumentId = doc.id;
    }

    // ── Save everything to the data product ───────────────────────────────
    await prisma.dataProductDefinition.update({
      where: { id },
      data: {
        flowDefinitionJson: {
          nodes: result.nodes ?? [],
          edges: result.edges ?? [],
          viewport: { x: 0, y: 0, zoom: 0.65 },
          gaps: result.gaps ?? [],
          reasoning: result.reasoning ?? ''
        },
        ...(result.inputSchema && { inputSchemaJson: result.inputSchema }),
        ...(result.outputSchema && { outputSchemaJson: result.outputSchema }),
        ...(typeof result.executionCode === 'string' && { executionCode: result.executionCode }),
        ...(methodologyDocumentId && { methodologyDocumentId }),
        ...(result.name && { name: result.name }),
        ...(result.description && { description: result.description }),
        ...(result.productType && { productType: result.productType }),
        updatedByUserId: req.user.id
      }
    });

    res.json({
      nodes: result.nodes ?? [],
      edges: result.edges ?? [],
      inputSchema: result.inputSchema ?? null,
      outputSchema: result.outputSchema ?? null,
      executionCode: result.executionCode ?? null,
      methodologyDocumentId: methodologyDocumentId ?? null,
      methodologyTitle: result.methodology?.title ?? null,
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
