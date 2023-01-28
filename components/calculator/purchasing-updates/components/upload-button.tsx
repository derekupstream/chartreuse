import { Button, Tooltip, message, Upload, Popconfirm, UploadProps } from 'antd'
import { DeleteOutlined, UploadOutlined } from '@ant-design/icons'
import { importRecordsFromExcel } from 'lib/inventory/importRecordsFromExcel'
import chartreuseClient from 'lib/chartreuseClient'
import { DownloadButton } from './download-button'

interface Props {
  showClear?: boolean
  projectId: string
  onUpload: () => void
}

export function UploadButton({ projectId, showClear = false, onUpload }: Props) {
  async function deleteData() {
    await chartreuseClient.deleteProjectInventory(projectId)
    onUpload()
  }

  const props: UploadProps = {
    name: 'file',
    accept: '.xlsx',
    showUploadList: false,
    beforeUpload: async file => {
      try {
        const result = await importRecordsFromExcel(file)
        await chartreuseClient.updateProjectInventory(projectId, result)
        message.success(`${file.name} file uploaded successfully`)
        onUpload()
      } catch (error) {
        message.error(`${file.name} file upload failed.`)
      }
      // dont upload file automatically
      return false
    },
  }

  return (
    <div style={{ display: 'flex', gap: '1em' }}>
      {showClear && (
        <Tooltip title="Remove all Actuals data">
          <Popconfirm title="Are you sure to delete all existing Actuals data?" onConfirm={deleteData} okText="Yes" cancelText="No">
            <Button type="text">
              <DeleteOutlined /> Delete
            </Button>
          </Popconfirm>
        </Tooltip>
      )}
      <DownloadButton projectId={projectId} type="default" size="middle" />
      <Tooltip
        title={
          <>
            How to update Actuals:
            <br />
            1. Download Actuals spreadsheet
            <br />
            2. Add or update records
            <br />
            3. Upload back to Chart Reuse
          </>
        }
      >
        <Upload {...props}>
          <Button type="primary">
            <UploadOutlined /> Upload
          </Button>
        </Upload>
      </Tooltip>
    </div>
  )
}
