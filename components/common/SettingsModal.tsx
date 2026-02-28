import { Modal, message } from 'antd';
import { useRouter } from 'next/router';
import { useState } from 'react';

import { OrgEditPage } from 'components/org/edit/OrgEditPage';
import chartreuseClient from 'lib/chartreuseClient';

type OrgSettings = {
  id: string;
  name: string;
  currency: string;
  useMetricSystem: boolean;
  useShrinkageRate: boolean;
};

type Props = {
  org: OrgSettings;
  open: boolean;
  onClose: () => void;
};

export function SettingsModal({ org, open, onClose }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(values: any) {
    setSaving(true);
    try {
      await chartreuseClient.updateOrganization(org.id, values);
      message.success('Settings saved');
      onClose();
      router.reload();
    } catch (err: any) {
      message.error(err?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title='Account Settings' open={open} onCancel={onClose} footer={null} width={420} destroyOnClose>
      <div style={{ paddingTop: 8 }}>
        <OrgEditPage initialValues={org} onSubmit={handleSubmit} isLoading={saving} onCancel={onClose} />
      </div>
    </Modal>
  );
}
