import type { GetServerSideProps } from 'next';

// Email verification not needed with Google OAuth.
export const getServerSideProps: GetServerSideProps = async () => {
  return { redirect: { permanent: true, destination: '/login' } };
};

export default function EmailVerification() {
  return null;
}
