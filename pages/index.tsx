import Head from "next/head";
import Link from "next/link";

export default function Home() {
  return (
    <div>
      <Head>
        <title>Calculator</title>
        <meta name="description" content="Upstream Calculator" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        Home
        <div>
          <Link href="/login">
            <a>Login</a>
          </Link>
        </div>
      </main>
    </div>
  );
}
