import Anthropic from '@anthropic-ai/sdk';
import type { NextApiResponse } from 'next';

import type { ComposedBlock, ComposedScreen, InputFieldDef } from 'lib/products/composed';
import { newBlockId } from 'lib/products/composed';
import { parseEquation } from 'lib/smartFields/console';
import { buildVariableCatalog } from 'lib/smartFields/catalogServer';
import type { NextApiRequestWithUser } from 'lib/middleware';
import { handlerWithUser, requireUpstream } from 'lib/middleware';
import prisma from 'lib/prisma';

/**
 * AI Builder for composed products (spec §9: "AI proposes fields/screens as DRAFTS into
 * the same structures — never executable code"). The model returns a JSON plan: input
 * fields, smart fields written in the console grammar, and screens of known block types.
 * The server VALIDATES every equation with the real parser before anything is saved;
 * an equation that doesn't parse is dropped and reported, never stored.
 */

type AiSmartField = { name: string; unit?: string; category?: string; equation: string; description?: string };
type AiBlock =
  | { kind: 'heading'; text: string }
  | { kind: 'text'; text: string }
  | { kind: 'inputField'; inputKey: string }
  | { kind: 'questionGroup'; title?: string; inputKeys: string[] }
  | { kind: 'smartFieldCard'; fieldName: string; label?: string }
  | { kind: 'button'; label: string; action: 'next' | 'back' | 'submit' };
type AiPlan = {
  description?: string;
  inputFields: InputFieldDef[];
  smartFields: AiSmartField[];
  screens: { title: string; blocks: AiBlock[] }[];
};

export type AiComposeResponse =
  | { ok: false; error: string }
  | {
      ok: true;
      createdFields: string[];
      updatedFields: string[];
      droppedFields: { name: string; error: string }[];
      screenCount: number;
    };

const handler = handlerWithUser();
handler.use(requireUpstream);

