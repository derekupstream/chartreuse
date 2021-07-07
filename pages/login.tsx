import { useRouter } from "next/router";
import Head from "next/head";
import LoginForm from "components/login-form";
import { useAuth, Credentials } from "hooks/useAuth";
import { message } from "antd";

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async ({ email, password }: Credentials) => {
    try {
      await login({ email, password });
      router.push("/");
    } catch (error) {
      message.error(error.message);
    }
  };

  return (
    <div>
      <Head>
        <title>Calculator Login</title>
        <meta name="description" content="Upstream Calculator Login" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <LoginForm onSubmit={handleLogin as (values: unknown) => void} />
      </main>
    </div>
  );
}
