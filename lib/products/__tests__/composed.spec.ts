/**
 * The dependency contract around the newer block kinds: a chart block counts as a placed
 * smart field, and a comparison's baseline/forecast equations add their own requirements —
 * a product must not publish while the chart needs a question nobody asks.
 */
import { analyzeDependencies } from 'lib/products/composed';
import type { ComposedDefinition, ComposedSmartField } from 'lib/products/composed';
import type { SmartVariable } from 'lib/smartFields/variables';

const variables = new Map<string, SmartVariable>([
  ['racksPerDay', { key: 'racksPerDay', label: 'Racks per day', category: 'Inputs' }],
  ['operatingDays', { key: 'operatingDays', label: 'Operating days', category: 'Inputs' }],
  ['baselineWaterUse', { key: 'baselineWaterUse', label: 'Baseline water', category: 'Intermediates' }],
  ['forecastWaterUse', { key: 'forecastWaterUse', label: 'Forecast water', category: 'Intermediates' }]
]);

const field: ComposedSmartField = {
  id: 'f1',
  name: 'Water savings',
  unit: 'gal',
  description: null,
  equation: [
    { kind: 'variable', key: 'baselineWaterUse' },
    { kind: 'operator', value: '-' },
    { kind: 'variable', key: 'forecastWaterUse' }
  ],
  comparison: {
    baseline: [{ kind: 'variable', key: 'baselineWaterUse' }],
    forecast: [
      { kind: 'variable', key: 'racksPerDay' },
      { kind: 'operator', value: '*' },
      { kind: 'variable', key: 'operatingDays' }
    ]
  }
};

const definitionWith = (blockKind: 'smartFieldCard' | 'chart'): ComposedDefinition => ({
  screens: [{ id: 's1', title: 'Results', blocks: [{ id: 'b1', kind: blockKind, smartFieldId: 'f1' }] }],
  inputFields: []
});

describe('analyzeDependencies with chart blocks and comparisons', () => {
  it('a chart block places its smart field (its inputs become requirements)', () => {
    const result = analyzeDependencies(definitionWith('chart'), [field], variables);
    const keys = result.inputs.map(i => i.key).sort();
    // baselineWaterUse / forecastWaterUse are intermediates (required as inputs to a
    // composed product), and the comparison's forecast side adds the two dishwashing inputs.
    expect(keys).toEqual(['baselineWaterUse', 'forecastWaterUse', 'operatingDays', 'racksPerDay']);
    expect(result.uncollected).toHaveLength(4);
  });

  it('the comparison equations add requirements beyond the main equation', () => {
    const withoutComparison = { ...field, comparison: null };
    const result = analyzeDependencies(definitionWith('smartFieldCard'), [withoutComparison], variables);
    expect(result.inputs.map(i => i.key).sort()).toEqual(['baselineWaterUse', 'forecastWaterUse']);
  });

  it('a purchasing widget collects its fixed list key, satisfying SUM equations over it', () => {
    const suField: ComposedSmartField = {
      id: 'f2',
      name: 'Annual items',
      unit: 'items',
      description: null,
      equation: [
        {
          kind: 'aggregate',
          fn: 'SUM',
          group: 'singleUseProducts',
          body: [
            { kind: 'variable', key: 'casesPerYear' },
            { kind: 'operator', value: '*' },
            { kind: 'variable', key: 'unitsPerCase' }
          ]
        }
      ]
    };
    const definition: ComposedDefinition = {
      screens: [
        { id: 's1', title: 'Purchasing', blocks: [{ id: 'w1', kind: 'singleUseItems' }] },
        { id: 's2', title: 'Results', blocks: [{ id: 'b1', kind: 'smartFieldCard', smartFieldId: 'f2' }] }
      ],
      inputFields: []
    };
    const result = analyzeDependencies(definition, [suField], variables);
    expect(result.uncollected).toHaveLength(0);
    // Without the widget, the list is an uncollected requirement.
    const bare: ComposedDefinition = { screens: [definition.screens[1]], inputFields: [] };
    expect(analyzeDependencies(bare, [suField], variables).uncollected.map(u => u.key)).toEqual(['singleUseProducts']);
  });
});
