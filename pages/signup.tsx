import { useRouter } from "next/router";
import Header from "components/header";
import SignupForm from "components/signup-form";
import { useAuth, Credentials } from "hooks/useAuth";
import { message } from "antd";

export default function Signup() {
  const { signup } = useAuth();
  const router = useRouter();

  const handleSignup = async ({ email, password }: Credentials) => {
    try {
      await signup({ email, password });
      router.push("/org-account");
    } catch (error) {
      message.error(error.message);
    }
  };

  return (
    <>
      <Header title="Signup" />

      <main>
        <SignupForm onSubmit={handleSignup as (values: unknown) => void} />
      </main>
    </>
  );
}
