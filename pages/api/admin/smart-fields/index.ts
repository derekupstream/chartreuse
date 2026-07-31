import type { NextApiResponse } from 'next';

import type { EquationToken } from 'lib/smartFields/variables';
import type { NextApiRequestWithUser } from 'lib/middleware';
import { handlerWithUser, requireUpstream } from 'lib/middleware';
import prisma from 'lib/prisma';

const handler = handlerWithUser();
handler.use(requireUpstream);

export type SmartFieldRecord = {
  id: string;
  name: string;
  description: string | null;
  unit: string | null;
  category: string;
  equation: EquationToken[];
  testInputs: Record<string, number>;
  isPublished: boolean;
  updatedAt: string;
};

export type SaveSmartFieldRequest = {
  id?: string;
  name: string;
  description?: string;
  unit?: string;
  category?: string;
  equation: EquationToken[];
  testInputs?: Record<string, number>;
  isPublished?: boolean;
};

/** A reasonable default so a new field lands in the right group without extra thought. */
export function categoryFromUnit(unit?: string | null): string {
  const u = (unit ?? '').toLowerCase();
  if (u.includes('co2') || u.includes('ghg')) return 'GHG';
  if (u.includes('gal') || u.includes('water') || u.includes('liter')) return 'Water';
  if (u.includes('lb') || u.includes('kg') || u.includes('ton') || u.includes('waste')) return 'Waste';
  if (u.includes('$') || u.includes('cost') || u.includes('%') || u.includes('month')) return 'Cost';
  if (u) return 'Operational';
  return 'Other';
}

const toRecord = (f: any): SmartFieldRecord => ({
  id: f.id,
  name: f.name,
  description: f.description,
  unit: f.unit,
  category: f.category ?? 'Other',
  equation: (f.equation as EquationToken[]) ?? [],
  testInputs: (f.testInputs as Record<string, number>) ?? {},
  isPublished: f.isPublished,
  updatedAt: f.updatedAt.toISOString()
});

handler.get(async (_req: NextApiRequestWithUser, res: NextApiResponse) => {
  const fields = await prisma.smartField.findMany({ orderBy: { name: 'asc' } });
  res.json(fields.map(toRecord));
});

handler.post(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const body = req.body as SaveSmartFieldRequest;
  if (!body?.name?.trim()) return res.status(400).json({ error: 'A name is required' });

  const data = {
    name: body.name.trim(),
    description: body.description || null,
    unit: body.unit || null,
    category: body.category || categoryFromUnit(body.unit),
    equation: (body.equation ?? []) as unknown as object,
    testInputs: (body.testInputs ?? {}) as unknown as object,
    isPublished: body.isPublished ?? false,
    createdBy: req.user.id
  };

  try {
    const field = body.id
      ? await prisma.smartField.update({ where: { id: body.id }, data })
      : await prisma.smartField.create({ data });
    res.json(toRecord(field));
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return res.status(409).json({ error: 'A smart field with that name already exists' });
    }
    throw err;
  }
});

handler.delete(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const id = req.query.id as string;
  if (!id) return res.status(400).json({ error: 'id is required' });
  await prisma.smartField.delete({ where: { id } });
  res.json({ ok: true });
});

export default handler;
