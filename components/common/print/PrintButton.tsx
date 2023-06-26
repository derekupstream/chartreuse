import { PrinterOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import type { MutableRefObject } from 'react';
import { useReactToPrint } from 'react-to-print';

export function PrintButton({ printRef, pdfTitle }: { printRef: MutableRefObject<any>; pdfTitle: string }) {
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: pdfTitle
    // onBeforeGetContent: () => {
    //   // remove the print button
    //   const printButton = content.querySelector('.print-button')
    //   printButton?.remove()
    // }

    // onAfterPrint: () => setPrinting(false),
    // make sure this returns a promise for the library
    // onBeforeGetContent: async () => {
    //   // Modify the page here, for example, by setting state:
    //   setPrinting(true);
    // }
  });
  return (
    <Button className='dont-print-me' onClick={handlePrint}>
      <PrinterOutlined /> Print
    </Button>
  );
}
