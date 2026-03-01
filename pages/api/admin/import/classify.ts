import Anthropic from '@anthropic-ai/sdk';
import type { NextApiResponse } from 'next';

import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import prisma from 'lib/prisma';

export type ColumnMapping = {
  sourceColumn: string;
  targetField: string;
  confidence: number;
  notes: string;
};

export type ClassifyResult = {
  dataType: 'single-use-products' | 'reusable-products' | 'golden-dataset' | 'project-data' | 'unknown';
  confidence: number;
  mappings: ColumnMapping[];
  sessionId?: string;
};

const FIELD_DEFINITIONS: Record<string, string[]> = {
  'single-use-products': [
    'productId (string: product identifier/SKU)',
    'caseCost (number, USD: cost per case)',
    'casesPurchased (number: cases purchased per period)',
    'newCaseCost (number, USD: new cost per case after switch; can match caseCost)',
    'newCasesPurchased (number: new quantity; can match casesPurchased)',
    'unitsPerCase (number: items per case)',
    'frequency (string: "monthly", "weekly", "yearly", "annually")'
  ],
  'reusable-products': [
    'productId (string: product identifier/SKU)',
    'productName (string: human-readable product name)',
    'caseCost (number, USD: cost per case)',
    'casesPurchased (number: cases purchased)',
    'unitsPerCase (number: units per case)',
    'annualRepurchasePercentage (number: 0.0-1.0, percentage replaced per year)'
  ],
  'golden-dataset': [
    'name (string: dataset name)',
    'category (string: dataset category)',
    'tolerance (number: 0.0-1.0, acceptable deviation, e.g. 0.02)',
    'Any key-value pairs representing calculator inputs (stored as JSON)'
  ],
  'project-data': [
    'name (string: project name)',
    'state (string: 2-letter US state code)',
    'eventGuestCount (number: guests per event)'
  ]
};

export default handlerWithUser().post(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  if (!process.env.ANTHROPIC_API_KEY) {
    return res
      .status(500)
      .json({ error: 'ANTHROPIC_API_KEY not configured. Restart the dev server after adding it to .env.local.' });
  }

  const {
    headers,
    sampleRows,
    fileName = 'unknown',
    totalRows = 0
  } = req.body as {
    headers: string[];
    sampleRows: string[][];
    fileName?: string;
    totalRows?: number;
  };

  if (!headers?.length) return res.status(400).json({ error: 'headers required' });

  // Create a session record to track this import
  const session = await prisma.importSession.create({
    data: {
      userId: req.user.id,
      fileName,
      totalRows,
      status: 'classifying'
    }
  });

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const fieldDescriptions = Object.entries(FIELD_DEFINITIONS)
    .map(([type, fields]) => `**${type}**:\n${fields.map(f => `  - ${f}`).join('\n')}`)
    .join('\n\n');

  const samplePreview = sampleRows
    .slice(0, 5)
    .map((row, i) => `Row ${i + 1}: ${row.map((v, j) => `${headers[j]}=${JSON.stringify(v)}`).join(', ')}`)
    .join('\n');

  const prompt = `You are a data import assistant for ChartReuse, a foodware sustainability calculator app.

Analyze the CSV headers and sample rows below, then return ONLY valid JSON (no markdown, no explanation).

Target data types and their fields:

${fieldDescriptions}

CSV Headers: ${JSON.stringify(headers)}

Sample rows:
${samplePreview}

Return JSON in exactly this format:
{
  "dataType": "single-use-products" | "reusable-products" | "golden-dataset" | "project-data" | "unknown",
  "confidence": <0.0 to 1.0>,
  "mappings": [
    {
      "sourceColumn": "<header name>",
      "targetField": "<target field name or empty string to ignore>",
      "confidence": <0.0 to 1.0>,
      "notes": "<brief explanation>"
    }
  ]
}

Include one mapping entry per header. Use empty string for targetField if the column should be ignored.`;

  let rawText = '';
  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    });
    rawText = message.content[0].type === 'text' ? message.content[0].text : '';
  } catch (err: any) {
    console.error('[classify] Anthropic API error:', err?.message ?? err);
    await prisma.importSession.update({
      where: { id: session.id },
      data: { status: 'failed' }
    });
    return res.status(500).json({ error: `Anthropic API error: ${err?.message ?? 'Unknown error'}` });
  }

  let result: Omit<ClassifyResult, 'sessionId'>;
  try {
    result = JSON.parse(rawText.trim());
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) {
      console.error('[classify] Could not parse AI response:', rawText.slice(0, 200));
      await prisma.importSession.update({ where: { id: session.id }, data: { status: 'failed' } });
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }
    try {
      result = JSON.parse(match[0]);
    } catch {
      await prisma.importSession.update({ where: { id: session.id }, data: { status: 'failed' } });
      return res.status(500).json({ error: 'Failed to parse AI response JSON' });
    }
  }

  // Update session with classification results
  await prisma.importSession.update({
    where: { id: session.id },
    data: {
      dataType: result.dataType,
      confidence: result.confidence,
      mappings: result.mappings as any,
      status: 'mapped'
    }
  });

  res.json({ ...result, sessionId: session.id });
});