handler.post(async (req: NextApiRequestWithUser, res: NextApiResponse<AiComposeResponse>) => {
  if (!process.env.ANTHROPIC_API_KEY)
    return res.status(500).json({ ok: false, error: 'ANTHROPIC_API_KEY not configured' });
  const { productId, prompt, mode } = req.body as { productId: string; prompt: string; mode: 'new' | 'modify' };
  if (!productId || !prompt?.trim())
    return res.status(400).json({ ok: false, error: 'A product id and a prompt are required' });

  const product = await prisma.dataProductDefinition.findUnique({ where: { id: productId } });
  if (!product) return res.status(404).json({ ok: false, error: 'Product not found' });

  const [catalog, existingFields] = await Promise.all([
    buildVariableCatalog(),
    prisma.smartField.findMany({ where: { isPublished: true }, select: { id: true, name: true, unit: true } })
  ]);
  const catalogLines = catalog
    .filter(v => v.category !== 'Products')
    .slice(0, 160)
    .map(v => `${v.key} (${v.category}${v.unit ? `, ${v.unit}` : ''}) — ${v.label}`)
    .join('\n');

  const system = `You design "composed products" for Chart-Reuse, a reuse-impact platform.
Return ONLY a JSON object, no prose, matching exactly:
{
  "description": string,
  "inputFields": [{ "key": camelCase, "label": string, "type": "number"|"currency"|"group", "unit"?: string, "help"?: string, "columns"?: [{ "key": camelCase, "label": string, "type": "number"|"currency"|"text" }] }],
  "smartFields": [{ "name": string, "unit"?: string, "category"?: "GHG"|"Water"|"Waste"|"Cost"|"Operational"|"Other", "description"?: string, "equation": string }],
  "screens": [{ "title": string, "blocks": [
      { "kind": "heading", "text": string } |
      { "kind": "text", "text": string } |
      { "kind": "inputField", "inputKey": string } |
      { "kind": "questionGroup", "title"?: string, "inputKeys": string[] } |
      { "kind": "smartFieldCard", "fieldName": string, "label"?: string } |
      { "kind": "button", "label": string, "action": "next"|"back"|"submit" } ] }]
}
EQUATION GRAMMAR (the only math allowed): numbers, + - * / ( ), variable keys, and SUM(listKey, per-row math). Inside SUM, names resolve to the list's columns first. Example: "SUM(products, cases * unitsPerCase) * 52".
Rules: every inputKey and SUM list key must exist in inputFields (SUM keys as type "group" with the columns the math uses). Every smartFieldCard fieldName must be in smartFields (or an existing field listed below). Reuse catalog variables where they fit. Last screen should show results and end with a submit button; earlier screens end with a next button. 2-4 screens.
CATALOG VARIABLES (reusable in equations):
${catalogLines}
EXISTING SMART FIELDS (reusable on cards by name): ${existingFields.map(f => f.name).join('; ') || 'none'}`;

  const current =
    mode === 'modify'
      ? `\nCURRENT DEFINITION (modify it, keep what still fits):\n${JSON.stringify({ inputFields: (product.inputSchemaJson as any)?.fields ?? [], screens: (product.screensJson as any)?.screens ?? [] })}`
      : '';

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 8000,
    system,
    messages: [{ role: 'user', content: `Product name: ${product.name}\n${prompt}${current}` }]
  });
  const text = response.content
    .map(part => (part.type === 'text' ? part.text : ''))
    .join('')
    .trim();

  let plan: AiPlan;
  try {
    plan = JSON.parse(text.replace(/^```(json)?/i, '').replace(/```$/, ''));
  } catch {
    return res.status(422).json({ ok: false, error: 'The AI response was not valid JSON — try rephrasing the prompt' });
  }

  // ── validate + save smart fields (parser is the gatekeeper) ─────────────────
  const createdFields: string[] = [];
  const updatedFields: string[] = [];
  const droppedFields: { name: string; error: string }[] = [];
  const fieldIdByName = new Map(existingFields.map(f => [f.name.toLowerCase(), f.id]));

  for (const field of plan.smartFields ?? []) {
    const parsed = parseEquation(field.equation ?? '');
    if (!parsed.ok || !parsed.tokens.length) {
      droppedFields.push({ name: field.name, error: parsed.ok ? 'empty equation' : parsed.error });
      continue;
    }
    const data = {
      description: field.description ?? null,
      unit: field.unit ?? null,
      category: field.category ?? 'Other',
      equation: parsed.tokens as object[],
      isPublished: true,
      createdBy: req.user.id
    };
    const existing = await prisma.smartField.findUnique({ where: { name: field.name } });
    if (existing) {
      await prisma.smartField.update({ where: { id: existing.id }, data });
      fieldIdByName.set(field.name.toLowerCase(), existing.id);
      updatedFields.push(field.name);
    } else {
      const created = await prisma.smartField.create({ data: { ...data, name: field.name } });
      fieldIdByName.set(field.name.toLowerCase(), created.id);
      createdFields.push(field.name);
    }
  }

  // ── map screens onto real block shapes, dropping anything that points nowhere ─
  const inputKeys = new Set((plan.inputFields ?? []).map(f => f.key));
  const screens: ComposedScreen[] = (plan.screens ?? []).map(screen => ({
    id: newBlockId(),
    title: screen.title || 'Screen',
    blocks: (screen.blocks ?? [])
      .map((block): ComposedBlock | null => {
        if (block.kind === 'heading' || block.kind === 'text')
          return { id: newBlockId(), kind: block.kind, text: block.text ?? '' };
        if (block.kind === 'inputField')
          return inputKeys.has(block.inputKey)
            ? { id: newBlockId(), kind: 'inputField', inputKey: block.inputKey }
            : null;
        if (block.kind === 'questionGroup')
          return {
            id: newBlockId(),
            kind: 'questionGroup',
            title: block.title,
            inputKeys: (block.inputKeys ?? []).filter(k => inputKeys.has(k))
          };
        if (block.kind === 'smartFieldCard') {
          const fieldId = fieldIdByName.get((block.fieldName ?? '').toLowerCase());
          return fieldId
            ? { id: newBlockId(), kind: 'smartFieldCard', smartFieldId: fieldId, label: block.label }
            : null;
        }
        if (block.kind === 'button')
          return { id: newBlockId(), kind: 'button', label: block.label || 'Continue', action: block.action ?? 'next' };
        return null;
      })
      .filter((b): b is ComposedBlock => b !== null)
  }));

  await prisma.dataProductDefinition.update({
    where: { id: productId },
    data: {
      ...(plan.description ? { description: plan.description } : {}),
      inputSchemaJson: { fields: plan.inputFields ?? [] } as object,
      screensJson: { screens } as object,
      updatedByUserId: req.user.id
    }
  });

  res.json({ ok: true, createdFields, updatedFields, droppedFields, screenCount: screens.length });
});

export default handler;
