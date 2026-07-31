import { MATERIAL_MAP, MATERIALS, getAllMaterials } from '../../constants/materials';
import { clearMaterialFactorOverrides, setMaterialFactorOverrides } from '../materialFactorOverrides';

const LDPE = MATERIALS.find(m => m.name === 'Plastic (LDPE)')!;

describe('material factor overrides', () => {
  afterEach(() => clearMaterialFactorOverrides());

  it('returns the compiled values when nothing is loaded', () => {
    expect(MATERIAL_MAP[LDPE.id].mtco2ePerLb).toBe(LDPE.mtco2ePerLb);
    expect(MATERIAL_MAP[LDPE.id].waterUsageGalPerLb).toBe(LDPE.waterUsageGalPerLb);
  });

  it('applies an uploaded value in place of the compiled one', () => {
    setMaterialFactorOverrides([
      { name: 'Plastic (LDPE)', mtco2ePerLb: 0.00123, waterUsageGalPerLb: 14.3271, source: 'Test DB' }
    ]);
    expect(MATERIAL_MAP[LDPE.id].mtco2ePerLb).toBeCloseTo(0.00123);
    expect(MATERIAL_MAP[LDPE.id].waterUsageGalPerLb).toBeCloseTo(14.3271);
  });

  it('keeps the compiled value for fields the upload does not supply', () => {
    setMaterialFactorOverrides([{ name: 'Plastic (LDPE)', waterUsageGalPerLb: 14.3271, source: 'Test DB' }]);
    expect(MATERIAL_MAP[LDPE.id].mtco2ePerLb).toBe(LDPE.mtco2ePerLb);
    expect(MATERIAL_MAP[LDPE.id].waterUsageGalPerLb).toBeCloseTo(14.3271);
  });

  it('leaves materials absent from the upload untouched, so a partial table is safe', () => {
    const ceramic = getAllMaterials().find(m => m.name === 'Ceramic')!;
    setMaterialFactorOverrides([{ name: 'Plastic (LDPE)', mtco2ePerLb: 0.00123, source: 'Test DB' }]);
    expect(getAllMaterials().find(m => m.name === 'Ceramic')!.mtco2ePerLb).toBe(ceramic.mtco2ePerLb);
  });

  it('matches material names case- and whitespace-insensitively', () => {
    setMaterialFactorOverrides([{ name: '  plastic (ldpe) ', mtco2ePerLb: 0.00999, source: 'Test DB' }]);
    expect(MATERIAL_MAP[LDPE.id].mtco2ePerLb).toBeCloseTo(0.00999);
  });

  it('ignores rows with no usable numbers', () => {
    setMaterialFactorOverrides([{ name: 'Plastic (LDPE)', source: 'Test DB' } as any]);
    expect(MATERIAL_MAP[LDPE.id].mtco2ePerLb).toBe(LDPE.mtco2ePerLb);
  });

  it('clearing restores the compiled values', () => {
    setMaterialFactorOverrides([{ name: 'Plastic (LDPE)', mtco2ePerLb: 0.5, source: 'Test DB' }]);
    clearMaterialFactorOverrides();
    expect(MATERIAL_MAP[LDPE.id].mtco2ePerLb).toBe(LDPE.mtco2ePerLb);
  });
});
