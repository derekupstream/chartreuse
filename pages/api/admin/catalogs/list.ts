import type { NextApiResponse } from 'next';

import { getReusableProducts } from 'lib/inventory/assets/reusables/getReusableProducts';
import { getSingleUseProducts } from 'lib/inventory/getSingleUseProducts';
import { handlerWithUser } from 'lib/middleware';
import type { NextApiRequestWithUser } from 'lib/middleware';
import { requireUpstream } from 'lib/middleware/requireUpstream';

export type CatalogSource = 'single_use' | 'reusable';

export type CatalogProductSummary = {
  id: string;
  label: string;
  category: string;
  // Only numeric fields surfaced as pickable for constants
  numericFields: { key: string; label: string; value: number; unit?: string }[];
};

export type CatalogListResponse = {
  source: CatalogSource;
  items: CatalogProductSummary[];
};

const NUMERIC_FIELD_LABELS: Record<keyof CommonNumericFields, { label: string; unit?: string }> = {
  boxWeight: { label: 'Box weight', unit: 'lbs' },
  boxWeightPerItem: { label: 'Box weight per item', unit: 'lbs' },
  itemWeight: { label: 'Item weight', unit: 'lbs' },
  primaryMaterialWeightPerUnit: { label: 'Primary material weight', unit: 'lbs' },
  secondaryMaterialWeightPerUnit: { label: 'Secondary material weight', unit: 'lbs' },
  reusableItemCountPerRack: { label: 'Items per rack' }
};

type CommonNumericFields = {
  boxWeight: number;
  boxWeightPerItem?: number;
  itemWeight: number;
  primaryMaterialWeightPerUnit: number;
  secondaryMaterialWeightPerUnit: number;
  reusableItemCountPerRack?: number;
};

const handler = handlerWithUser().use(requireUpstream);

handler.get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const source = (req.query.source as CatalogSource) || 'single_use';
  const products =
    source === 'reusable' ? await getReusableProducts() : await getSingleUseProducts({ orgId: req.user.orgId });

  const items: CatalogProductSummary[] = products.map(p => {
    const numericFields: CatalogProductSummary['numericFields'] = [];
    for (const [key, meta] of Object.entries(NUMERIC_FIELD_LABELS)) {
      const raw = (p as any)[key];
      if (typeof raw === 'number' && !Number.isNaN(raw)) {
        numericFields.push({ key, label: meta.label, value: raw, unit: meta.unit });
      }
    }
    return {
      id: p.id,
      label: `${p.description} (${p.size})`,
      category: p.category,
      numericFields
    };
  });

  return res.status(200).json({ source, items } satisfies CatalogListResponse);
});

export default handler;
