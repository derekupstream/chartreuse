import type { Project, ProjectCategory } from '@prisma/client';
import { message } from 'antd';
import { Space } from 'antd';
import { useRouter } from 'next/router';
import { useState } from 'react';
import styled from 'styled-components';

import type { DashboardUser } from 'interfaces';
import { BackToProjectsButton } from 'layouts/ProjectStepsLayout';
import chartreuseClient from 'lib/chartreuseClient';
import type { ProjectInput } from 'lib/chartreuseClient';

import type { FormValues as BudgetFormValues } from './components/BudgetForm';
import { BudgetForm } from './components/BudgetForm';
import { ProjectForm } from './components/ProjectForm';

const steps = [{ title: 'Project Setup' }, { title: 'Budgets + Targets' }];

const Wrapper = styled.div`
  width: 460px;
  margin: 0 auto;
`;

const ProjectTypes = [
  'Cafe/Cafeteria',
  'Kitchenette/Employee Breakroom',
  'Event Catering',
  'Special Event (Venue)',
  'Coffee Shop',
  'Fast Casual Restaurant',
  'Food Hall Stand',
  'Live Events',
  'Other'
] as const;

const WhereFoodIsPrepared = ['On-Site', 'Off-Site', 'Both'] as const;

export type ProjectMetadata = {
  type: (typeof ProjectTypes)[number];
  customers: string;
  dineInVsTakeOut: number;
  whereIsFoodPrepared: (typeof WhereFoodIsPrepared)[number];
};

export type Props = {
  children: any;
  user: DashboardUser;
};

export function ProjectSetup({
  actionLabel,
  user,
  project: initialProjectState,
  template,
  successPath
}: {
  actionLabel: string;
  user: DashboardUser;
  project?: Project;
  template?: Pick<Project, 'name'>;
  successPath: (id: string, category: ProjectCategory) => string;
}) {
  const [currentStepIndex, setIndex] = useState(0);
  const router = useRouter();

  // save a local copy of the project state so we can update it as the user progresses through the steps
  const [project, setProject] = useState<Project | undefined>(initialProjectState);

  async function saveProject(values: ProjectInput) {
    try {
      const req = values.id ? chartreuseClient.updateProject(values) : chartreuseClient.createProject(values);
      const result = await req;
      // setIndex(1);
      setProject(result.project);
      onComplete(result.project.id, result.project.category);
    } catch (error) {
      message.error((error as Error)?.message || (error as any).error);
    }
  }

  async function saveBudget(values: BudgetFormValues) {
    try {
      const newProject = { ...project, ...values } as ProjectInput;
      const result = await chartreuseClient.updateProject(newProject);
      onComplete(result.project.id, result.project.category);
    } catch (error) {
      message.error((error as Error)?.message || (error as any).error);
    }
  }

  function onComplete(projectId: string, category: ProjectCategory) {
    const urlRedirect = typeof router.query.redirect === 'string' ? router.query.redirect : null;
    router.push(urlRedirect || successPath(projectId, category));
  }

  return (
    <>
      <Space direction='vertical' size='large' style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <BackToProjectsButton />
        </div>
        <Wrapper>
          {/* <S.Steps
            current={currentStepIndex}
            onChange={
              project
                ? (id: number) => {
                    setIndex(id);
                  }
                : undefined
            }
            items={steps.map((step, i) => ({
              title: step.title
            }))}
          /> */}
          <div style={{ marginTop: 50 }}>
            {currentStepIndex === 0 && (
              <ProjectForm
                actionLabel={actionLabel}
                org={user.org}
                project={project}
                template={template}
                onComplete={saveProject}
              />
            )}
            {currentStepIndex === 1 && project && (
              <BudgetForm project={project} onComplete={saveBudget} onSkip={onComplete} />
            )}
          </div>
        </Wrapper>
      </Space>
    </>
  );
}
