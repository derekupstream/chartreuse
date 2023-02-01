import { PaperClipOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { Button, Modal, Tooltip, message, Upload, Popconfirm, Typography } from 'antd';
import type { MouseEvent } from 'react';
import { useState } from 'react';

import chartreuseClient from 'lib/chartreuseClient';
import { importRecordsFromExcel } from 'lib/inventory/importRecordsFromExcel';
import type { InventoryInput } from 'lib/inventory/saveInventoryRecords';

import { DownloadButton } from './download-button';

const { Dragger } = Upload;

interface Props {
  showClear?: boolean;
  projectId: string;
  onUpload: () => void;
}

interface UploadFileState {
  error?: string;
  fileName?: string;
  result?: InventoryInput;
}

export function UploadButton({ projectId, showClear = false, onUpload }: Props) {
  const [open, setOpen] = useState(false);
  const [fileState, setFileState] = useState<UploadFileState>({});

  async function deleteData() {
    await chartreuseClient.deleteProjectInventory(projectId);
    onUpload();
  }

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
    // async onChange(info) {
    //   const { status } = info.file;
    //   if (status === 'done') {
    //     try {
    //       const result = info.file.originFileObj && (await importRecordsFromExcel(info.file.originFileObj));
    //       console.log('onChange done', result);
    //       setFileState({ fileName: info.file.name, result });
    //       //message.success(`${info.file.name} file uploaded successfully.`);
    //     } catch (error) {
    //       console.error('Error reading inventory spreadsheet', error);
    //       //message.error(`${info.file.name} file upload failed.`);
    //       setFileState({ error: (error as Error).message || 'Upload failed' });
    //     }
    //   } else if (status === 'error') {
    //     message.error(`${info.file.name} file upload failed.`);
    //   }
    // },
    // use beforeUpload (as opposed to onChange) to prevent automatic API call to upload file
    beforeUpload: async file => {
      try {
        const result = await importRecordsFromExcel(file);
        setFileState({ fileName: file.name, result });
      } catch (error) {
        console.error('Error reading inventory spreadsheet', error);
        setFileState({ error: (error as Error).message || 'Upload failed' });
      }
      // dont upload file automatically
      return false;
    }
  };

  async function uploadFile() {
    if (fileState.result) {
      try {
        await chartreuseClient.updateProjectInventory(projectId, fileState.result);
        hideModal();
        message.success('File uploaded successfully');
        onUpload();
      } catch (error) {
        console.error('Error uploading inventory spreadsheet', error);
        message.error('File upload failed');
      }
    }
  }

  return (
    <div style={{ display: 'flex', gap: '1em' }}>
      {showClear && (
        <Tooltip title='Remove all Actuals data'>
          <Popconfirm title='Are you sure to delete all existing Actuals data?' onConfirm={deleteData} okText='Yes' cancelText='No'>
            <Button type='text'>
              <DeleteOutlined /> Delete
            </Button>
          </Popconfirm>
        </Tooltip>
      )}
      <Button type='primary' onClick={showModal}>
        <UploadOutlined /> Upload
      </Button>
      <Modal
        open={open}
        title='Upload your tracking spreadsheet'
        //onOk={handleOk}
        onCancel={hideModal}
        footer={null}
      >
        <Dragger {...uploadButtonProps}>{Boolean(fileState.result || fileState.error) ? <InventoryFilePreview state={fileState} /> : <EmptyFileState />}</Dragger>
        {/* {Boolean(fileState.result || fileState.error) && (
          <div className='ant-upload ant-upload-drag' style={{ cursor: 'default', padding: '16px 0', background: 'transparent', marginTop: '.5em' }}>
            <InventoryFilePreview state={fileState} />
          </div>
        )} */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
          <DownloadButton projectId={projectId} label='Download spreadsheet' type='text' size='middle' />
          <Button disabled={!fileState.result} type='primary' onClick={uploadFile}>
            Upload
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function EmptyFileState() {
  return (
    <>
      <p className='ant-upload-drag-icon'>
        <InboxOutlined />
      </p>
      <p className='ant-upload-text'>Click or drag a file to this area to upload</p>
      <p className='ant-upload-hint'>Download the tracking spreadsheet to update your purchases.</p>
    </>
  );
}

function InventoryFilePreview({ state }: { state: UploadFileState }) {
  if (state.error) {
    return (
      <>
        <Typography.Text type='danger'>
          Invalid File
          <br />
          {state.error}
        </Typography.Text>
      </>
    );
  }
  if (!state.result) {
    return null;
  }
  const recordsWindow: { start?: string; end?: string } = {};
  state.result.singleUseItems.forEach(item => {
    item.records.forEach(record => {
      if (!recordsWindow.start || record.entryDate < recordsWindow.start) {
        recordsWindow.start = record.entryDate;
      }
      if (!recordsWindow.end || record.entryDate > recordsWindow.end) {
        recordsWindow.end = record.entryDate;
      }
    });
  });

  let message = 'No records found - upload to clear history';
  if (recordsWindow.start && recordsWindow.end) {
    let dateStr = 'from ' + new Date(recordsWindow.start).toLocaleDateString();
    if (recordsWindow.start !== recordsWindow.end) {
      dateStr += ' to ' + new Date(recordsWindow.end).toLocaleDateString();
    }
    message = `Purchase records ${dateStr}`;
  }
  return (
    <>
      <p className='ant-upload-drag-icon'>
        <PaperClipOutlined />
      </p>
      <p className='ant-upload-text'>{message}</p>
      <p className='ant-upload-hint'>{state.fileName}</p>
    </>
  );
}
