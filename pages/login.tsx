import { useRouter } from "next/router";
import Header from "components/header";
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
    <>
      <Header title="Login" />

      <main>
        <LoginForm onSubmit={handleLogin as (values: unknown) => void} />
      </main>
    </>
  );
}
