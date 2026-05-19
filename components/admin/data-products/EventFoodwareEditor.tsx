import { Card, Col, Empty, InputNumber, Row, Tag, Typography } from 'antd';

import type { ProjectInventory } from 'lib/inventory/types/projects';

const { Text } = Typography;

type Props = {
  inventory: ProjectInventory;
  onPatchItem: (
    index: number,
    patch: Partial<{
      reusableItemCount: number;
      reusableReturnCount: number;
      waterUsageGallons: number;
      reusableCostPerItem: number;
      singleUseCostPerItem: number;
    }>
  ) => void;
};

export function EventFoodwareEditor({ inventory, onPatchItem }: Props) {
  const items = inventory.foodwareItems ?? [];

  if (items.length === 0) {
    return <Empty description='No foodware items in this inventory' />;
  }

  return (
    <div>
      <Text strong style={{ fontSize: 13 }}>
        Foodware Items
      </Text>
      <Text type='secondary' style={{ fontSize: 11, display: 'block', marginBottom: 12 }}>
        Edit each item's counts, water usage, and per-unit costs. The engine recomputes outputs on every change.
      </Text>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((item, idx) => {
          const sent = item.reusableItemCount ?? 0;
          const returned = item.reusableReturnCount ?? 0;
          const lost = Math.max(0, sent - returned);
          const returnPct = sent > 0 ? Math.round((returned / sent) * 100) : 0;
          const description = item.reusableProduct?.description ?? `Foodware ${idx + 1}`;
          return (
            <Card key={item.id} size='small' style={{ background: '#fafafa' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text strong style={{ fontSize: 13 }}>
                  {description}
                </Text>
                <div>
                  <Tag color={returnPct >= 95 ? 'green' : returnPct >= 80 ? 'gold' : 'red'}>{returnPct}% returned</Tag>
                  {lost > 0 && <Tag>{lost} lost</Tag>}
                </div>
              </div>
              <Row gutter={[12, 12]}>
                <Col xs={24} sm={12} md={8}>
                  <Text style={{ fontSize: 11, display: 'block', color: '#666' }}>
                    Reusables Sent <Text type='secondary'>(items)</Text>
                  </Text>
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    step={1}
                    value={sent}
                    onChange={v => onPatchItem(idx, { reusableItemCount: typeof v === 'number' ? v : 0 })}
                  />
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Text style={{ fontSize: 11, display: 'block', color: '#666' }}>
                    Reusables Returned <Text type='secondary'>(items)</Text>
                  </Text>
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    max={sent}
                    step={1}
                    value={returned}
                    onChange={v => onPatchItem(idx, { reusableReturnCount: typeof v === 'number' ? v : 0 })}
                  />
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Text style={{ fontSize: 11, display: 'block', color: '#666' }}>
                    Water Used <Text type='secondary'>(gallons)</Text>
                  </Text>
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    step={1}
                    value={item.waterUsageGallons ?? 0}
                    onChange={v => onPatchItem(idx, { waterUsageGallons: typeof v === 'number' ? v : 0 })}
                  />
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Text style={{ fontSize: 11, display: 'block', color: '#666' }}>
                    Reusable Cost / Item <Text type='secondary'>($)</Text>
                  </Text>
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    step={0.01}
                    value={item.reusableCostPerItem ?? 0}
                    onChange={v => onPatchItem(idx, { reusableCostPerItem: typeof v === 'number' ? v : 0 })}
                  />
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Text style={{ fontSize: 11, display: 'block', color: '#666' }}>
                    Single-Use Cost / Item <Text type='secondary'>($)</Text>
                  </Text>
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    step={0.01}
                    value={item.singleUseCostPerItem ?? 0}
                    onChange={v => onPatchItem(idx, { singleUseCostPerItem: typeof v === 'number' ? v : 0 })}
                  />
                </Col>
              </Row>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
