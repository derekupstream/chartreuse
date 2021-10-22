import { GetServerSideProps } from "next";
import ProjectSteps from "components/dashboard/projects/steps";
import { Props, Template } from "components/dashboard";
import { PageProps } from "pages/_app";
import { checkLogin } from "lib/middleware";

export const getServerSideProps: GetServerSideProps = async (context) => {
  return checkLogin(context);
};

const NewProjectPage = ({ user }: Props) => {
  return <ProjectSteps user={user} />;
};

NewProjectPage.getLayout = (page: React.ReactNode, pageProps: PageProps) => {
  return (
    <Template {...pageProps} selectedMenuItem="projects">
      {page}
    </Template>
  );
};

export default NewProjectPage;
