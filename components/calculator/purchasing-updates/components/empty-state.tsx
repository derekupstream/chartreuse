import { DownloadButton } from './download-button'
import { AddBlock, Placeholder } from '../../additional-costs/components/expense-block'

export function EmptyState({ projectId, onClickDownload }: { projectId: string; onClickDownload: () => void }) {
  return (
    <AddBlock>
      <DownloadButton projectId={projectId} onClick={onClickDownload} />
      <Placeholder>Download your Single Use item inventory to begin. Add records to the spreadsheet and upload it back here.</Placeholder>
    </AddBlock>
  )
}
