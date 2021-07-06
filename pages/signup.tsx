import Head from "next/head";
import SignupForm from "components/signup-form";

export default function Signup() {
  return (
    <div>
      <Head>
        <title>Calculator Signup</title>
        <meta name="description" content="Upstream Calculator Signup" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <SignupForm />
      </main>
    </div>
  );
}
