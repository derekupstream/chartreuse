import { WarningOutlined } from '@ant-design/icons';
import { Alert } from 'antd';
import Link from 'next/link';
import useSWR from 'swr';

import type { DuplicateReport } from 'lib/admin/duplicateDetector';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function DuplicatesBanner() {
  const { data } = useSWR<DuplicateReport>('/api/admin/duplicates', fetcher);
  const counts = data?.counts;
  if (!counts) return null;
  const total = counts.autoMerge + counts.emptyDelete + counts.needsReview;
  if (total === 0) return null;

  const parts: string[] = [];
  if (counts.needsReview > 0) parts.push(`${counts.needsReview} need review`);
  if (counts.autoMerge > 0) parts.push(`${counts.autoMerge} auto-mergeable`);
  if (counts.emptyDelete > 0) parts.push(`${counts.emptyDelete} empty`);

  return (
    <Alert
      type='warning'
      showIcon
      icon={<WarningOutlined />}
      style={{ marginBottom: 16 }}
      message={`${total} duplicate organization${total === 1 ? '' : 's'} detected`}
      description={
        <span>
          {parts.join(' · ')}.{' '}
          <Link href='/admin/duplicates'>
            <strong>Review and resolve →</strong>
          </Link>
        </span>
      }
    />
  );
}
