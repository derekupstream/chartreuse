import styled from 'styled-components';
import { categoryByType } from 'lib/projects/categories';
import { ProjectCategory } from '@prisma/client';

const TabBar = styled.div`
  display: flex;
  border-bottom: 2px solid #e8e8e8;
`;

const Tab = styled.a<{ $active: boolean }>`
  padding: 10px 24px;
  margin-bottom: -2px;
  border-bottom: 3px solid ${({ $active }) => ($active ? '#95ee49' : 'transparent')};
  font-size: 15px;
  font-weight: ${({ $active }) => ($active ? 600 : 400)};
  color: ${({ $active }) => ($active ? '#262626' : '#8c8c8c')};
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
  transition: color 150ms;

  &:hover {
    color: #262626;
  }
`;

export function StepsNavigation({
  current,
  projectId,
  projectCategory = 'default'
}: {
  current: number;
  projectId?: string;
  projectCategory?: ProjectCategory;
}) {
  const steps = categoryByType(projectCategory).steps;
  // steps[0] is always the Dashboard (/projections)
  // steps[1] is always the first edit step
  const editHref = projectId && steps.length > 1 ? `/projects/${projectId}${steps[1].path}` : undefined;
  const dashHref = projectId ? `/projects/${projectId}/projections` : undefined;

  return (
    <TabBar>
      <Tab href={dashHref} $active={current === 0}>
        Dashboard
      </Tab>
      {steps.length > 1 && (
        <Tab href={editHref} $active={current > 0}>
          Edit
        </Tab>
      )}
    </TabBar>
  );
}
