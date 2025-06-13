import type { Project } from '@prisma/client';
import { Typography } from 'antd';
import { useEffect } from 'react';

import { useFooterState } from '../components/Footer';
import { Wrapper } from '../styles';

import { TruckTransportationSection } from './components/TruckTransportation/TruckTransportationSection';

type ServerSideProps = {
  project: Project;
  readOnly: boolean;
};

export function TransportationStep({ project, readOnly }: ServerSideProps) {
  const { setFooterState } = useFooterState();
  useEffect(() => {
    setFooterState({ path: '/transportation', stepCompleted: true });
  }, [setFooterState]);

  return (
    <Wrapper>
      <Typography.Title level={1}>Transportation</Typography.Title>
      <Typography.Title level={5}></Typography.Title>
      <br />
      <TruckTransportationSection projectId={project.id} readOnly={readOnly} />
    </Wrapper>
  );
}
