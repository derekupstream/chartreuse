import { diffWorkbookSheet } from '../diffWorkbookSheet';

const existing = [
  { material: 'Paper', scope: 'Single-Use', ghg: 0.004685 },
  { material: 'Aluminum', scope: 'Single-Use', ghg: 0.003755 },
  { material: 'Wood', scope: 'Single-Use', ghg: 0.000595 }
];
const columns = ['material', 'scope', 'ghg'];

describe('diffWorkbookSheet', () => {
  it('classifies added, changed, unchanged, and missing', () => {
    const diff = diffWorkbookSheet(
      existing,
      columns,
      [
        { material: 'Paper', scope: 'Single-Use', ghg: 0.004685 }, // unchanged
        { material: 'Aluminum', scope: 'Single-Use', ghg: 0.00342 }, // changed
        { material: 'Glass', scope: 'Reusable', ghg: 0.00028 } // added
      ],
      'material'
    );
    expect(diff.unchangedCount).toBe(1);
    expect(diff.addedRows).toHaveLength(1);
    expect(diff.changedRows).toEqual([
      { key: 'Aluminum', fields: [{ column: 'ghg', before: 0.003755, after: 0.00342 }] }
    ]);
    expect(diff.missingKeys).toEqual(['Wood']);
    expect(diff.changedColumns).toEqual(['ghg']);
  });

  it('compares numbers numerically — a string "0.003755" equals the number', () => {
    const diff = diffWorkbookSheet(
      existing,
      columns,
      [{ material: 'Aluminum', scope: 'Single-Use', ghg: '0.003755' }],
      'material'
    );
    expect(diff.unchangedCount).toBe(1);
    expect(diff.changedRows).toHaveLength(0);
  });

  it('matches keys case-insensitively, but reports the re-casing as the change it is', () => {
    const diff = diffWorkbookSheet(
      existing,
      columns,
      [{ material: 'ALUMINUM', scope: 'Single-Use', ghg: 0.003755 }],
      'material'
    );
    // Not an added row — same key. But applying would rewrite the display name.
    expect(diff.addedRows).toHaveLength(0);
    expect(diff.changedRows).toEqual([
      { key: 'ALUMINUM', fields: [{ column: 'material', before: 'Aluminum', after: 'ALUMINUM' }] }
    ]);
  });

  it('treats blank and null as equal, and reports new columns', () => {
    const diff = diffWorkbookSheet(
      [{ material: 'Paper', scope: 'Single-Use', ghg: 0.004685, note: null }],
      ['material', 'scope', 'ghg', 'note'],
      [{ material: 'Paper', scope: 'Single-Use', ghg: 0.004685, note: '', source: 'ecoinvent' }],
      'material'
    );
    expect(diff.unchangedCount).toBe(0); // 'source' is a new column with a value → a change
    expect(diff.changedRows[0].fields).toEqual([{ column: 'source', before: null, after: 'ecoinvent' }]);
    expect(diff.newColumns).toEqual(['source']);
  });

  it('counts keyless rows instead of misfiling them', () => {
    const diff = diffWorkbookSheet(existing, columns, [{ material: '', ghg: 1 }, { ghg: 2 }], 'material');
    expect(diff.keylessRows).toBe(2);
    expect(diff.addedRows).toHaveLength(0);
  });
});
