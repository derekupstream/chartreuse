import {
  CopyOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  LoadingOutlined,
  UploadOutlined
} from '@ant-design/icons';
import {
  Button,
  Col,
  Divider,
  Input,
  message,
  Modal,
  Radio,
  Row,
  Segmented,
  Switch,
  Tooltip,
  Typography,
  Upload
} from 'antd';
import type { UploadChangeParam, UploadFile } from 'antd/es/upload';
import { useCallback, useRef, useState } from 'react';
import styled from 'styled-components';

import { useGetShareSettings, useUpdateShareSettings } from 'client/projects';
import type { ShareSettings } from 'pages/api/projects/[id]/share-settings';
import { useToggleShareProject } from 'client/projects';

const Section = styled.div`
  padding: 16px 0;
`;

const Label = styled(Typography.Text)`
  display: block;
  font-weight: 600;
  margin-bottom: 4px;
`;

const Hint = styled(Typography.Text)`
  display: block;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  margin-top: 4px;
`;

const BannerPreview = styled.div<{ $url: string }>`
  width: 100%;
  height: 100px;
  border-radius: 8px;
  background: ${({ $url }) => ($url ? `url(${$url}) center/cover no-repeat` : '#95ee49')};
  margin-bottom: 8px;
  border: 1px solid #e8e8e8;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
`;

type Segment = 'share' | 'banner' | 'sliders' | 'tooltips' | 'users';

type Props = {
  open: boolean;
  onClose: () => void;
  projectId: string;
  publicSlug: string | null;
  onPublicSlugChange: (slug: string | null) => void;
};

