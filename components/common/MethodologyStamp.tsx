/**
 * The citation line at the bottom of anything that shows calculated numbers — the same way
 * an LCA study cites "ecoinvent 3.10". A project is pinned to the methodology its numbers
 * were computed under (Project.methodologyVersion) and never moves silently; this stamp is
 * how the reader knows which one, and the tooltip is where they learn what that means.
 * Scheme: docs/VERSIONING.md.
 */
import { Tooltip, Typography } from 'antd';

const { Text } = Typography;

export function MethodologyStamp({ version }: { version?: string | null }) {
  const shown = version || '1.0';
  return (
    <div style={{ textAlign: 'center', padding: '20px 0 8px' }} className='dont-print-me-not'>
      <Tooltip
        title='Chart-Reuse factors and calculation methods are versioned like software releases. This project stays on the methodology version it was calculated with until its owner upgrades it — cited numbers never change silently. Version changes and their reasons are documented in the methodology changelog.'
        overlayStyle={{ maxWidth: 380 }}
      >
        <Text type='secondary' style={{ fontSize: 12, cursor: 'help' }}>
          Calculated with Chart-Reuse Methodology v{shown}
        </Text>
      </Tooltip>
    </div>
  );
}
