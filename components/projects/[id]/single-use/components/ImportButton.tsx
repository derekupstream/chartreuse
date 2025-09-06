import { UploadOutlined, FileExcelOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { Button, Modal, message, Upload, Typography, List, Alert } from 'antd';
import { useState } from 'react';

import chartreuseClient from 'lib/chartreuseClient';
import { importSingleUseLineItemsFromExcel } from 'lib/inventory/importSingleUseLineItemsFromExcel';
import type { ImportedSingleUseLineItem, ImportResult } from 'lib/inventory/importSingleUseLineItemsFromExcel';

const { Dragger } = Upload;
const { Text } = Typography;

interface Props {
  projectId: string;
  onImport: () => void;
}

interface ImportFileState {
  error?: string;
  result?: ImportResult;
  fileName?: string;
}

export function ImportButton({ projectId, onImport }: Props) {
  const [open, setOpen] = useState(false);
  const [fileState, setFileState] = useState<ImportFileState>({});
  const [isUploading, setIsUploading] = useState(false);

  function showModal() {
    setOpen(true);
  }

  function hideModal() {
    setOpen(false);
    setFileState({});
  }

  const uploadButtonProps: UploadProps = {
    name: 'file',
    accept: '.xlsx',
    maxCount: 1,
    showUploadList: false,
    beforeUpload: async file => {
      try {
        const result = await importSingleUseLineItemsFromExcel(file);
        setFileState({ fileName: file.name, result });
      } catch (error) {
        console.error('Error reading Excel file', error);
        setFileState({ error: (error as Error).message || 'Failed to read file' });
      }
      // Don't upload file automatically
      return false;
    }
  };

  async function importFile() {
    if (!fileState.result) return;

    setIsUploading(true);
    try {
      await chartreuseClient.bulkImportSingleUseLineItems(projectId, fileState.result.items);
      hideModal();
      message.success(`Successfully imported ${fileState.result.items.length} items`);
      onImport();
    } catch (error) {
      console.error('Error importing single-use line items', error);
      message.error('Import failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }

  const canImport = fileState.result?.success && fileState.result.items.length > 0;

  return (
    <>
      <Button onClick={showModal} icon={<UploadOutlined />}>
        Import
      </Button>

      <Modal
        open={open}
        onCancel={hideModal}
        title='Import Single-Use Items from Excel'
        width={600}
        footer={[
          <Button key='cancel' onClick={hideModal}>
            Cancel
          </Button>,
          <Button key='import' type='primary' onClick={importFile} disabled={!canImport} loading={isUploading}>
            Import {fileState.result?.items.length || 0} Items
          </Button>
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <Text>
            Upload an Excel file with a "userinputs" sheet containing your single-use item data. The file should have
            columns: Product ID, Cost per case ($), Cases purchased annually, and Case Count (Units per Case).
          </Text>
        </div>

        <Dragger {...uploadButtonProps} style={{ marginBottom: 16 }}>
          <p className='ant-upload-drag-icon'>
            <FileExcelOutlined />
          </p>
          <p className='ant-upload-text'>Click or drag Excel file to this area to upload</p>
          <p className='ant-upload-hint'>Support for .xlsx files only</p>
        </Dragger>

        {fileState.error && (
          <Alert message='Error' description={fileState.error} type='error' style={{ marginBottom: 16 }} />
        )}

        {fileState.result && !fileState.result.success && fileState.result.errors.length > 0 && (
          <Alert
            message='Validation Errors'
            description={
              <List
                size='small'
                dataSource={fileState.result.errors}
                renderItem={error => <List.Item>{error}</List.Item>}
              />
            }
            type='error'
            style={{ marginBottom: 16 }}
          />
        )}

        {fileState.result && fileState.result.success && (
          <Alert
            message={`Ready to import ${fileState.result.items.length} items`}
            description={`File: ${fileState.fileName}`}
            type='success'
            style={{ marginBottom: 16 }}
          />
        )}

        {fileState.result && fileState.result.items.length > 0 && (
          <div>
            <Text strong>Preview of items to be imported:</Text>
            <List
              size='small'
              dataSource={fileState.result.items.slice(0, 5)} // Show first 5 items
              renderItem={item => (
                <List.Item>
                  <Text>
                    Product ID: {item.productId} | Cost: ${item.caseCost} | Cases: {item.casesPurchased} | Units per
                    case: {item.unitsPerCase}
                  </Text>
                </List.Item>
              )}
            />
            {fileState.result.items.length > 5 && (
              <Text type='secondary'>... and {fileState.result.items.length - 5} more items</Text>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
