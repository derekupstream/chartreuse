import { CopyOutlined, LinkOutlined, ShareAltOutlined } from '@ant-design/icons';
import { Button, Input, message, Popover, Switch, Tooltip, Typography } from 'antd';
import { useState } from 'react';

import { useDisableAnalyticsShare, useEnableAnalyticsShare } from 'client/projects';

type FilterParams = {
  tags?: string[];
  projectTypes?: string[];
  startDate?: string | null;
  endDate?: string | null;
};

type Props = {
  orgId: string;
  initialSlug: string | null;
  filterParams?: FilterParams;
  currentScope?: 'projections' | 'actuals' | 'scenarios';
};

export function ShareAnalyticsButton({ orgId, initialSlug, filterParams, currentScope }: Props) {
  const [analyticsSlug, setAnalyticsSlug] = useState(initialSlug);
  const [open, setOpen] = useState(false);

  const { trigger: enableShare, isMutating: isEnabling } = useEnableAnalyticsShare();
  const { trigger: disableShare, isMutating: isDisabling } = useDisableAnalyticsShare();

  const isMutating = isEnabling || isDisabling;

  function buildShareUrl(slug: string): string {
    const base = `${window.location.origin}/share/analytics/${slug}`;
    if (!filterParams) return base;
    const parts: string[] = [];
    if (filterParams.tags?.length) parts.push(`tags=${filterParams.tags.join(',')}`);
    if (filterParams.projectTypes?.length) parts.push(`projectTypes=${filterParams.projectTypes.join(',')}`);
    if (filterParams.startDate) parts.push(`startDate=${filterParams.startDate}`);
    if (filterParams.endDate) parts.push(`endDate=${filterParams.endDate}`);
    return parts.length ? `${base}?${parts.join('&')}` : base;
  }

  const shareUrl = analyticsSlug && typeof window !== 'undefined' ? buildShareUrl(analyticsSlug) : '';

  async function enable() {
    const result = await enableShare();
    setAnalyticsSlug(result?.analyticsSlug ?? null);
  }

  async function disable() {
    await disableShare();
    setAnalyticsSlug(null);
  }

  function copyLink() {
    navigator.clipboard.writeText(shareUrl);
    message.success('Link copied to clipboard');
  }

  const scopeLabel =
    currentScope === 'actuals' ? 'Actuals' : currentScope === 'scenarios' ? 'Scenarios' : 'Projections';

  const content = (
    <div style={{ width: 320 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <Typography.Text strong>Share analytics</Typography.Text>
        <Switch
          checked={!!analyticsSlug}
          loading={isMutating}
          onChange={checked => (checked ? enable() : disable())}
          size='small'
        />
      </div>
      <Typography.Text type='secondary' style={{ fontSize: 11, display: 'block', marginBottom: 12 }}>
        Sharing: <strong>{scopeLabel}</strong> view
      </Typography.Text>

      {analyticsSlug ? (
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
            <Button size='small' href={shareUrl} target='_blank' icon={<LinkOutlined />}>
              Preview
            </Button>
          </div>
        </>
      ) : (
        <Typography.Text type='secondary' style={{ fontSize: 12 }}>
          Share your analytics dashboard so anyone with the link can view your impact summary.
        </Typography.Text>
      )}
    </div>
  );

  return (
    <Popover content={content} title={null} trigger='click' open={open} onOpenChange={setOpen} placement='bottomRight'>
      <Button className='dont-print-me'>
        <ShareAltOutlined /> Share
      </Button>
    </Popover>
  );
}
