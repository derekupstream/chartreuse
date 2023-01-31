import { ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';
import { createContext, useContext, useState } from 'react';

import type { ProjectPath } from '../steps';
import { CALCULATOR_STEPS } from '../steps';

import { Container, LinkBox, Row } from './styles';

type FooterState = { path: ProjectPath; stepCompleted: boolean };

const FooterContext = createContext<{ state: FooterState | null; setFooterState: (state: FooterState) => void }>({
  setFooterState: () => {},
  state: null
});
export const useFooterState = () => useContext(FooterContext);

export function FooterProvider({ children }: { children: React.ReactNode }) {
  const [state, setFooterState] = useState<FooterState>({ path: CALCULATOR_STEPS[0].path, stepCompleted: false });

  return <FooterContext.Provider value={{ state, setFooterState }}>{children}</FooterContext.Provider>;
}

export default function Footer() {
  const { state } = useFooterState();

  const { query } = useRouter();
  const projectId = query.id as string;

  const stepIndex = CALCULATOR_STEPS.findIndex(step => step.path === state?.path);
  if (stepIndex === -1) {
    return null;
  }
  const previousStep = stepIndex > 0 ? CALCULATOR_STEPS[stepIndex - 1] : undefined;
  const nextStep = stepIndex < CALCULATOR_STEPS.length - 1 ? CALCULATOR_STEPS[stepIndex + 1] : undefined;

  return (
    <Container>
      {previousStep ? (
        <Row>
          <ArrowLeftOutlined style={{ marginBottom: '9px' }} />
          <LinkBox href={getLink(projectId, previousStep.path)}>
            <span>Previous Step</span>
            <span className='page-title'>{previousStep.title}</span>
          </LinkBox>
        </Row>
      ) : (
        <div />
      )}

      {nextStep ? (
        <Row>
          <LinkBox href={getLink(projectId, nextStep.path)}>
            <span>Next Step</span>
            <span className='page-title'>{nextStep.title}</span>
          </LinkBox>
          <ArrowRightOutlined style={{ marginBottom: '8px' }} />
        </Row>
      ) : (
        <div />
      )}
    </Container>
  );
}

function getLink(projectId: string, path: string) {
  return `/projects/${projectId}${path}`;
}
