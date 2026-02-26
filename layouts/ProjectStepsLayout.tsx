import { ArrowLeftOutlined } from '@ant-design/icons';
import { PlusOutlined } from '@ant-design/icons';
import type { Project } from '@prisma/client';
import { Alert, Button, Space } from 'antd';
import Link from 'next/link';
import styled from 'styled-components';
import { StepsNavigation } from './DashboardLayout/components/StepsNavigation';
import { EditStepsStepper } from './DashboardLayout/components/EditStepsStepper';
import { categoryByType } from 'lib/projects/categories';
import { ErrorBoundary } from 'components/common/errors/ErrorBoundary';
import CalculatorFooter, { FooterProvider } from 'components/projects/[id]/components/Footer';

import type { DashboardUser } from 'interfaces';
import * as S from 'layouts/styles';

import { BaseLayout } from './BaseLayout';

const ProjectHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const GreenProjectName = styled.span`
  color: #2bbe50;
  font-size: clamp(12px, 2vw, 14px);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 55%;
`;

type Props = {
  currentStepIndex: number;
  project?: Project;
  title: string;
  user: DashboardUser;
};

export function BackToProjectsButton() {
  return (
    <Link href='/projects' passHref legacyBehavior>
      <Button type='text' href='/projects'>
        <ArrowLeftOutlined />
        Back to projects
      </Button>
    </Link>
  );
}

export function ProjectStepsLayout({
  children,
  project,
  currentStepIndex,
  ...pageProps
}: React.PropsWithChildren<Props>) {
  const isDashboard = currentStepIndex === 0;

  return (
    <BaseLayout {...pageProps} selectedMenuItem='projects'>
      <FooterProvider projectCategory={project?.category}>
        <S.ContentContainer style={isDashboard ? { paddingBottom: '1rem' } : undefined}>
          <S.Content>
            <Space direction='vertical' size={8} style={{ width: '100%' }}>
              <ProjectHeader>
                <BackToProjectsButton />
                {!isDashboard && project && <GreenProjectName>{project.name}</GreenProjectName>}
              </ProjectHeader>
              <StepsNavigation current={currentStepIndex} projectId={project?.id} projectCategory={project?.category} />
              {currentStepIndex > 0 && project && (
                <EditStepsStepper
                  steps={categoryByType(project.category).steps}
                  currentIndex={currentStepIndex}
                  projectId={project.id}
                />
              )}
              {project?.isTemplate && (
                <Alert
                  message='This is a template to get you started. Make sure to customize your purchasing data to create an accurate dashboard'
                  action={
                    <Button href={`/projects/new?templateId=${project?.id}`} target='_blank' icon={<PlusOutlined />}>
                      Use this template
                    </Button>
                  }
                  style={{ backgroundColor: '#e3e2e0', border: '0 none', padding: '16px' }}
                />
              )}
            </Space>
            <ErrorBoundary>{children}</ErrorBoundary>
          </S.Content>
        </S.ContentContainer>
        {!isDashboard && <CalculatorFooter projectCategory={project?.category} />}
      </FooterProvider>
    </BaseLayout>
  );
}
