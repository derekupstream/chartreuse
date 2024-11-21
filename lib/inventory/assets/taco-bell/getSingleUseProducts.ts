import { readFile } from 'fs';

import neatCsv from 'neat-csv';

import { MATERIALS } from 'lib/calculator/constants/materials';
import { PRODUCT_CATEGORIES } from 'lib/calculator/constants/product-categories';
import { PRODUCT_TYPES } from 'lib/calculator/constants/product-types';
import { csvToNumber } from 'lib/csv';

import type { SingleUseProduct } from '../../types/products';

const csvFile = process.cwd() + '/lib/inventory/assets/taco-bell/single-use-items.6.21.22.csv';

type CSVColumn =
  | 'Product ID'
  | 'Description'
  | 'Category'
  | 'Product Type'
  | 'Primary Material'
  | 'Secondary Material (Lining/Wrapper)'
  | 'Size/Options'
  | 'Units per case'
  | 'Net Case Weight (lbs)' // to determine unit weight
  | 'Gross Case Weight (lbs)'
  | 'Box Weight as % of Gross Weight';

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
  const category = PRODUCT_CATEGORIES.find(category => category.name === csvProduct['Category']);
  if (!category) {
    throw new Error('Could not determine product category for CSV row: ' + csvProduct['Category']);
  }
  const type = PRODUCT_TYPES.find(category => category.name === csvProduct['Product Type']);
  if (!type) {
    throw new Error('Could not determine product type for CSV row: ' + csvProduct['Product Type']);
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
  const unitsPerCase = csvToNumber(csvProduct['Units per case']);
  const grossCaseWeight = csvToNumber(csvProduct['Gross Case Weight (lbs)']);
  const boxPercentWeight = csvToNumber(csvProduct['Box Weight as % of Gross Weight']) / 100;
  const boxWeight = grossCaseWeight * boxPercentWeight;
  let netCaseWeight = 0;
  if (boxWeight) {
    netCaseWeight = grossCaseWeight - boxWeight;
  } else {
    // equation: gross case weight - (.125 * gross weight) = net case weight
    netCaseWeight = grossCaseWeight - 0.125 * grossCaseWeight;
  }
  const itemWeight = netCaseWeight / unitsPerCase;
  const secondaryMaterialWeightPerUnit = 0; // Not provided by vendor
  const primaryMaterialWeightPerUnit =
    secondaryMaterialWeightPerUnit > 0 ? itemWeight - secondaryMaterialWeightPerUnit : itemWeight;

  return {
    id: productId,
    boxWeight,
    category: category.id,
    description: csvProduct['Description'],
    type: type.id,
    itemWeight,
    //unitsPerCase,
    primaryMaterial: material1.id,
    primaryMaterialWeightPerUnit,
    secondaryMaterial: material2?.id || 0,
    secondaryMaterialWeightPerUnit,
    size: csvProduct['Size/Options']
  };
}
