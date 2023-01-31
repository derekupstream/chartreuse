import { ErrorBoundary } from 'components/common/errors/ErrorBoundary';
import type { DashboardUser } from 'components/dashboard';
import * as S from 'components/dashboard/styles';
import HaveQuestions from 'components/have-questions';

import BaseLayout from './baseLayout';

export type DashboardProps = {
  children: any;
  selectedMenuItem: string;
  title: string;
  user: DashboardUser;
};

const DashboardTemplate: React.FC<DashboardProps> = ({ children, ...props }) => {
  return (
    <BaseLayout {...props}>
      <S.ContentContainer>
        <S.Content>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          </S.Content>
      </S.ContentContainer>
      <HaveQuestions />
    </BaseLayout>
  );
};

export default DashboardTemplate;
