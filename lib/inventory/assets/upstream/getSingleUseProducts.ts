import { readFile } from 'fs';

import neatCsv from 'neat-csv';

import { MATERIALS } from 'lib/calculator/constants/materials';
import { PRODUCT_CATEGORIES } from 'lib/calculator/constants/product-categories';
import { PRODUCT_TYPES } from 'lib/calculator/constants/product-types';
import { csvToNumber } from 'lib/csv';

import type { SingleUseProduct } from '../../types/products';
import { dishrackUsage } from 'lib/calculator/constants/dishrackUsage';

// These items were provided by Upstream. They could also live in a database one day
const csvFile = process.cwd() + '/lib/inventory/assets/upstream/single-use-products-data.csv';

type CSVColumn =
  | 'Product ID'
  | 'Product Category'
  | 'Product Description'
  | 'Product'
  | 'Case Count (Units per Case)'
  | 'Box Weight (lbs)'
  | 'Box Weight as % of Gross Weight'
  | 'Gross Case Weight (lbs)'
  | 'Box Weight per item (lbs)'
  | 'Item Weight (lbs)'
  | 'Net Case Weight (lbs)' // to determine unit weight
  | 'Primary Material'
  | 'Primary Material Weight per Unit (lbs)'
  | 'Secondary Material (Lining/Wrapper)'
  | 'Size/Options'
  | 'Second Material Weight per Unit (lbs)'
  | 'dishcatid'; // for looking up dishrack usage

type CSVRow = {
  [field in CSVColumn]: string;
};

// retrieve single use products on startup
const getProductsPromise = new Promise<SingleUseProduct[]>((resolve, reject) => {
  readFile(csvFile, (err, buffer) => {
    if (err) return reject(err);
    neatCsv<CSVRow>(buffer).then(rows => {
      const products = rows.map(csvRowToSingleUseProduct);
      resolve(products);
    });
  });
});

export async function getSingleUseProducts(): Promise<SingleUseProduct[]> {
  return await getProductsPromise;
}

// dont use the calculated value from spreadsheet since it is rounded to 4 decimals
function csvRowToSingleUseProduct(csvProduct: CSVRow): SingleUseProduct {
  // @ts-ignore csvProduct['Product Category'] is a string and cant be compared to category.csvNames
  const category = PRODUCT_CATEGORIES.find(category => category.csvNames.includes(csvProduct['Product Category']));
  if (!category) {
    throw new Error('Could not determine product category for CSV row: ' + csvProduct['Product Category']);
  }
  const type = PRODUCT_TYPES.find(category => category.name === csvProduct['Product']);
  if (!type) {
    throw new Error('Could not determine product type for CSV row: ' + csvProduct['Product']);
  }
  const material1 = MATERIALS.find(material => material.name === csvProduct['Primary Material']);
  if (!material1) {
    throw new Error('Could not determine 1st material for CSV row: ' + csvProduct['Primary Material']);
  }
  const material2 = MATERIALS.find(material => material.name === csvProduct['Secondary Material (Lining/Wrapper)']);
  if (csvProduct['Secondary Material (Lining/Wrapper)'] && !material2) {
    throw new Error(
      'Could not determine 2nd material for CSV row: ' + csvProduct['Secondary Material (Lining/Wrapper)']
    );
  }
  const productId = csvProduct['Product ID'];
  const unitsPerCase = csvToNumber(csvProduct['Case Count (Units per Case)']);
  const grossCaseWeight = csvToNumber(csvProduct['Gross Case Weight (lbs)']);
  const boxWeightPerItem = csvToNumber(csvProduct['Box Weight per item (lbs)']);
  const boxPercentWeight = csvToNumber(csvProduct['Box Weight as % of Gross Weight']) / 100;
  const boxWeight = grossCaseWeight * boxPercentWeight;
  // const netCaseWeight = grossCaseWeight - boxWeight;
  const itemWeight = csvToNumber(csvProduct['Item Weight (lbs)']);
  const secondaryMaterialWeightPerUnit = csvToNumber(csvProduct['Second Material Weight per Unit (lbs)']);
  const primaryMaterialWeightPerUnit =
    secondaryMaterialWeightPerUnit > 0 ? itemWeight - secondaryMaterialWeightPerUnit : itemWeight;

  const catId = csvToNumber(csvProduct['dishcatid']);
  const reusableItemCountPerRack = dishrackUsage.get(catId)?.items_per_rack;

  return {
    id: productId,
    boxWeight,
    boxWeightPerItem,
    category: category.id,
    description: csvProduct['Product Description'],
    type: type.id,
    itemWeight,
    //unitsPerCase,
    primaryMaterial: material1.id,
    primaryMaterialWeightPerUnit,
    secondaryMaterial: material2?.id,
    secondaryMaterialWeightPerUnit,
    size: csvProduct['Size/Options'] || 'Standard', // product id 52 has no size set
    reusableItemCountPerRack
  };
}
