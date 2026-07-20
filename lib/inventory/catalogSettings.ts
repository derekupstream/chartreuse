import prisma from 'lib/prisma';

/**
 * Per-org curated product catalog, stored on Org.catalogSettings (Json).
 * Null / missing / empty lists mean "full catalog". When a list is non-empty,
 * the /api/inventory/* endpoints only return those products, so every product
 * picker in the app respects the curation automatically.
 */
export type CatalogSettings = {
  reusableProductIds?: string[];
  singleUseProductIds?: string[];
};

export async function getOrgCatalogSettings(orgId: string): Promise<CatalogSettings> {
  const org = await prisma.org.findUnique({
    where: { id: orgId },
    select: { catalogSettings: true }
  });
  return (org?.catalogSettings as CatalogSettings) ?? {};
}

export function filterByAllowedIds<T extends { id: string }>(products: T[], allowedIds?: string[]): T[] {
  if (!allowedIds || allowedIds.length === 0) return products;
  const allowed = new Set(allowedIds);
  return products.filter(product => allowed.has(product.id));
}

/** Coerce untrusted input into a clean CatalogSettings value (or null to clear). */
export function sanitizeCatalogSettings(input: unknown): CatalogSettings | null {
  if (!input || typeof input !== 'object') return null;
  const { reusableProductIds, singleUseProductIds } = input as CatalogSettings;
  const clean = (ids?: unknown): string[] | undefined =>
    Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string').slice(0, 1000) : undefined;
  const settings: CatalogSettings = {
    reusableProductIds: clean(reusableProductIds),
    singleUseProductIds: clean(singleUseProductIds)
  };
  const isEmpty = !settings.reusableProductIds?.length && !settings.singleUseProductIds?.length;
  return isEmpty ? null : settings;
}
