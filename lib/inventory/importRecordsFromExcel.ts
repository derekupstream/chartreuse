import ExcelJS from 'exceljs';

import { isValidDateString } from 'lib/dates';

import type { InventoryInput, SingleUseRecord } from './saveInventoryRecords';

export function importRecordsFromExcel(file: File): Promise<InventoryInput> {
  return new Promise((resolve, reject) => {
    const wb = new ExcelJS.Workbook();
    const reader = new FileReader();

    reader.readAsArrayBuffer(file);
    reader.onload = () => {
      const buffer = reader.result as ArrayBuffer;
      wb.xlsx
        .load(buffer)
        .then(async workbook => {
          console.log('columns', workbook.worksheets[0].columns);
          const inventoryInput = convertWorkbookToInventoryInput(workbook);
          resolve(inventoryInput);
        })
        .catch(reject);
    };
  });
}

function convertWorkbookToInventoryInput(workbook: ExcelJS.Workbook): InventoryInput {
  const sheet = workbook.worksheets[0];
  const entryDates: string[] = [];
  const singleUseItems: InventoryInput['singleUseItems'] = [];
  sheet.eachRow((row, rowIndex) => {
    // first row is table headers
    if (rowIndex === 1 && row.values.length) {
      for (let i = 7; i < row.values.length; i = i + 3) {
        const dateString = (row.values as string[])[i];
        if (!isValidDateString(dateString)) {
          throw new Error('Invalid date column: ' + dateString);
        }
        entryDates.push(dateString);
      }
    }
    // skip the 2nd row which is used for subheaders
    else if (rowIndex > 2) {
      singleUseItems.push({
        id: getValue(row, 1) as string,
        records: entryDates
          .map((entryDate, index) => {
            const startIndex: number = 7 + index * 3;
            console.log({
              entryDate: entryDate,
              unitsPerCase: getNumberValue(row, startIndex),
              caseCost: getNumberValue(row, startIndex + 1),
              casesPurchased: getNumberValue(row, startIndex + 2)
            });
            return {
              entryDate: entryDate,
              unitsPerCase: getNumberValue(row, startIndex),
              caseCost: getNumberValue(row, startIndex + 1),
              casesPurchased: getNumberValue(row, startIndex + 2)
            };
          })
          // ignore any rows with empty values
          .filter(isCompleteRecord)
      });
    }
  });
  return {
    singleUseItems
  };
}

// check for undefined values
function isCompleteRecord(record: any): record is SingleUseRecord {
  return !(record.caseCost === null || record.casesPurchased === null || record.unitsPerCase === null);
}

function getNumberValue(row: ExcelJS.Row, index: number): number | null {
  const value = getValue(row, index);
  if (typeof value === 'string') {
    return parseInt(value, 10);
  }
  return value;
}

function getValue(row: ExcelJS.Row, index: number): string | number | null {
  const val = row.getCell(index).value;
  console.log('val', index, val);
  return typeof val === 'string' || typeof val === 'number' ? val : null;
}
