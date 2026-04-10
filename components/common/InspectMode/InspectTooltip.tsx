import { Popover, Tag, Typography } from 'antd';
import { AimOutlined } from '@ant-design/icons';
import styled from 'styled-components';

import { useInspectMode } from './InspectModeContext';

const { Text } = Typography;

export type VariableType = 'input' | 'factor' | 'calculation';

export type InspectMeta = {
  /** Unique ID for tracing back to the product designer node graph */
  id: string;
  /** Human-readable label for this variable */
  label: string;
  /** Whether this value comes from user input, a factor/assumption, or a calculation */
  type: VariableType;
  /** The data path in the projections response, e.g. "financialResults.summary.annualCost" */
  path?: string;
  /** Description of how this value is computed or where it comes from */
  description?: string;
  /** Calculator function name if type is 'calculation' */
  calculatorFunction?: string;
  /** Factor name if type is 'factor' */
  factorName?: string;
  /** Source file path */
  sourceFile?: string;
};

const TYPE_COLORS: Record<VariableType, string> = {
  input: '#52c41a',
  factor: '#1677ff',
  calculation: '#fa8c16'
};

const TYPE_LABELS: Record<VariableType, string> = {
  input: 'User Input',
  factor: 'Factor / Assumption',
  calculation: 'Calculation'
};

const InspectWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;

  &:hover {
    outline: 2px dashed #2bbe50;
    outline-offset: 2px;
    border-radius: 4px;
  }
`;

const InspectBadge = styled.span`
  position: absolute;
  top: -8px;
  right: -8px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #2bbe50;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  color: #fff;
  z-index: 2;
  cursor: help;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
`;

const MetaRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 6px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const MetaLabel = styled(Text)`
  font-size: 11px;
  color: #8c8c8c;
  flex-shrink: 0;
  min-width: 48px;
`;

const MetaValue = styled(Text)`
  font-size: 11px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  word-break: break-all;
`;

function InspectContent({ meta }: { meta: InspectMeta }) {
  return (
    <div style={{ maxWidth: 360 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Tag color={TYPE_COLORS[meta.type]} style={{ margin: 0, fontSize: 11, lineHeight: '18px' }}>
          {TYPE_LABELS[meta.type]}
        </Tag>
        <Text copyable={{ text: meta.id }} style={{ fontSize: 10, color: '#8c8c8c', fontFamily: 'monospace' }}>
          {meta.id}
        </Text>
      </div>

      {meta.path && (
        <MetaRow>
          <MetaLabel>Path:</MetaLabel>
          <MetaValue>{meta.path}</MetaValue>
        </MetaRow>
      )}

      {meta.description && (
        <MetaRow>
          <MetaLabel>How:</MetaLabel>
          <MetaValue>{meta.description}</MetaValue>
        </MetaRow>
      )}

      {meta.calculatorFunction && (
        <MetaRow>
          <MetaLabel>Func:</MetaLabel>
          <MetaValue>{meta.calculatorFunction}</MetaValue>
        </MetaRow>
      )}

      {meta.factorName && (
        <MetaRow>
          <MetaLabel>Factor:</MetaLabel>
          <MetaValue>{meta.factorName}</MetaValue>
        </MetaRow>
      )}

      {meta.sourceFile && (
        <MetaRow>
          <MetaLabel>File:</MetaLabel>
          <MetaValue>{meta.sourceFile}</MetaValue>
        </MetaRow>
      )}
    </div>
  );
}

type Props = {
  meta: InspectMeta;
  children: React.ReactNode;
};

export function InspectTooltip({ meta, children }: Props) {
  const { inspectMode } = useInspectMode();

  if (!inspectMode) {
    return <>{children}</>;
  }

  return (
    <Popover
      content={<InspectContent meta={meta} />}
      title={meta.label}
      trigger={['hover', 'click']}
      overlayStyle={{ zIndex: 1050 }}
    >
      <InspectWrapper>
        {children}
        <InspectBadge>
          <AimOutlined />
        </InspectBadge>
      </InspectWrapper>
    </Popover>
  );
}
