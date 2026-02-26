import type { Project } from '@prisma/client';
import { Typography } from 'antd';
import { useEffect } from 'react';

import { useFooterState } from '../components/Footer';
import { Wrapper, StepDescription } from '../styles';

import LaborSection from './components/Labor/LaborSection';
import OtherExpenseSection from './components/OtherExpenses/OtherExpensesSection';
import WasteHaulingSection from './components/WasteHauling/WasteHaulingSection';

type ServerSideProps = {
  project: Project;
  readOnly: boolean;
};

export function AdditionalCostsStep({ project, readOnly }: ServerSideProps) {
  const { setFooterState } = useFooterState();
  useEffect(() => {
    setFooterState({ path: '/additional-costs', stepCompleted: true });
  }, [setFooterState]);

  return (
    <Wrapper>
      <Typography.Title level={1}>Additional Costs</Typography.Title>
      <StepDescription>
        You may incur additional one-time or ongoing expenses or savings from transitioning your operations. For
        example, storage, dishwashing equipment and labor, and reduced trash hauling services can impact your bottom
        line. This section will help you accurately capture and estimate those additional impacts.
      </StepDescription>
      <br />
      <LaborSection projectId={project.id} readOnly={readOnly} />
      <br />
      <WasteHaulingSection projectId={project.id} readOnly={readOnly} />
      <br />
      <OtherExpenseSection projectId={project.id} readOnly={readOnly} />
    </Wrapper>
  );
}
