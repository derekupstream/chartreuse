import { BugOutlined } from '@ant-design/icons';
import { Switch } from 'antd';
import { useEffect, useState } from 'react';
import styled, { keyframes, css } from 'styled-components';

import { useInspectMode } from './InspectModeContext';

const pulse = keyframes`
  0% { box-shadow: 0 4px 16px rgba(43, 190, 80, 0.4); }
  50% { box-shadow: 0 4px 24px rgba(43, 190, 80, 0.7); }
  100% { box-shadow: 0 4px 16px rgba(43, 190, 80, 0.4); }
`;

/* Invisible stable hover zone — prevents the expand/collapse feedback loop */
const HoverZone = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  padding: 12px;
  cursor: pointer;

  @media print {
    display: none;
  }
`;

const FABPill = styled.div<{ $expanded: boolean; $active: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ $expanded }) => ($expanded ? '12px' : '0')};
  background: #2bbe50;
  color: #fff;
  border-radius: ${({ $expanded }) => ($expanded ? '28px' : '50%')};
  padding: ${({ $expanded }) => ($expanded ? '10px 20px 10px 16px' : '0')};
  width: ${({ $expanded }) => ($expanded ? 'auto' : '48px')};
  height: 48px;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(43, 190, 80, 0.4);
  user-select: none;
  overflow: hidden;
  white-space: nowrap;

  ${({ $active }) =>
    $active &&
    css`
      animation: ${pulse} 2s ease-in-out infinite;
      background: #1a9e3f;
    `}

  ${HoverZone}:hover & {
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(43, 190, 80, 0.5);
  }
`;

const IconWrapper = styled.span`
  font-size: 20px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
`;

const LabelSection = styled.div<{ $visible: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: ${({ $visible }) => ($visible ? '250px' : '0')};
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition:
    max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.2s ease;
`;

const Label = styled.span`
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
`;

export function InspectFAB() {
  const { inspectMode, toggleInspectMode } = useInspectMode();
  const [hovered, setHovered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const expanded = hovered || inspectMode;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <HoverZone
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={e => {
        if ((e.target as HTMLElement).closest('.ant-switch')) return;
        toggleInspectMode();
      }}
    >
      <FABPill $expanded={expanded} $active={inspectMode}>
        <IconWrapper>
          <BugOutlined />
        </IconWrapper>
        <LabelSection $visible={expanded}>
          <Label>Inspect Mode</Label>
          <Switch
            size='small'
            checked={inspectMode}
            onChange={toggleInspectMode}
            style={{
              backgroundColor: inspectMode ? '#fff' : 'rgba(255,255,255,0.3)'
            }}
          />
        </LabelSection>
      </FABPill>
    </HoverZone>
  );
}
