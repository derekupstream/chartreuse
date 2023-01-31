import { ArrowLeftOutlined } from '@ant-design/icons';
import type { Project } from '@prisma/client';
import { Button, Space, Steps, Typography } from 'antd';
import Link from 'next/link'
import { useRouter } from 'next/router';
import styled from 'styled-components';

import CalculatorFooter, { FooterProvider } from 'components/calculator/footer';
import { CALCULATOR_STEPS } from 'components/calculator/steps';
import { ErrorBoundary } from 'components/common/errors/ErrorBoundary';
import type { DashboardUser } from 'components/dashboard';
import * as S from 'components/dashboard/styles';

import BaseLayout from './baseLayout';

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

export function BackToProjectsButton () {
  return <Link href='/projects' passHref legacyBehavior>
    <Button type='text' href='/projects'>
      <ArrowLeftOutlined />
      Back to projects
    </Button>
  </Link>
}

export default function ProjectLayout({ children, project, currentStepIndex, ...pageProps }: React.PropsWithChildren<Props>) {
  const router = useRouter();

  return (
    <BaseLayout {...pageProps} selectedMenuItem='projects'>
      <FooterProvider>
        <S.ContentContainer>
          <S.Content>
            <Space direction='vertical' size='large' style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <BackToProjectsButton />
                <Title level={3}>{project?.name}</Title>
              </div>
              <S.Steps
                current={currentStepIndex}
                onChange={(id: number) => {
                  router.push(`/projects/${project!.id}${CALCULATOR_STEPS[id].path}`);
                }}
              >
                {CALCULATOR_STEPS.map((step, i) => (
                  <Steps.Step key={step.title} title={`Step ${i + 1}`} description={step.title} />
                ))}
              </S.Steps>
            </Space>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </S.Content>
        </S.ContentContainer>
        <CalculatorFooter />
      </FooterProvider>
    </BaseLayout>
  );
}
