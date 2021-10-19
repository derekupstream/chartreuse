import { useRouter } from "next/router";
import Header from "components/header";
import LoginForm from "components/login-form";
import { useAuth, Credentials } from "hooks/useAuth";
import { message } from "antd";
import { FirebaseAuthProvider } from "lib/firebaseClient";
import FormPageTemplate from "components/form-page-template";

export default function Login() {
  const { login, loginWithProvider } = useAuth();
  const router = useRouter();

  const handleLogin = async ({ email, password }: Credentials) => {
    try {
      await login({ email, password });
      router.push("/");
    } catch (error: any) {
      message.error(error.message);
    }
  };

  const handleLoginWithProvider = async (provider: FirebaseAuthProvider) => {
    try {
      await loginWithProvider(provider);
      router.push("/");
    } catch (error: any) {
      message.error(error.message);
    }
  };

  return (
    <>
      <Header title="Sign in" />

      <main>
        <FormPageTemplate
          title="Welcome to ReuseIT"
          subtitle="Sign in with your email and password, or use your Google account."
        >
          <LoginForm
            onSubmit={handleLogin as (values: unknown) => void}
            onSubmitWithProvider={handleLoginWithProvider}
          />
        </FormPageTemplate>
      </main>
    </>
  );
}
