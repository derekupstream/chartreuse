import { UploadOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useState } from 'react';

import { AiImportModal } from 'components/common/AiImportModal';

interface Props {
  projectId: string;
  onImport: () => void;
}

export function ImportButton({ projectId, onImport }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} icon={<UploadOutlined />}>
        Import
      </Button>
      <AiImportModal
        open={open}
        onClose={() => setOpen(false)}
        projectId={projectId}
        dataTypeHint='single-use-products'
        title='Import Single-Use Items'
        onImport={() => {
          setOpen(false);
          onImport();
        }}
      />
    </>
  );
}
