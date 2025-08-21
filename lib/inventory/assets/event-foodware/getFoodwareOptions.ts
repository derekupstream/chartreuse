import { readFile } from 'fs';

import neatCsv from 'neat-csv';

import { ReusableProduct, SingleUseProduct } from 'lib/inventory/types/products';
import { getReusableProductsWithBottleStation } from '../reusables/getReusableProducts';
import { getSingleUseProducts } from '../upstream/getSingleUseProducts';

const csvFile = process.cwd() + '/lib/inventory/assets/event-foodware/foodware-options.csv';
type CSVColumn = 'eugenename' | 'crrproductdescription' | 'crrid' | 'crsuid';

type CSVRow = {
  [field in CSVColumn]: string;
};

// a foodware option is a pairing of a single use and reusable product
export type FoodwareOption = {
  singleuse: SingleUseProduct;
  reusable: ReusableProduct;
  title: string;
};

// retrieve single use products on startup
const promise = new Promise<FoodwareOption[]>(async (resolve, reject) => {
  const singleuseItems = await getSingleUseProducts();
  const reusableItems = await getReusableProductsWithBottleStation();
  readFile(csvFile, (err, buffer) => {
    if (err) return reject(err);
    neatCsv<CSVRow>(buffer).then(rows => {
      const products = rows.map(row => mapCsvRow(row, singleuseItems, reusableItems));
      resolve(products);
    });
  });
});

export async function getFoodwareOptions(): Promise<FoodwareOption[]> {
  try {
    return await promise;
  } catch (error) {
    console.error('Could not load foodware options:', error instanceof Error ? error.stack : error);
    return [];
  }
}

// dont use the calculated value from spreadsheet since it is rounded to 4 decimals
function mapCsvRow(
  csvProduct: CSVRow,
  singleuseItems: SingleUseProduct[],
  reusableItems: ReusableProduct[]
): FoodwareOption {
  const singleuse = singleuseItems.find(item => item.id === csvProduct.crsuid);
  const reusable = reusableItems.find(item => item.id === csvProduct.crrid);
  if (!singleuse) {
    console.error(csvProduct);
    throw new Error('Could not find singleuse product for foodware option: ' + csvProduct.eugenename);
  }
  if (!reusable) {
    console.error(csvProduct);
    throw new Error('Could not find reusable product for foodware option: ' + csvProduct.eugenename);
  }
  return { singleuse, title: csvProduct.eugenename, reusable };
}
