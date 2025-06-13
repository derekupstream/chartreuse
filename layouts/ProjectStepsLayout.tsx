import { ArrowLeftOutlined } from '@ant-design/icons';
import { PlusOutlined } from '@ant-design/icons';
import type { Project } from '@prisma/client';
import { Alert, Button, Space, Typography } from 'antd';
import Link from 'next/link';
import styled from 'styled-components';
import { StepsNavigation } from './DashboardLayout/components/StepsNavigation';
import { ErrorBoundary } from 'components/common/errors/ErrorBoundary';
import CalculatorFooter, { FooterProvider } from 'components/projects/[id]/components/Footer';

import type { DashboardUser } from 'interfaces';
import * as S from 'layouts/styles';

import { BaseLayout } from './BaseLayout';

const Title = styled(Typography.Title)`
  margin-bottom: 5px !important;
  color: #2bbe50 !important;
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
  return (
    <BaseLayout {...pageProps} selectedMenuItem='projects'>
      <FooterProvider projectCategory={project?.category}>
        <S.ContentContainer>
          <S.Content>
            <Space direction='vertical' size='large' style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <BackToProjectsButton />
                <Title level={3}>{project?.name}</Title>
              </div>
              <StepsNavigation current={currentStepIndex} projectId={project?.id} projectCategory={project?.category} />
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
        <CalculatorFooter projectCategory={project?.category} />
      </FooterProvider>
    </BaseLayout>
  );
}
