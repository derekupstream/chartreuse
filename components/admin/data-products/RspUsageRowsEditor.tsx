import { Card, Col, Empty, InputNumber, Row, Select, Tag, Typography } from 'antd';

import type { RspIngestionInput } from 'lib/rsp/getRspIngestionResults';

const { Text } = Typography;

type Props = {
  input: RspIngestionInput;
  onPatchRow: (
    index: number,
    patch: Partial<{
      reusableType: string;
      materialType: string;
      weightLbsPerItem: number;
      inWarehouseEvents: number;
      outWarehouseEvents: number;
      deliveriesCount: number;
      singleUseMaterial: string;
    }>
  ) => void;
};

const REUSABLE_TYPES = ['cup', 'container', 'bowl', 'plate', 'utensil', 'tray', 'glass'];
const MATERIALS = [
  'polypropylene',
  'stainless_steel',
  'aluminum',
  'glass',
  'melamine',
  'polycarbonate',
  'bamboo',
  'ceramic'
];

export function RspUsageRowsEditor({ input, onPatchRow }: Props) {
  const rows = input.usageRows ?? [];
  if (rows.length === 0) return <Empty description='No usage rows in this period' />;

  return (
    <div>
      <Text strong style={{ fontSize: 13 }}>
        Usage Rows
      </Text>
      <Text type='secondary' style={{ fontSize: 11, display: 'block', marginBottom: 12 }}>
        One row per reusable type circulated this period. Counts come from the RSP API; everything else describes what's
        being moved.
      </Text>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rows.map((row, idx) => {
          const lost = Math.max(0, (row.outWarehouseEvents ?? 0) - (row.inWarehouseEvents ?? 0));
          const returnPct =
            row.outWarehouseEvents > 0 ? Math.round((row.inWarehouseEvents / row.outWarehouseEvents) * 100) : 0;
          return (
            <Card key={idx} size='small' style={{ background: '#fafafa' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text strong style={{ fontSize: 13 }}>
                  {row.reusableType} · {row.materialType}
                </Text>
                <div>
                  <Tag color={returnPct >= 95 ? 'green' : returnPct >= 80 ? 'gold' : 'red'}>{returnPct}% returned</Tag>
                  {lost > 0 && <Tag>{lost} lost</Tag>}
                </div>
              </div>
              <Row gutter={[12, 12]}>
                <Col xs={24} sm={12} md={8}>
                  <Text style={{ fontSize: 11, display: 'block', color: '#666' }}>Reusable Type</Text>
                  <Select
                    style={{ width: '100%' }}
                    value={row.reusableType}
                    onChange={v => onPatchRow(idx, { reusableType: v })}
                    options={REUSABLE_TYPES.map(t => ({ value: t, label: t }))}
                  />
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Text style={{ fontSize: 11, display: 'block', color: '#666' }}>Material</Text>
                  <Select
                    style={{ width: '100%' }}
                    value={row.materialType}
                    onChange={v => onPatchRow(idx, { materialType: v })}
                    options={MATERIALS.map(m => ({ value: m, label: m.replace(/_/g, ' ') }))}
                  />
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Text style={{ fontSize: 11, display: 'block', color: '#666' }}>
                    Item Weight <Text type='secondary'>(lbs)</Text>
                  </Text>
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    step={0.01}
                    value={row.weightLbsPerItem}
                    onChange={v => onPatchRow(idx, { weightLbsPerItem: typeof v === 'number' ? v : 0 })}
                  />
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Text style={{ fontSize: 11, display: 'block', color: '#666' }}>
                    Out (sent to venues) <Text type='secondary'>(items)</Text>
                  </Text>
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    step={1}
                    value={row.outWarehouseEvents}
                    onChange={v => onPatchRow(idx, { outWarehouseEvents: typeof v === 'number' ? v : 0 })}
                  />
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Text style={{ fontSize: 11, display: 'block', color: '#666' }}>
                    In (returned) <Text type='secondary'>(items)</Text>
                  </Text>
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    step={1}
                    value={row.inWarehouseEvents}
                    onChange={v => onPatchRow(idx, { inWarehouseEvents: typeof v === 'number' ? v : 0 })}
                  />
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Text style={{ fontSize: 11, display: 'block', color: '#666' }}>
                    Deliveries this period <Text type='secondary'>(trips)</Text>
                  </Text>
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    step={1}
                    value={row.deliveriesCount}
                    onChange={v => onPatchRow(idx, { deliveriesCount: typeof v === 'number' ? v : 0 })}
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
