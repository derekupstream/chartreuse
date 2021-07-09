import { useRouter } from "next/router";
import Header from "components/header";
import SignupForm from "components/signup-form";
import { useAuth, Credentials } from "hooks/useAuth";
import { message } from "antd";
import { FirebaseAuthProvider } from "lib/firebaseClient";

export default function Signup() {
  const { signup, loginWithProvider } = useAuth();
  const router = useRouter();

  const handleSignup = async ({ email, password }: Credentials) => {
    try {
      await signup({ email, password });
      router.push("/email-verification");
    } catch (error) {
      message.error(error.message);
    }
  };

  const handleLoginWithProvider = async (provider: FirebaseAuthProvider) => {
    try {
      await loginWithProvider(provider);
      router.push("/email-verification");
    } catch (error) {
      message.error(error.message);
    }
  };

  return (
    <>
      <Header title="Signup" />

      <main>
        <SignupForm
          onSubmit={handleSignup as (values: unknown) => void}
          onSubmitWithProvider={handleLoginWithProvider}
        />
      </main>
    </>
  );
}
