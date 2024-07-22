import type { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  console.log('Redirect user to first page of project setup');
  return {
    redirect: {
      destination: `/projects/${query.id}/projections`,
      permanent: false
    }
  };
};

export default function Page() {
  return <></>;
}
