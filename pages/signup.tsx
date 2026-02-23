import type { GetServerSideProps } from 'next';

// Signup is handled via Google OAuth on the login page.
export const getServerSideProps: GetServerSideProps = async () => {
  return { redirect: { permanent: true, destination: '/login' } };
};

export default function Signup() {
  return null;
}
