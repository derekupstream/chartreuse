import neatCsv from 'neat-csv';
import { readFile } from 'fs';
import { SingleUseProduct } from '../types/products';
import { MaterialName, MATERIALS } from '../constants/materials';
import { PRODUCT_CATEGORIES } from '../constants/product-categories';
import { PRODUCT_TYPES } from '../constants/product-types';

// These items were provided by Upstream. They could also live in a database one day
const csvFile = __dirname + '/single-use-products.csv';

type CSVColumn =
  | 'Product ID'
  | 'Product Category'
  | 'Product'
  | 'Case Count (Units per Case)'
  | 'Box Weight (lbs)'
  | 'Item Weight (lbs)'
  | 'Primary Material'
  | 'Primary Material Weight per Unit (lbs)'
  | 'Secondary Material'
  | 'Secondary Material Weight per Unit (lbs)';

type CSVRow = {
  [field in CSVColumn]: string;
}

// retrieve single use products on startup
const getProductsPromise = new Promise<SingleUseProduct[]>((resolve, reject) => {
  readFile(csvFile, (err, buffer) => {
    if (err) return reject(err);
    neatCsv<CSVRow>(buffer)
      .then((rows) => {
        const products = rows.map(csvRowToSingleUseProduct);
        resolve(products);
      });
  });
});

export async function getProducts (): Promise<SingleUseProduct[]> {
  return await getProductsPromise;
}

function csvRowToSingleUseProduct (csvProduct: CSVRow): SingleUseProduct {
  // @ts-ignore csvProduct['Product Category'] is a string and cant be compared to category.csvNames
  const category = PRODUCT_CATEGORIES.find(category => category.csvNames.includes(csvProduct['Product Category']));
  if (!category) {
    throw new Error('Could not determine product category for CSV row: ' + csvProduct['Product Category']);
  }
  const type = PRODUCT_TYPES.find(category => category.name === csvProduct['Product']);
  if (!type) {
    throw new Error('Could not determine product type for CSV row: ' + csvProduct['Product']);
  }
  const material1 = MATERIALS.find(category => category.name === csvProduct['Primary Material']);
  if (!material1) {
    throw new Error('Could not determine 1st material for CSV row: ' + csvProduct['Primary Material']);
  }
  const material2 = MATERIALS.find(category => category.name === csvProduct['Secondary Material']);
  if (csvProduct['Secondary Material'] && !material2) {
    throw new Error('Could not determine 2nd material for CSV row: ' + csvProduct['Secondary Material']);
  }
  return {
    id: csvToNumber(csvProduct['Product ID']),
    boxWeight: csvToNumber(csvProduct['Box Weight (lbs)']),
    category: category.id,
    type: type.id,
    itemWeight: csvToNumber(csvProduct['Item Weight (lbs)']),
    unitsPerCase: csvToNumber(csvProduct['Case Count (Units per Case)']),
    primaryMaterial: material1.id,
    primaryMaterialWeightPerUnit: csvToNumber(csvProduct['Primary Material Weight per Unit (lbs)']),
    secondaryMaterial: material2?.id || 0,
    secondaryMaterialWeightPerUnit: csvToNumber(csvProduct['Secondary Material Weight per Unit (lbs)'])
  };
}

function csvToNumber (value: string = ''): number {
  value = value.replace(/[^0-9.]/g, '').trim();
  return value ? parseFloat(value) : 0;
}