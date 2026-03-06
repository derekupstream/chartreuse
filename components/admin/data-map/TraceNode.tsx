import type { NodeProps } from 'reactflow';
import { Handle, Position } from 'reactflow';

const HEALTH_COLORS: Record<string, string> = {
  error: '#ff4d4f',
  warning: '#faad14'
};

export function TraceNode({ data }: NodeProps) {
  const subtitle = data.subtitle as string | undefined;
  const signal = data.healthSignal as string | null;
  const severity = data.healthSeverity as string | null;
  const dimmed = data.dimmed as boolean | undefined;

  return (
    <>
      <Handle type='target' position={Position.Left} style={{ opacity: 0 }} />
      <div
        style={{
          padding: '8px 14px',
          fontSize: 12,
          textAlign: 'center',
          minWidth: 140,
          opacity: dimmed ? 0.25 : 1,
          transition: 'opacity 0.2s'
        }}
      >
        <div style={{ fontWeight: 600 }}>{data.label as string}</div>
        {subtitle && <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{subtitle}</div>}
        {signal && (
          <div style={{ fontSize: 10, color: HEALTH_COLORS[severity ?? 'warning'], marginTop: 3, fontWeight: 500 }}>
            {severity === 'error' ? '\u274C' : '\u26A0\uFE0F'} {signal}
          </div>
        )}
      </div>
      <Handle type='source' position={Position.Right} style={{ opacity: 0 }} />
    </>
  );
}
