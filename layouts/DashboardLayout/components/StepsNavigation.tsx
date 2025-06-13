import styled from 'styled-components';
import { Typography } from 'antd';
import { categoryByType } from 'lib/projects/categories';
import { ProjectCategory } from '@prisma/client';
const Steps = styled.div`
  border-bottom: 1px solid #ccc;
  border-top: 1px solid #ccc;
  display: flex;
`;

// use string instead of boolean attribute to avoid DOM warnings
const Step = styled.div<{ active: string; isfirst: string; ispast: string; islast: string; width: string }>`
  height: 60px;
  position: relative;
  width: ${({ width }) => width};
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
      a {
        background-color: #95ee49;
      }
      `
      : ''}
  .ant-typography {
    align-items: center;
    display: flex;
    font-size: 15px;
    font-weight: 500;
    height: 100%;
    justify-content: center;
    margin: 0;
    padding: 0 20px;
    text-align: center;
    width: 100%;
    &:hover {
      color: rgba(0, 0, 0, 0.85);
    }
  }
  ${({ active, ispast }) =>
    active || ispast
      ? `
  .ant-typography {
    color: rgba(0, 0, 0, 0.85);
    height: 100%;
  }`
      : ''}

  ${({ isfirst }) =>
    !isfirst
      ? `.left-diagonal {
    width: 0;
    height: 0;
    border-top: 30px solid transparent;
    border-bottom: 30px solid transparent;
    border-left: 20px solid #f4f3f0;
    top: 0;
    left: 0;
    position: absolute;
    z-index: 3;
  }`
      : ''}

  .diagonal {
    width: 0;
    height: 0;
    border-top: 30px solid transparent;
    border-bottom: 30px solid transparent;
    border-left: 20px solid transparent;
    top: 0;
    right: 0;
    position: absolute;
    transform: translateX(100%);
    z-index: 1;
  }
  ${({ active, islast }) =>
    active && !islast
      ? `
  .diagonal {
    border-left-color: #95ee49;
  }`
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
  );
}
