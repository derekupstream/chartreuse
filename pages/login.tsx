import Head from "next/head";
import LoginForm from "components/login-form";

export default function Login() {
  return (
    <div>
      <Head>
        <title>Calculator Login</title>
        <meta name="description" content="Upstream Calculator Login" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <LoginForm />
      </main>
    </div>
  );
}
