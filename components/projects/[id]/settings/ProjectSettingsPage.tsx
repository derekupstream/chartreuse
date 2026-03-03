import { DeleteOutlined, InfoCircleOutlined, LinkOutlined, LoadingOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Col, Divider, Input, message, Radio, Row, Segmented, Switch, Tooltip, Typography } from 'antd';
import { useRef, useState } from 'react';
import styled from 'styled-components';

import { useGetShareSettings, useToggleShareProject, useUpdateShareSettings } from 'client/projects';
import type { ShareSettings } from 'pages/api/projects/[id]/share-settings';

const PageWrapper = styled.div`
  padding: 24px 0;
  max-width: 680px;
`;

const Section = styled.div`
  padding: 20px 0;
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
  height: 120px;
  border-radius: 8px;
  background: ${({ $url }) => ($url ? `url(${$url}) center/cover no-repeat` : '#95ee49')};
  margin: 12px 0 8px;
  border: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: center;
`;

type Segment = 'share' | 'banner' | 'sliders' | 'tooltips' | 'users';

type Props = {
  projectId: string;
  publicSlug: string | null;
  onPublicSlugChange: (slug: string | null) => void;
};

export function ProjectSettingsPage({ projectId, publicSlug, onPublicSlugChange }: Props) {
  const [segment, setSegment] = useState<Segment>('share');
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentSlug, setCurrentSlug] = useState(publicSlug);

  const { data: settingsData, mutate: refetchSettings } = useGetShareSettings(projectId);
  const { trigger: updateSettings, isMutating: isSaving } = useUpdateShareSettings(projectId);
  const { trigger: toggleShareProject, isMutating: isTogglingShare } = useToggleShareProject(projectId);

  const settings: ShareSettings = settingsData?.shareSettings ?? {};

  const shareUrl =
    currentSlug && typeof window !== 'undefined' ? `${window.location.origin}/share/p/${currentSlug}` : '';

  async function enableSharing() {
    const slug = Math.random().toString(36).substr(2, 10);
    await toggleShareProject({ publicSlug: slug });
    setCurrentSlug(slug);
    onPublicSlugChange(slug);
  }

  async function disableSharing() {
    await toggleShareProject({ publicSlug: null });
    setCurrentSlug(null);
    onPublicSlugChange(null);
  }

  function copyLink() {
    navigator.clipboard.writeText(shareUrl);
    message.success('Link copied to clipboard');
  }

  async function saveSettings(patch: Partial<ShareSettings>) {
    await updateSettings({ ...settings, ...patch });
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

  const segments: { value: Segment; label: string }[] = [
    { value: 'share', label: 'Share' },
    { value: 'banner', label: 'Banner' },
    { value: 'sliders', label: 'Sliders' },
    { value: 'tooltips', label: 'Tooltips' },
    { value: 'users', label: 'Users' }
  ];

  return (
    <PageWrapper>
      <Typography.Title level={3} style={{ marginBottom: 4 }}>
        Project Settings
      </Typography.Title>
      <Typography.Text type='secondary' style={{ marginBottom: 24, display: 'block' }}>
        Configure how this project appears when shared publicly.
      </Typography.Text>

      <Segmented
        value={segment}
        onChange={v => setSegment(v as Segment)}
        options={segments}
        style={{ marginBottom: 8 }}
      />

      <Divider style={{ margin: '0 0 4px' }} />

      {segment === 'share' && (
        <Section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <Label>Public sharing</Label>
              <Hint>Anyone with the link can view this dashboard without logging in.</Hint>
            </div>
            <Switch
              checked={!!currentSlug}
              loading={isTogglingShare}
              onChange={checked => (checked ? enableSharing() : disableSharing())}
            />
          </div>

          {currentSlug && (
            <>
              <Input value={shareUrl} readOnly style={{ marginBottom: 8, fontSize: 13, color: 'rgba(0,0,0,0.65)' }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <Button onClick={copyLink} icon={<LinkOutlined />}>
                  Copy link
                </Button>
                <Button href={`/share/p/${currentSlug}`} target='_blank'>
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
          <Hint>Replaces the default green header background on the public dashboard.</Hint>

          <BannerPreview $url={settings.bannerImageUrl ?? ''}>
            {!settings.bannerImageUrl && (
              <Typography.Text type='secondary' style={{ fontSize: 12 }}>
                Default green banner
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

          <Row gutter={8} style={{ marginTop: 8 }}>
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
                <Button icon={<DeleteOutlined />} danger onClick={() => saveSettings({ bannerImageUrl: null })}>
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
          <Hint style={{ marginBottom: 16 }}>
            Adds an interactive control to the public dashboard so viewers can explore different scenarios.
          </Hint>

          <div style={{ marginBottom: 20 }}>
            <Typography.Text style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Slider type
            </Typography.Text>
            <Radio.Group
              value={settings.sliderType ?? null}
              onChange={e => saveSettings({ sliderType: e.target.value })}
            >
              <Radio value={null} style={{ display: 'block', marginBottom: 8 }}>
                None
              </Radio>
              <Radio value='timeline' style={{ display: 'block', marginBottom: 8 }}>
                Timeline — scale projections over 1, 2, or 5 years
              </Radio>
              <Radio value='customers' style={{ display: 'block' }}>
                Daily volume — adjust daily customer/student count
              </Radio>
            </Radio.Group>
          </div>

          {settings.sliderType === 'customers' && (
            <div style={{ padding: '16px', background: '#f9f9f7', borderRadius: 8 }}>
              <Typography.Text style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                What do you call the people you serve?
              </Typography.Text>
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
                Shows <InfoCircleOutlined style={{ color: '#1890ff' }} /> icons on the public dashboard. Viewers can
                hover or tap them to learn what each metric means — great for presentations and first-time viewers.
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
    </PageWrapper>
  );
}
