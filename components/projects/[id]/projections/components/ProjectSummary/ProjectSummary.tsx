import { ProjectionsResponse } from 'lib/calculator/getProjections';
import { ProjectImpacts } from './ProjectImpacts';
import FinancialSummary from './FinancialSummary/FinancialSummary';
import { EnvironmentalSummary } from './EnvironmentalSummary/EnvironmentalSummary';

export function ProjectSummary({ data, businessSize }: { data: ProjectionsResponse; businessSize?: number }) {
  return (
    <>
      <ProjectImpacts data={data.annualSummary} />
      <div className='page-break' />
      <FinancialSummary data={data.financialResults} businessSize={businessSize} />
      <div className='page-break' />
      <EnvironmentalSummary data={data.environmentalResults} />
    </>
  );
}
