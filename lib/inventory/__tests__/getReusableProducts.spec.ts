import { getReusableProducts } from '../getReusableProducts';

describe('Predictions Calculator: Spreadsheet results from Upstream', () => {
  it('finds the first row of reusable products', async () => {
    const products = await getReusableProducts();
    expect(products[0]).toMatchObject({
      boxWeight: 0,
      category: '0',
      description: '8 oz Glass Cup',
      id: '100',
      itemWeight: 0.4921875,
      primaryMaterial: 100,
      primaryMaterialWeightPerUnit: 0.4921875,
      secondaryMaterial: 0,
      secondaryMaterialWeightPerUnit: 0,
      size: '8 oz',
      type: 0,
      unitsPerCase: 12
    });
  });
});
