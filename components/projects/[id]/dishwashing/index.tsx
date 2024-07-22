import type { Project } from '@prisma/client';
import { Typography } from 'antd';
import { useEffect } from 'react';

import { useFooterState } from '../components/Footer';
import { Wrapper } from '../styles';

import DishWashingSection from './components/DishWashingSection';

type ServerSideProps = {
  project: Project;
  readOnly: boolean;
};

export function DishwashingView({ project, readOnly }: ServerSideProps) {
  const { setFooterState } = useFooterState();
  useEffect(() => {
    setFooterState({ path: '/dishwashing', stepCompleted: true });
  }, [setFooterState]);

  return (
    <Wrapper>
      <DishWashingSection projectId={project.id} readOnly={readOnly} />
    </Wrapper>
  );
}
