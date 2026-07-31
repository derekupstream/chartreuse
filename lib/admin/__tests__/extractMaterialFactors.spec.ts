import { extractMaterialFactors, guessFactorColumns } from '../extractMaterialFactors';

describe('guessFactorColumns', () => {
  it('finds the columns in a spreadsheet that carries factors per product row', () => {
    const guess = guessFactorColumns([
      'product id',
      'mass/item',
      'primary material',
      'primary item ghg ef',
      'secondary ghg ef',
      'primary water factor',
      'cardboard water factor'
    ]);
    expect(guess.materialColumn).toBe('primary material');
    expect(guess.ghgColumn).toBe('primary item ghg ef');
    expect(guess.waterColumn).toBe('primary water factor');
  });

  it('ignores weight columns when looking for the material name', () => {
    const guess = guessFactorColumns([
      'Product ID',
      'Primary Material',
      'Primary Material Weight per Unit (lbs)',
      'Secondary Material (Lining/Wrapper)'
    ]);
    expect(guess.materialColumn).toBe('Primary Material');
  });
});

describe('extractMaterialFactors', () => {
  const columns = { materialColumn: 'material', ghgColumn: 'ghg', waterColumn: 'water' };

  it('collapses repeated rows into one factor per material', () => {
    const result = extractMaterialFactors(
      [
        { material: 'EPS Foam', ghg: '0.001265', water: '9.2745' },
        { material: 'EPS Foam', ghg: '0.001265', water: '9.2745' },
        { material: 'Plastic (LDPE)', ghg: '0.000915', water: '6.4634' }
      ],
      columns
    );
    expect(result.conflictCount).toBe(0);
    expect(result.materials).toHaveLength(2);
    const eps = result.materials.find(m => m.material === 'EPS Foam')!;
    expect(eps.ghg).toBeCloseTo(0.001265);
    expect(eps.rowCount).toBe(2);
  });

  it('reports a conflict instead of guessing when rows disagree', () => {
    // The real error from the July test sheet: aluminium carrying LDPE's factor.
    const result = extractMaterialFactors(
      [
        { material: 'Aluminum', ghg: '0.003755', water: '8.7618' },
        { material: 'Aluminum', ghg: '0.000915', water: '14.3271' }
      ],
      columns
    );
    expect(result.conflictCount).toBe(1);
    const aluminium = result.materials[0];
    expect(aluminium.hasConflict).toBe(true);
    expect(aluminium.ghg).toBeNull();
    expect(aluminium.ghgConflicts).toEqual([0.000915, 0.003755]);
  });

  it('tolerates spreadsheet rounding rather than calling it a conflict', () => {
    const result = extractMaterialFactors(
      [
        { material: 'Ceramic', ghg: '0.000807234489390462', water: '5.826840287' },
        { material: 'Ceramic', ghg: '0.0008072344893905', water: '5.826840287' }
      ],
      columns
    );
    expect(result.conflictCount).toBe(0);
    expect(result.materials[0].ghg).toBeCloseTo(0.000807234489390462);
  });

  it('handles currency and blank cells, and skips rows with no material', () => {
    const result = extractMaterialFactors(
      [
        { material: 'Stainless Steel', ghg: ' 0.00119 ', water: '' },
        { material: '', ghg: '0.5', water: '1' }
      ],
      columns
    );
    expect(result.materials).toHaveLength(1);
    expect(result.materials[0].ghg).toBeCloseTo(0.00119);
    expect(result.materials[0].water).toBeNull();
  });
});
