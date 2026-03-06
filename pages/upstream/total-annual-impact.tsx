import type { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async context => {
  const category = context.query.category;
  return {
    redirect: {
      destination: category ? `/admin/analytics?category=${category}` : '/admin/analytics',
      permanent: false
    }
  };
};

export default function Redirect() {
  return null;
}