export function ShareSettingsModal({ open, onClose, projectId, publicSlug, onPublicSlugChange }: Props) {
  const [segment, setSegment] = useState<Segment>('share');
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: settingsData, mutate: refetchSettings } = useGetShareSettings(projectId);
  const { trigger: updateSettings, isMutating: isSaving } = useUpdateShareSettings(projectId);
  const { trigger: toggleShareProject, isMutating: isTogglingShare } = useToggleShareProject(projectId);

  const settings: ShareSettings = settingsData?.shareSettings ?? {};

  const shareUrl = publicSlug && typeof window !== 'undefined' ? `${window.location.origin}/share/p/${publicSlug}` : '';

  async function enableSharing() {
    const slug = Math.random().toString(36).substr(2, 10);
    await toggleShareProject({ publicSlug: slug });
    onPublicSlugChange(slug);
  }

  async function disableSharing() {
    await toggleShareProject({ publicSlug: null });
    onPublicSlugChange(null);
  }

  function copyLink() {
    navigator.clipboard.writeText(shareUrl);
    message.success('Link copied to clipboard');
  }

  async function saveSettings(patch: Partial<ShareSettings>) {
    const updated = { ...settings, ...patch };
    await updateSettings(updated);
    await refetchSettings();
  }

  async function handleBannerUpload(file: File) {
    setUploadingBanner(true);
    try {
      const reader = new FileReader();
      const base64: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch(`/api/projects/${projectId}/banner-upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileData: base64, mimeType: file.type })
      });

      if (!res.ok) throw new Error('Upload failed');
      const { url } = await res.json();
      await saveSettings({ bannerImageUrl: url });
      message.success('Banner uploaded');
    } catch {
      message.error('Failed to upload banner');
    } finally {
      setUploadingBanner(false);
    }
  }

  function removeBanner() {
    saveSettings({ bannerImageUrl: null });
  }

  const segments: { value: Segment; label: string }[] = [
    { value: 'share', label: 'Share' },
    { value: 'banner', label: 'Banner' },
    { value: 'sliders', label: 'Sliders' },
    { value: 'tooltips', label: 'Tooltips' },
    { value: 'users', label: 'Users' }
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title='Project Settings'
      width='min(640px, 95vw)'
      styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
    >
      <Segmented
        value={segment}
        onChange={v => setSegment(v as Segment)}
        options={segments}
        block
        style={{ marginBottom: 16 }}
      />

      {segment === 'share' && (
        <Section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <Label>Public sharing</Label>
              <Hint>Anyone with the link can view without logging in.</Hint>
            </div>
            <Switch
              checked={!!publicSlug}
              loading={isTogglingShare}
              onChange={checked => (checked ? enableSharing() : disableSharing())}
            />
          </div>

          {publicSlug && (
            <>
              <Input
                value={shareUrl}
                readOnly
                size='small'
                style={{ marginBottom: 8, fontSize: 12 }}
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
              </div>
            </>
          )}
        </Section>
      )}

      {segment === 'banner' && (
        <Section>
          <Label>Banner image</Label>
          <Hint>Displays behind the green header on the public dashboard.</Hint>

          <BannerPreview $url={settings.bannerImageUrl ?? ''} style={{ marginTop: 12 }}>
            {!settings.bannerImageUrl && (
              <Typography.Text type='secondary' style={{ fontSize: 11 }}>
                Preview — default green banner
              </Typography.Text>
            )}
          </BannerPreview>

          <input
            ref={fileInputRef}
            type='file'
            accept='image/*'
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleBannerUpload(file);
            }}
          />

          <Row gutter={8}>
            <Col>
              <Button
                icon={uploadingBanner ? <LoadingOutlined /> : <UploadOutlined />}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingBanner}
              >
                {settings.bannerImageUrl ? 'Replace image' : 'Upload image'}
              </Button>
            </Col>
            {settings.bannerImageUrl && (
              <Col>
                <Button icon={<DeleteOutlined />} danger onClick={removeBanner}>
                  Remove
                </Button>
              </Col>
            )}
          </Row>

          <Hint style={{ marginTop: 8 }}>PNG, JPG, or WebP. Max 8 MB.</Hint>
        </Section>
      )}

      {segment === 'sliders' && (
        <Section>
          <Label>Interactive slider</Label>
          <Hint style={{ marginBottom: 12 }}>
            Adds a control on the public dashboard so viewers can explore different scenarios.
          </Hint>

          <div style={{ marginBottom: 16 }}>
            <Typography.Text style={{ display: 'block', marginBottom: 8 }}>Slider type</Typography.Text>
            <Radio.Group
              value={settings.sliderType ?? null}
              onChange={e => saveSettings({ sliderType: e.target.value })}
            >
              <Radio value={null}>None</Radio>
              <Radio value='timeline'>Timeline (1yr / 2yr / 5yr)</Radio>
              <Radio value='customers'>Daily volume</Radio>
            </Radio.Group>
          </div>

          {settings.sliderType === 'customers' && (
            <div>
              <Typography.Text style={{ display: 'block', marginBottom: 8 }}>Label for viewers</Typography.Text>
              <Radio.Group
                value={settings.customerLabel ?? 'customers'}
                onChange={e => saveSettings({ customerLabel: e.target.value })}
              >
                <Radio value='customers'>Customers</Radio>
                <Radio value='students'>Students</Radio>
              </Radio.Group>
            </div>
          )}
        </Section>
      )}

      {segment === 'tooltips' && (
        <Section>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <Label>Explanation tooltips</Label>
              <Hint>
                Shows small <InfoCircleOutlined style={{ color: '#1890ff' }} /> icons on the public dashboard that
                viewers can hover/tap for explanations of each metric.
              </Hint>
            </div>
            <Switch
              checked={!!settings.showTooltips}
              loading={isSaving}
              onChange={checked => saveSettings({ showTooltips: checked })}
            />
          </div>
        </Section>
      )}

      {segment === 'users' && (
        <Section>
          <Label>User access</Label>
          <Hint>Manage who can view and edit this project.</Hint>
          <Divider style={{ margin: '16px 0' }} />
          <Typography.Text type='secondary' style={{ fontSize: 13 }}>
            User access controls are coming soon. Currently all members of your organization can view and edit projects
            they have access to.
          </Typography.Text>
        </Section>
      )}
    </Modal>
  );
}
