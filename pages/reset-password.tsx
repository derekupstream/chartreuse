import type { GetServerSideProps } from 'next';

// Password reset not applicable with Google OAuth.
export const getServerSideProps: GetServerSideProps = async () => {
  return { redirect: { permanent: true, destination: '/login' } };
};

export default function ResetPassword() {
  return null;
}
