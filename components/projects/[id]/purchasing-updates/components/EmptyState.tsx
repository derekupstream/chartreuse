import { AddBlock, Placeholder } from '../../AdditionalCosts/components/ExpenseBlock';

import { DownloadButton } from './DownloadButton';

export function EmptyState({ projectId, onClickDownload }: { projectId: string; onClickDownload: () => void }) {
  return (
    <AddBlock>
      <DownloadButton projectId={projectId} onClick={onClickDownload} />
      <Placeholder>
        Download your Single Use item inventory to begin. Add records to the spreadsheet and upload it back here.
      </Placeholder>
    </AddBlock>
  );
}
