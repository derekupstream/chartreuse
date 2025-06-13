import { ShareAltOutlined } from '@ant-design/icons';
import { Button, message, Switch, Tooltip } from 'antd';
import { useState } from 'react';
import { useToggleShareProject } from 'client/projects';

export function ShareButton({ projectId, publicSlug: ogPublicSlug }: { projectId: string; publicSlug: string | null }) {
  const [publicSlug, setPublicSlug] = useState(ogPublicSlug);
  const { trigger: toggleShareProject, isMutating: isTogglingShare } = useToggleShareProject(projectId);

  const togglePublic = () => {
    const slug = Math.floor(Math.random() * 100000000)
      .toString()
      .padStart(8, '0');
    toggleShareProject({ publicSlug: publicSlug ? null : slug });
    setPublicSlug(publicSlug ? null : slug);
  };

  const copyLink = () => {
    const url = `${window.location.origin}/share/p/${publicSlug}`;
    navigator.clipboard.writeText(url);
    message.success('Link copied to clipboard');
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <Tooltip title='Toggle public sharing on/off'>
        <Switch
          checked={!!publicSlug}
          size='small'
          loading={isTogglingShare}
          onChange={togglePublic}
          style={{ marginRight: 8 }}
        />
      </Tooltip>
      <Button className='dont-print-me' disabled={!publicSlug} onClick={copyLink}>
        <ShareAltOutlined /> Share
      </Button>
    </div>
  );
}
