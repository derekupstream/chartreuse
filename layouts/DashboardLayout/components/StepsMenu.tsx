import styled from 'styled-components';
import { Typography } from 'antd';
import { CALCULATOR_STEPS } from 'components/projects/[id]/steps';

const Steps = styled.div`
  border-bottom: 1px solid #ccc;
  border-top: 1px solid #ccc;
  display: flex;
`;

const Step = styled.div<{ active: boolean; isFirst: boolean; isPast: boolean; isLast: boolean; width: string }>`
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
  ${({ active, isPast }) =>
    active || isPast
      ? `
  .ant-typography {
    color: rgba(0, 0, 0, 0.85);
    height: 100%;
  }`
      : ''}

  ${({ isFirst }) =>
    !isFirst
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
  ${({ active, isLast }) =>
    active && !isLast
      ? `
  .diagonal {
    border-left-color: #95ee49;
  }`
      : ''}
`;

export function StepsMenu({ current, projectId }: { current: number; projectId?: string }) {
  return (
    <Steps>
      {CALCULATOR_STEPS.map((step, i) => (
        <Step
          active={i === current}
          width={CALCULATOR_STEPS[i].width}
          isPast={i < current}
          isFirst={i === 0}
          isLast={i === CALCULATOR_STEPS.length - 1}
          key={step.title}
        >
          <a href={`/projects/${projectId}${CALCULATOR_STEPS[i].path}`}>
            <Typography.Title level={5}>{step.title}</Typography.Title>
          </a>
          <div className='left-diagonal' />
          <div className='diagonal' />
        </Step>
      ))}
    </Steps>
  );
}
{
  /* <S.Steps
  current={currentStepIndex}
  onChange={(id: number) => {
    router.push(`/projects/${project?.id}${CALCULATOR_STEPS[id].path}`);
  }}
>
  {CALCULATOR_STEPS.map((step, i) => (
    <Steps.Step key={step.title} title={`Step ${i + 1}`} description={step.title} />
  ))}
</S.Steps> */
}
