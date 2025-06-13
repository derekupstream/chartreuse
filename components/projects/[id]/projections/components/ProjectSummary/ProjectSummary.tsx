import { ProjectionsResponse } from 'lib/calculator/getProjections';
import { ProjectImpacts } from './ProjectImpacts';
import FinancialSummary from './FinancialSummary/FinancialSummary';
import { EnvironmentalSummary } from './EnvironmentalSummary/EnvironmentalSummary';

export function ProjectSummary({ data }: { data: ProjectionsResponse }) {
  return (
    <>
      <ProjectImpacts data={data.annualSummary} />
      <div className='page-break' />
      <FinancialSummary data={data.financialResults} />
      <div className='page-break' />
      <EnvironmentalSummary data={data.environmentalResults} />
    </>
  );
}
