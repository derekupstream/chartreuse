import Head from "next/head";

type Meta = {
  name: string;
  content: string;
};

type Props = {
  title: string;
  meta?: Meta[];
};

export default function Header({ title, meta }: Props) {
  return (
    <Head>
      <title>Upstream Calculator - {title}</title>
      {meta?.map(({ name, content }) => {
        return <meta key={name} name={name} content={content} />;
      })}
      <link rel="icon" href="/favicon.ico" />
    </Head>
  );
}
