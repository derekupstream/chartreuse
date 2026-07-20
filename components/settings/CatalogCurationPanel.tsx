import { Alert, Button, Select, Spin, Typography, message } from 'antd';
import { useEffect, useState } from 'react';

import type { CatalogManagementResponse } from 'pages/api/org/catalog';

const { Text, Title } = Typography;

/**
 * Curate which products appear in an org's pickers. Empty selection = full catalog.
 * Used in two places: Organizational Settings (org admins, self-serve) and the
 * Super Admin org detail page (Upstream managing any org). The `endpoint` prop
 * points at the matching GET/PUT API.
 */
export function CatalogCurationPanel({ endpoint }: { endpoint: string }) {
  const [data, setData] = useState<CatalogManagementResponse | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [reusableIds, setReusableIds] = useState<string[]>([]);
  const [singleUseIds, setSingleUseIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(endpoint)
      .then(r => {
        if (!r.ok) throw new Error('Failed to load catalog');
        return r.json();
      })
      .then((response: CatalogManagementResponse) => {
        if (cancelled) return;
        setData(response);
        setReusableIds(response.settings.reusableProductIds ?? []);
        setSingleUseIds(response.settings.singleUseProductIds ?? []);
      })
      .catch(() => !cancelled && setLoadError(true));
    return () => {
      cancelled = true;
    };
  }, [endpoint]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reusableProductIds: reusableIds, singleUseProductIds: singleUseIds })
      });
      if (!res.ok) throw new Error('Failed to save');
      message.success('Product catalog saved');
    } catch {
      message.error('Failed to save product catalog');
    } finally {
      setSaving(false);
    }
  }

  if (loadError) return <Alert type='error' showIcon message='Could not load the product catalog.' />;
  if (!data) return <Spin />;

  const isCurated = reusableIds.length > 0 || singleUseIds.length > 0;
  const toOptions = (products: { id: string; description: string }[]) =>
    [...products]
      .sort((a, b) => a.description.localeCompare(b.description))
      .map(p => ({ value: p.id, label: p.description }));

  return (
    <div>
      <Title level={5} style={{ marginTop: 0, marginBottom: 4 }}>
        Product Catalog
      </Title>
      <Text type='secondary' style={{ display: 'block', marginBottom: 16 }}>
        Curate a short list so pickers only show the products this organization actually uses. Leave a list empty to
        offer the full catalog.
      </Text>

      <Text strong style={{ display: 'block', marginBottom: 4 }}>
        Reusable products{' '}
        <Text type='secondary'>
          ({reusableIds.length === 0 ? `full catalog, ${data.reusableProducts.length}` : reusableIds.length} shown)
        </Text>
      </Text>
      <Select
        mode='multiple'
        allowClear
        showSearch
        optionFilterProp='label'
        placeholder={`Full catalog (${data.reusableProducts.length} products)`}
        value={reusableIds}
        onChange={setReusableIds}
        style={{ width: '100%', marginBottom: 16 }}
        options={toOptions(data.reusableProducts)}
      />

      <Text strong style={{ display: 'block', marginBottom: 4 }}>
        Single-use products{' '}
        <Text type='secondary'>
          ({singleUseIds.length === 0 ? `full catalog, ${data.singleUseProducts.length}` : singleUseIds.length} shown)
        </Text>
      </Text>
      <Select
        mode='multiple'
        allowClear
        showSearch
        optionFilterProp='label'
        placeholder={`Full catalog (${data.singleUseProducts.length} products)`}
        value={singleUseIds}
        onChange={setSingleUseIds}
        style={{ width: '100%', marginBottom: 16 }}
        options={toOptions(data.singleUseProducts)}
      />

      {isCurated && (
        <Alert
          type='info'
          showIcon
          style={{ marginBottom: 16 }}
          message='Members of this organization will only see the selected products in their product pickers. Existing projects that use other products are unaffected.'
        />
      )}

      <Button type='primary' onClick={save} loading={saving}>
        Save Product Catalog
      </Button>
    </div>
  );
}
