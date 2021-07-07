import { useRouter } from "next/router";
import Head from "next/head";
import SignupForm from "components/signup-form";
import { useAuth, Credentials } from "hooks/useAuth";
import { message } from "antd";

export default function Signup() {
  const { user, signup } = useAuth();
  const router = useRouter();

  const handleSignup = async ({ email, password }: Credentials) => {
    try {
      await signup({ email, password });
      router.push("/");
    } catch (error) {
      message.error(error.message);
    }
  };

  return (
    <div>
      <Head>
        <title>Calculator Signup</title>
        <meta name="description" content="Upstream Calculator Signup" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {user && <div>{user?.email}</div>}

      <main>
        <SignupForm onSubmit={handleSignup as (values: unknown) => void} />
      </main>
    </div>
  );
}
