import { ArrowLeftOutlined, ArrowRightOutlined, CheckOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';
import { createContext, useContext, useState } from 'react';
import styled from 'styled-components';

import { categoryByType } from 'lib/projects/categories';
import type { ProjectPath } from 'lib/projects/steps';

import { Container, LinkBox, Row } from './styles';
import { ProjectCategory } from '@prisma/client';

const CompleteButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  background: #95ee49;
  color: #262626;
  font-size: 16px;
  font-weight: 600;
  border-radius: 6px;
  text-decoration: none;
  transition: background 150ms;

  &:hover {
    background: #7dd63a;
    color: #262626;
  }
`;

type FooterState = { path: ProjectPath; stepCompleted: boolean };

const FooterContext = createContext<{ state: FooterState | null; setFooterState: (state: FooterState) => void }>({
  setFooterState: () => {},
  state: null
});
export const useFooterState = () => useContext(FooterContext);

export function FooterProvider({
  children,
  projectCategory = 'default'
}: {
  children: React.ReactNode;
  projectCategory?: ProjectCategory;
}) {
  const steps = categoryByType(projectCategory).steps;
  const [state, setFooterState] = useState<FooterState>({ path: steps[0].path, stepCompleted: false });

  return <FooterContext.Provider value={{ state, setFooterState }}>{children}</FooterContext.Provider>;
}

export default function Footer({ projectCategory = 'default' }: { projectCategory?: ProjectCategory }) {
  const { state } = useFooterState();

  const { query } = useRouter();
  const projectId = query.id as string;

  const steps = categoryByType(projectCategory).steps;
  const stepIndex = steps.findIndex(step => step.path === state?.path);
  if (stepIndex === -1) {
    return null;
  }
  const previousStep = stepIndex > 0 ? steps[stepIndex - 1] : undefined;
  const nextStep = stepIndex < steps.length - 1 ? steps[stepIndex + 1] : undefined;
  const isLastEditStep = !nextStep && state?.path !== '/projections';

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

      {isLastEditStep ? (
        <Row>
          <CompleteButton href={`/projects/${projectId}/projections`}>
            Complete <CheckOutlined />
          </CompleteButton>
        </Row>
      ) : nextStep ? (
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
