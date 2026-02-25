import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

/* ── Shared atoms ── */
const Circle = styled.div<{ $current: boolean; $past: boolean }>`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: ${({ $current, $past }) => ($current ? '#95ee49' : $past ? '#d9f7be' : '#f0f0f0')};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  color: ${({ $current, $past }) => ($current ? '#262626' : $past ? '#52c41a' : '#8c8c8c')};
  flex-shrink: 0;
`;

/* ── Sticky bar (both layouts) ── */
const StickyBar = styled.div<{ $visible: boolean }>`
  position: sticky;
  top: 0;
  z-index: 50;
  display: ${({ $visible }) => ($visible ? 'flex' : 'none')};
  align-items: center;
  border-left: 4px solid #95ee49;
  padding: 8px 16px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  font-size: 14px;
  font-weight: 500;
  color: #262626;
  margin-bottom: 8px;
`;

/* ── Desktop: horizontal stepper ── */
const HorizStepper = styled.div`
  display: none;

  @media (min-width: 768px) {
    display: flex;
    align-items: flex-start;
    padding: 16px 0 8px;
  }
`;

const HorizStepItem = styled.a<{ $current: boolean; $past: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  flex-shrink: 0;
  min-width: 80px;
  max-width: 120px;
  text-align: center;

  &:hover span {
    color: #2bbe50;
  }
`;

const HorizTitle = styled.span<{ $current: boolean; $past: boolean }>`
  font-size: 12px;
  font-weight: ${({ $current }) => ($current ? 600 : 400)};
  color: ${({ $current, $past }) => ($current ? '#262626' : $past ? '#595959' : '#8c8c8c')};
  line-height: 1.3;
  transition: color 150ms;
`;

const Connector = styled.div<{ $past: boolean }>`
  flex: 1;
  height: 2px;
  background: ${({ $past }) => ($past ? '#95ee49' : '#e8e8e8')};
  margin: 14px 4px 0; /* vertically center with the circle */
  min-width: 16px;
`;

/* ── Mobile: vertical stepper ── */
const VertStepper = styled.div`
  display: block;
  margin: 8px 0 16px;

  @media (min-width: 768px) {
    display: none;
  }
`;

const VertStepRow = styled.a<{ $current: boolean; $past: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  text-decoration: none;
  color: inherit;

  &:last-child {
    border-bottom: none;
  }

  &:hover .step-title {
    color: #2bbe50;
  }
`;

const VertTitle = styled.span<{ $current: boolean; $past: boolean }>`
  font-size: 14px;
  font-weight: ${({ $current }) => ($current ? 600 : 400)};
  color: ${({ $current, $past }) => ($current ? '#262626' : $past ? '#595959' : '#8c8c8c')};
  transition: color 150ms;
`;

/* ── Observer wrapper ── */
const StepperWrap = styled.div``;

type Step = { path: string; title: string; width: string };

type Props = {
  steps: Step[];
  currentIndex: number;
  projectId: string;
};

export function EditStepsStepper({ steps, currentIndex, projectId }: Props) {
  const stepperRef = useRef<HTMLDivElement>(null);
  const [stepperVisible, setStepperVisible] = useState(true);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setStepperVisible(entry.isIntersecting), { threshold: 0 });
    if (stepperRef.current) observer.observe(stepperRef.current);
    return () => observer.disconnect();
  }, []);

  const editSteps = steps.slice(1);
  const editIndex = currentIndex - 1; // 0-based among edit steps
  const totalEditSteps = editSteps.length;
  const currentStepTitle = editSteps[editIndex]?.title ?? '';

  return (
    <>
      <StickyBar $visible={!stepperVisible}>
        Step {currentIndex} of {totalEditSteps} &middot; {currentStepTitle}
      </StickyBar>

      <StepperWrap ref={stepperRef}>
        {/* Desktop: horizontal */}
        <HorizStepper>
          {editSteps.map((step, i) => {
            const isCurrent = i === editIndex;
            const isPast = i < editIndex;
            return (
              <>
                {i > 0 && <Connector key={`conn-${i}`} $past={isPast} />}
                <HorizStepItem
                  key={step.path}
                  href={`/projects/${projectId}${step.path}`}
                  $current={isCurrent}
                  $past={isPast}
                >
                  <Circle $current={isCurrent} $past={isPast}>
                    {isPast ? '✓' : i + 1}
                  </Circle>
                  <HorizTitle $current={isCurrent} $past={isPast}>
                    {step.title}
                  </HorizTitle>
                </HorizStepItem>
              </>
            );
          })}
        </HorizStepper>

        {/* Mobile: vertical */}
        <VertStepper>
          {editSteps.map((step, i) => {
            const isCurrent = i === editIndex;
            const isPast = i < editIndex;
            return (
              <VertStepRow
                key={step.path}
                href={`/projects/${projectId}${step.path}`}
                $current={isCurrent}
                $past={isPast}
              >
                <Circle $current={isCurrent} $past={isPast}>
                  {isPast ? '✓' : i + 1}
                </Circle>
                <VertTitle className='step-title' $current={isCurrent} $past={isPast}>
                  {step.title}
                </VertTitle>
              </VertStepRow>
            );
          })}
        </VertStepper>
      </StepperWrap>
    </>
  );
}
