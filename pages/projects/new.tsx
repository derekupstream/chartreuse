import type { GetServerSideProps } from 'next';

import type { DashboardUser } from 'components/dashboard';
import { checkLogin } from 'lib/middleware';

import ProjectSetup from './[id]/setup';

export const getServerSideProps: GetServerSideProps = async context => {
  return checkLogin(context);
};

const NewProjectPage = ({ user }: { user: DashboardUser }) => {
  return <ProjectSetup user={user} />;
};

export default NewProjectPage;
