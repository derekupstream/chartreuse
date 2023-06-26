import { ErrorBoundary } from 'components/common/errors/ErrorBoundary';
import type { DashboardUser } from 'interfaces';
import * as S from 'layouts/styles';

import { BaseLayout } from '../BaseLayout';

import { HaveQuestions } from './components/HaveQuestions';

export type DashboardProps = {
  children: any;
  selectedMenuItem: string;
  title: string;
  user: DashboardUser;
};

export const DashboardLayout: React.FC<DashboardProps> = ({ children, ...props }) => {
  return (
    <BaseLayout {...props}>
      <S.ContentContainer>
        <S.Content>
          <ErrorBoundary>{children}</ErrorBoundary>
        </S.Content>
      </S.ContentContainer>
      <HaveQuestions />
    </BaseLayout>
  );
};
