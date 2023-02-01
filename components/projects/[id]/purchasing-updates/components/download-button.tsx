import { DownloadOutlined } from '@ant-design/icons';
import { Button } from 'antd';

import { requestDownload } from 'lib/files';

interface Props {
  projectId: string;
  onClick?: () => void;
  label?: string;
  size?: 'large' | 'middle' | 'small';
  type?: 'primary' | 'text' | 'default';
}

export function DownloadButton({ projectId, onClick, label = 'Download', size = 'large', type = 'primary' }: Props) {
  function exportData() {
    requestDownload({
      api: `/api/projects/${projectId}/inventory/download`,
      title: `Chart Reuse Inventory`
    });
    onClick?.();
  }

  return (
    <Button size={size} type={type} onClick={exportData}>
      <DownloadOutlined /> {label}
    </Button>
  );
}
