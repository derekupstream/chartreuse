import Anthropic from '@anthropic-ai/sdk';
import type { NextApiResponse } from 'next';

import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import prisma from 'lib/prisma';

const VENUE_PROMPTS = [
  'a 250-customer/day fast-casual restaurant in Texas',
  'a 1200-meal/day cafeteria in a midsize college in Oregon',
  'a 80-customer/day independent coffee shop in Massachusetts',
  'a stadium food hall stand serving event traffic in Colorado',
  'a 600-meal/day K-12 elementary school in Florida',
  'a 400-customer/day brewpub in Vermont with an attached restaurant'
];

/**
 * Returns a plausible in-memory inventory for testing. Loads the most recent
 * reference golden dataset for the requested category, then asks Claude to mutate
 * its values (state, quantities, costs, names) to represent a chosen venue type.
 * Structure is preserved exactly — only field values change.
 *
 * The result is NOT persisted; the caller can save it as a new dataset if desired.
 */
export default handlerWithUser().post(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  const { category = 'default', venueDescription } = req.body as {
    category?: string;
    venueDescription?: string;
  };

  const reference = await prisma.goldenDataset.findFirst({
    where: { category, isActive: true },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, inputs: true }
  });

  if (!reference) {
    return res.status(404).json({
      error: `No reference golden dataset found for category "${category}". Seed one first via scripts/seed-projections-golden-dataset.ts.`
    });
  }

  const venue = venueDescription || VENUE_PROMPTS[Math.floor(Math.random() * VENUE_PROMPTS.length)];

  const systemPrompt = `You are generating test fixture data for ChartReuse, a SaaS calculator for foodware reuse savings.

You will receive a JSON inventory object that the calculator engine consumes. Your job is to produce a MODIFIED version representing a different venue, while preserving the exact structure (every key path and array length must remain identical — do not add, remove, or rename fields).

Modify these values to reflect the venue:
- Top-level: state (must be a US state name like "Texas")
- Top-level utilityRates.gas, utilityRates.electric, utilityRates.water (small adjustments fitting the state)
- For each item in singleUseItems: caseCost, casesPurchased, newCaseCost, newCasesPurchased, unitsPerCase
- For each item in reusableItems: caseCost, casesPurchased, newCasesPurchased, newCaseCost, unitsPerCase, annualRepurchasePercentage (between 0 and 1, representing percent lost/replaced annually)
- For each dishwasher: racksPerDay, newRacksPerDay, operatingDays, newOperatingDays
- For each laborCost: cost
- For each otherExpense: cost
- For each wasteHauling item: monthlyCost, newMonthlyCost

Do NOT change: any id, projectId, productId, categoryId, or product objects. Keep all enum-like values (frequency, fuelType, type, temperature, wasteStream, serviceType, energyStarCertified, etc.) exactly as they are. Keep array lengths the same.

All numeric values must be positive and plausible for the venue.

Return ONLY the modified JSON object. No prose, no markdown, no explanation.`;

  const userPrompt = `Venue: ${venue}

Inventory to modify (preserve structure, change values):

${JSON.stringify(reference.inputs, null, 2)}`;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let parsed: unknown;
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt
    });
    let text = response.content[0].type === 'text' ? response.content[0].text : '';
    text = text.trim();
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    parsed = JSON.parse(text);
  } catch (err: any) {
    return res.status(502).json({
      error: `AI generation failed: ${err?.message ?? 'unknown error'}. Falling back to reference may help.`
    });
  }

  // Sanity check: top-level keys must match reference shape.
  if (!parsed || typeof parsed !== 'object') {
    return res.status(502).json({ error: 'AI response was not a JSON object' });
  }
  const refKeys = Object.keys(reference.inputs as Record<string, unknown>).sort();
  const newKeys = Object.keys(parsed as Record<string, unknown>).sort();
  const missingKeys = refKeys.filter(k => !newKeys.includes(k));
  if (missingKeys.length) {
    return res.status(502).json({
      error: `AI response is missing required keys: ${missingKeys.join(', ')}`
    });
  }

  res.json({
    inventory: parsed,
    venue,
    source: { id: reference.id, name: reference.name }
  });
});
