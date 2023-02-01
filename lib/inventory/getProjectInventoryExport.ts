import type { Project, SingleUseLineItem, SingleUseLineItemRecord } from '@prisma/client';
import ExcelJS from 'exceljs';

import { PRODUCT_CATEGORIES } from 'lib/calculator/constants/product-categories';
import { getSingleUseProducts } from 'lib/inventory/getSingleUseProducts';
import type { SingleUseProduct } from 'lib/inventory/types/products';
import prisma from 'lib/prisma';

// create our own version of ProjectData. Nicer would be to make teh types in lib/calculator generic
interface ProjectData extends Project {
  singleUseItems: (SingleUseLineItem & { records: SingleUseLineItemRecord[] })[];
}

type SheetRow = Record<string, string | number>;

export async function getProjectInventoryExport(projectId: string) {
  const project = await prisma.project.findUniqueOrThrow({
    where: {
      id: projectId
    },
    include: {
      account: true,
      org: true,
      singleUseItems: {
        include: {
          records: true
        }
      }
    }
  });

  const products = await getSingleUseProducts({ orgId: project.orgId });

  return getExportFile(project, products);
}

const worksheetOptions: Partial<ExcelJS.AddWorksheetOptions> = {
  views: [{ state: 'frozen', xSplit: 1, ySplit: 1 }] // lock the first row
};

const greyFill = {
  // border: {
  //   top: { style: 'thin' },
  //   left: { style: 'thin' },
  //   bottom: { style: 'thin' },
  //   right: { style: 'thin' }
  // },
  //fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'f4f4f4' } }
} as const;

function getExportFile(data: ProjectData, products: SingleUseProduct[]) {
  const workbook = new ExcelJS.Workbook();

  addSingleUseSheet(workbook, data, products);

  return workbook;
}

// Define Single-Use Worksheet
function addSingleUseSheet(workbook: ExcelJS.Workbook, data: ProjectData, products: SingleUseProduct[]) {
  const sheet = workbook.addWorksheet('Single-Use Items', worksheetOptions);

  function getProduct(item: { productId: string }): Partial<SingleUseProduct> {
    return products.find(product => product.id === item.productId) || {};
  }
  function getCategory(item: { category?: string }): string {
    return PRODUCT_CATEGORIES.find(category => category.id === item.category)?.name || '';
  }

  const dates: Date[] = [];
  data.singleUseItems.forEach(item => {
    item.records.forEach(record => {
      if (dates.every(d => d.toISOString() !== record.entryDate.toISOString())) {
        dates.push(record.entryDate);
      }
    });
  });
  // add today for new entry
  dates.sort().push(new Date());

  const columns: Partial<ExcelJS.Column>[] = [
    { header: 'Row id', key: 'id', width: 40, style: greyFill },
    { header: 'Category', key: 'categoryName', width: 40, style: greyFill },
    { header: 'Description', key: 'title', width: 40, style: greyFill },
    { header: ['', 'Units per case'], key: 'unitsPerCase', width: 10, style: greyFill },
    { header: ['', 'Case cost'], key: 'caseCost', width: 10, style: greyFill },
    { header: ['Baseline', 'Cases Purchased'], key: 'casesPurchased', width: 10, style: greyFill }
  ];

  // merge baseline columns
  sheet.mergeCells(1, 4, 1, 6);
  sheet.getCell(1, 4).alignment = { horizontal: 'center' };

  dates.forEach(date => {
    const columnName = `${date.toLocaleDateString()}`;
    const firstCol = columns.push({ header: ['', 'Units per case'], key: `${date}-unitsPerCase`, width: 10 });
    columns.push({ header: ['', 'Case cost'], key: `${date}-caseCost`, width: 10 });
    const lastCol = columns.push({ header: [columnName, 'Cases purchased'], key: `${date}-casesPurchased`, width: 10 });
    sheet.mergeCells(1, firstCol, 1, lastCol);
    sheet.getCell(1, firstCol).alignment = { horizontal: 'center' };
  });

  sheet.columns = columns;

  const rows: SheetRow[] = data.singleUseItems.map(item => {
    return {
      id: item.id,
      categoryName: getCategory(getProduct(item)),
      title: getProduct(item).description || '',
      unitsPerCase: item.unitsPerCase,
      caseCost: item.caseCost,
      casesPurchased: item.casesPurchased,
      ...dates.reduce((records, date) => {
        const record = item.records.find(record => record.entryDate.toISOString() === date.toISOString());
        return {
          ...records,
          [`${date}-unitsPerCase`]: record?.unitsPerCase || '',
          [`${date}-caseCost`]: record?.caseCost || '',
          [`${date}-casesPurchased`]: record?.casesPurchased || ''
        };
      }, {})
    };
  });

  sheet.addRows(rows);
}
