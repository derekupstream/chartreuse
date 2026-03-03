import { CopyOutlined, LinkOutlined, SettingOutlined, ShareAltOutlined } from '@ant-design/icons';
import { Button, Input, message, Popover, Switch, Tooltip, Typography } from 'antd';
import { useState } from 'react';
import { useToggleShareProject } from 'client/projects';
import { ShareSettingsModal } from './ShareSettingsModal';

export function ShareButton({ projectId, publicSlug: ogPublicSlug }: { projectId: string; publicSlug: string | null }) {
  const [publicSlug, setPublicSlug] = useState(ogPublicSlug);
  const { trigger: toggleShareProject, isMutating } = useToggleShareProject(projectId);
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const shareUrl = publicSlug
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/share/p/${publicSlug}`
    : '';

  async function enableSharing() {
    const slug = Math.random().toString(36).substr(2, 10);
    await toggleShareProject({ publicSlug: slug });
    setPublicSlug(slug);
  }

  async function disableSharing() {
    await toggleShareProject({ publicSlug: null });
    setPublicSlug(null);
  }

  function copyLink() {
    navigator.clipboard.writeText(shareUrl);
    message.success('Link copied to clipboard');
  }

  const content = (
    <div style={{ width: 320 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Typography.Text strong>Public sharing</Typography.Text>
        <Switch
          checked={!!publicSlug}
          loading={isMutating}
          onChange={checked => (checked ? enableSharing() : disableSharing())}
          size='small'
        />
      </div>

      {publicSlug ? (
        <>
          <Input
            value={shareUrl}
            readOnly
            size='small'
            style={{ marginBottom: 8, fontSize: 12, color: 'rgba(0,0,0,0.65)' }}
            suffix={
              <Tooltip title='Copy link'>
                <CopyOutlined onClick={copyLink} style={{ cursor: 'pointer', color: '#1890ff' }} />
              </Tooltip>
            }
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <Button size='small' style={{ flex: 1 }} onClick={copyLink} icon={<CopyOutlined />}>
              Copy link
            </Button>
            <Button size='small' href={`/share/p/${publicSlug}`} target='_blank' icon={<LinkOutlined />}>
              Preview
            </Button>
            <Tooltip title='Share settings'>
              <Button
                size='small'
                icon={<SettingOutlined />}
                onClick={() => {
                  setOpen(false);
                  setSettingsOpen(true);
                }}
              />
            </Tooltip>
          </div>
        </>
      ) : (
        <Typography.Text type='secondary' style={{ fontSize: 12 }}>
          Enable sharing to generate a public link anyone can view without logging in.
        </Typography.Text>
      )}
    </div>
  );

  return (
    <>
      <Popover
        content={content}
        title={null}
        trigger='click'
        open={open}
        onOpenChange={setOpen}
        placement='bottomRight'
      >
        <Button className='dont-print-me'>
          <ShareAltOutlined /> Share
        </Button>
      </Popover>

      <ShareSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        projectId={projectId}
        publicSlug={publicSlug}
        onPublicSlugChange={slug => setPublicSlug(slug)}
      />
    </>
  );
}
