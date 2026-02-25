import styled from 'styled-components';
import { Typography } from 'antd';
import { categoryByType } from 'lib/projects/categories';
import { ProjectCategory } from '@prisma/client';

/* ── Mobile: horizontal scrollable underline tab bar ── */
const MobileTabBar = styled.div`
  display: flex;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  border-bottom: 2px solid #e8e8e8;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (min-width: 768px) {
    display: none;
  }
`;

const MobileTab = styled.a<{ $active: boolean }>`
  flex-shrink: 0;
  padding: 10px 16px;
  margin-bottom: -2px;
  border-bottom: 3px solid ${({ $active }) => ($active ? '#95ee49' : 'transparent')};
  font-size: 14px;
  font-weight: ${({ $active }) => ($active ? 600 : 400)};
  color: ${({ $active }) => ($active ? '#262626' : '#8c8c8c')};
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;

  &:hover {
    color: #262626;
  }
`;

/* ── Desktop: original diagonal chevron bar ── */
const DesktopSteps = styled.div`
  display: none;

  @media (min-width: 768px) {
    display: block;
  }
`;

const Steps = styled.div`
  border-bottom: 1px solid #ccc;
  border-top: 1px solid #ccc;
  display: flex;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const Step = styled.div<{ active: string; isfirst: string; ispast: string; islast: string; width: string }>`
  height: 60px;
  position: relative;
  width: ${({ width }) => width};
  min-width: 100px;
  flex-shrink: 0;

  a {
    display: block;
    width: 100%;
    height: 100%;
    position: relative;
    text-decoration: none;
    z-index: 2;
  }

  ${({ active }) =>
    active
      ? `
      z-index: 10;
      a { background-color: #95ee49; }
      `
      : ''}

  .ant-typography {
    align-items: center;
    display: flex;
    font-size: clamp(11px, 2vw, 15px);
    font-weight: 500;
    height: 100%;
    justify-content: center;
    margin: 0;
    padding: 0 12px;
    text-align: center;
    white-space: nowrap;
    width: 100%;
    &:hover {
      color: rgba(0, 0, 0, 0.85);
    }
  }

  ${({ active, ispast }) =>
    active || ispast
      ? `.ant-typography { color: rgba(0, 0, 0, 0.85); height: 100%; }`
      : ''}

  ${({ isfirst }) =>
    !isfirst
      ? `.left-diagonal {
          width: 0; height: 0;
          border-top: 30px solid transparent;
          border-bottom: 30px solid transparent;
          border-left: 20px solid #f4f3f0;
          top: 0; left: 0; position: absolute; z-index: 3;
        }`
      : ''}

  .diagonal {
    width: 0; height: 0;
    border-top: 30px solid transparent;
    border-bottom: 30px solid transparent;
    border-left: 20px solid transparent;
    top: 0; right: 0; position: absolute;
    transform: translateX(100%);
    z-index: 1;
  }

  ${({ active, islast }) =>
    active && !islast
      ? `.diagonal { border-left-color: #95ee49; }`
      : ''}
`;

export function StepsNavigation({
  current,
  projectId,
  projectCategory = 'default'
}: {
  current: number;
  projectId?: string;
  projectCategory?: ProjectCategory;
}) {
  const steps = categoryByType(projectCategory).steps;

  return (
    <>
      {/* Mobile: scrollable underline tabs */}
      <MobileTabBar>
        {steps.map((step, i) => (
          <MobileTab
            key={step.title}
            href={projectId ? `/projects/${projectId}${step.path}` : undefined}
            $active={i === current}
          >
            {step.title}
          </MobileTab>
        ))}
      </MobileTabBar>

      {/* Desktop: diagonal chevron bar */}
      <DesktopSteps>
        <Steps>
          {steps.map((step, i) => (
            <Step
              active={i === current ? 'true' : ''}
              width={steps[i].width}
              ispast={i < current ? 'true' : ''}
              isfirst={i === 0 ? 'true' : ''}
              islast={i === steps.length - 1 ? 'true' : ''}
              key={step.title}
            >
              <a href={`/projects/${projectId}${steps[i].path}`}>
                <Typography.Title level={5}>{step.title}</Typography.Title>
              </a>
              <div className='left-diagonal' />
              <div className='diagonal' />
            </Step>
          ))}
        </Steps>
      </DesktopSteps>
    </>
  );
}
