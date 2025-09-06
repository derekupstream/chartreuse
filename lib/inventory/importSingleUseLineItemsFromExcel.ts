import ExcelJS from 'exceljs';
import type { SingleUseLineItem } from '@prisma/client';

export interface ImportedSingleUseLineItem {
  productId: string;
  caseCost: number;
  casesPurchased: number;
  unitsPerCase: number;
  frequency: string; // Default to 'annually' since template shows annual data
}

export interface ImportResult {
  success: boolean;
  items: ImportedSingleUseLineItem[];
  errors: string[];
}

export function importSingleUseLineItemsFromExcel(file: Blob): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const wb = new ExcelJS.Workbook();
    const reader = new FileReader();

    reader.readAsArrayBuffer(file);
    reader.onload = () => {
      const buffer = reader.result as ArrayBuffer;
      wb.xlsx
        .load(buffer)
        .then(async workbook => {
          try {
            const result = convertWorkbookToSingleUseLineItems(workbook);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        })
        .catch(reject);
    };
  });
}

function convertWorkbookToSingleUseLineItems(workbook: ExcelJS.Workbook): ImportResult {
  const sheet = workbook.getWorksheet('userinputs');

  if (!sheet) {
    return {
      success: false,
      items: [],
      errors: ['Sheet "userinputs" not found in the Excel file']
    };
  }

  const items: ImportedSingleUseLineItem[] = [];
  const errors: string[] = [];

  // Find header row and column indices
  let headerRowIndex = -1;
  let productIdCol = -1;
  let costPerCaseCol = -1;
  let casesPurchasedCol = -1;
  let caseCountCol = -1;

  // Find the header row
  sheet.eachRow((row, rowIndex) => {
    const values = row.values as ExcelJS.CellValue[];
    const rowText = values.join(' ').toLowerCase();

    if (
      rowText.includes('product id') &&
      rowText.includes('cost per case') &&
      rowText.includes('cases purchased') &&
      rowText.includes('case count')
    ) {
      headerRowIndex = rowIndex;
      // Find column indices
      values.forEach((value, colIndex) => {
        const cellText = String(value).toLowerCase();
        if (cellText.includes('product id')) {
          productIdCol = colIndex;
        } else if (cellText.includes('cost per case')) {
          costPerCaseCol = colIndex;
        } else if (cellText.includes('cases purchased')) {
          casesPurchasedCol = colIndex;
        } else if (cellText.includes('case count')) {
          caseCountCol = colIndex;
        }
      });
    }
  });

  if (headerRowIndex === -1) {
    return {
      success: false,
      items: [],
      errors: [
        'Could not find header row with required columns: Product ID, Cost per case ($), Cases purchased annually, Case Count (Units per Case)'
      ]
    };
  }

  // Process data rows
  sheet.eachRow((row, rowIndex) => {
    if (rowIndex <= headerRowIndex) return; // Skip header rows

    const values = row.values as ExcelJS.CellValue[];

    // Skip empty rows
    if (
      values[costPerCaseCol] === undefined ||
      values[casesPurchasedCol] === undefined ||
      values[caseCountCol] === undefined
    ) {
      return;
    }

    const productId = getComputedValue(row, productIdCol)!.toString();
    const caseCost = getNumberValue(row, costPerCaseCol);
    const casesPurchased = getNumberValue(row, casesPurchasedCol);
    const unitsPerCase = getNumberValue(row, caseCountCol);

    // Validate required fields
    const rowErrors: string[] = [];

    if (!productId) {
      rowErrors.push(`Row ${rowIndex}: Product ID is required`);
    }

    if (caseCost === null || caseCost <= 0) {
      rowErrors.push(`Row ${rowIndex}: Cost per case must be a positive number`);
    }

    if (casesPurchased === null || casesPurchased <= 0) {
      rowErrors.push(`Row ${rowIndex}: Cases purchased must be a positive number`);
    }

    if (unitsPerCase === null || unitsPerCase <= 0) {
      rowErrors.push(`Row ${rowIndex}: Case count (units per case) must be a positive number`);
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
      return;
    }

    items.push({
      productId,
      caseCost: caseCost!,
      casesPurchased: casesPurchased!,
      unitsPerCase: unitsPerCase!,
      frequency: 'Annually' // Default frequency since template shows annual data
    });
  });

  return {
    success: errors.length === 0,
    items,
    errors
  };
}

function getNumberValue(row: ExcelJS.Row, index: number): number | null {
  const value = getValue(row, index);
  if (value === null) {
    return null;
  }
  if (typeof value === 'string') {
    return parseInt(value, 10);
  }
  return value;
}

function getComputedValue(row: ExcelJS.Row, index: number): string | number | null {
  const val = row.getCell(index).result;
  return typeof val === 'string' || typeof val === 'number' ? val : null;
}

function getValue(row: ExcelJS.Row, index: number): string | number | null {
  const val = row.getCell(index).value;
  return typeof val === 'string' || typeof val === 'number' ? val : null;
}
