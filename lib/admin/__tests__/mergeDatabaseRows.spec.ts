import { mergeDatabaseRows } from '../mergeDatabaseRows';

const existing = [
  { id: '1', name: 'Ceramic', ghg: '0.0008', water: '5.83', notes: 'keep me' },
  { id: '2', name: 'Stainless Steel', ghg: '0.00119', water: '6.74', notes: 'keep me too' },
  { id: '3', name: 'Glass', ghg: '0.00028', water: '2.59', notes: 'untouched' }
];

describe('mergeDatabaseRows', () => {
  it('replace mode takes the upload wholesale', () => {
    const result = mergeDatabaseRows(existing, [{ id: '9', name: 'New', ghg: '1' }], {
      mode: 'replace',
      keyColumn: 'id'
    });
    expect(result.rows).toHaveLength(1);
    expect(result.added).toBe(1);
  });

  it('update mode changes matched rows and leaves the rest alone', () => {
    const result = mergeDatabaseRows(existing, [{ id: '2', ghg: '0.00999' }], { mode: 'update', keyColumn: 'id' });
    expect(result.rows).toHaveLength(3);
    expect(result.updated).toBe(1);
    expect(result.added).toBe(0);
    expect(result.rows[1].ghg).toBe('0.00999');
    expect(result.rows[1].water).toBe('6.74'); // not in the upload, so preserved
    expect(result.rows[1].notes).toBe('keep me too');
    expect(result.rows[2]).toEqual(existing[2]);
  });

  it('update mode reports uploaded rows that matched nothing', () => {
    const result = mergeDatabaseRows(existing, [{ id: '99', ghg: '1' }], { mode: 'update', keyColumn: 'id' });
    expect(result.unmatched).toBe(1);
    expect(result.rows).toHaveLength(3);
  });

  it('add mode only creates new rows, never edits existing ones', () => {
    const result = mergeDatabaseRows(
      existing,
      [
        { id: '1', ghg: 'CHANGED' },
        { id: '4', name: 'Bamboo' }
      ],
      {
        mode: 'add',
        keyColumn: 'id'
      }
    );
    expect(result.added).toBe(1);
    expect(result.updated).toBe(0);
    expect(result.rows[0].ghg).toBe('0.0008');
    expect(result.rows).toHaveLength(4);
  });

  it('upsert mode both updates and adds', () => {
    const result = mergeDatabaseRows(
      existing,
      [
        { id: '1', ghg: '0.5' },
        { id: '4', name: 'Bamboo', ghg: '0.1' }
      ],
      {
        mode: 'upsert',
        keyColumn: 'id'
      }
    );
    expect(result.updated).toBe(1);
    expect(result.added).toBe(1);
    expect(result.rows).toHaveLength(4);
  });

  it('only writes the selected columns', () => {
    const result = mergeDatabaseRows(existing, [{ id: '1', ghg: '0.5', water: '99', notes: 'overwrite attempt' }], {
      mode: 'update',
      keyColumn: 'id',
      columns: ['ghg']
    });
    expect(result.rows[0].ghg).toBe('0.5');
    expect(result.rows[0].water).toBe('5.83');
    expect(result.rows[0].notes).toBe('keep me');
    expect(result.columnsWritten).toEqual(['ghg']);
  });

  it('treats an empty cell as no opinion rather than a deletion', () => {
    const result = mergeDatabaseRows(existing, [{ id: '1', ghg: '', water: '7.0' }], {
      mode: 'update',
      keyColumn: 'id'
    });
    expect(result.rows[0].ghg).toBe('0.0008');
    expect(result.rows[0].water).toBe('7.0');
  });

  it('matches keys case- and whitespace-insensitively', () => {
    const result = mergeDatabaseRows(existing, [{ name: '  stainless steel ', ghg: '0.5' }], {
      mode: 'update',
      keyColumn: 'name'
    });
    expect(result.updated).toBe(1);
    expect(result.rows[1].ghg).toBe('0.5');
  });

  it('counts rows the upload never mentioned', () => {
    const result = mergeDatabaseRows(existing, [{ id: '1', ghg: '0.5' }], { mode: 'update', keyColumn: 'id' });
    expect(result.untouched).toBe(2);
  });
});
