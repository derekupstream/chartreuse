import { Typography } from 'antd';
import type { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import styled from 'styled-components';

import { SlateEditor } from 'components/common/SlateEditor';
import prisma from 'lib/prisma';
import { serializeJSON } from 'lib/objects';
import { formatDateShort } from 'lib/dates';

const PageWrapper = styled.div`
  max-width: 760px;
  margin: 0 auto;
  padding: 40px 24px 80px;
`;

const Meta = styled.p`
  color: rgba(0, 0, 0, 0.45);
  font-size: 13px;
  margin-bottom: 32px;
`;

const ContentWrapper = styled.div`
  h1 {
    font-size: 28px;
    font-weight: 700;
    margin: 24px 0 12px;
  }
  h2 {
    font-size: 22px;
    font-weight: 600;
    margin: 20px 0 10px;
  }
  p {
    line-height: 1.7;
    margin-bottom: 12px;
  }
  ul,
  ol {
    padding-left: 24px;
    margin-bottom: 12px;
  }
  li {
    line-height: 1.7;
  }
`;

type Props = {
  title: string;
  content: any;
  publishedAt: string | null;
};

export default function MethodologyPage({ title, content, publishedAt }: Props) {
  return (
    <>
      <Head>
        <title>{title} — Methodology | Chartreuse</title>
      </Head>
      <PageWrapper>
        <Typography.Title level={1} style={{ marginBottom: 4 }}>
          {title}
        </Typography.Title>
        {publishedAt && <Meta>Published {formatDateShort(publishedAt as any)}</Meta>}
        <ContentWrapper>
          <SlateEditor value={content} readOnly />
        </ContentWrapper>
      </PageWrapper>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const docs = await prisma.methodologyDocument.findMany({
    where: { status: 'published' },
    select: { slug: true }
  });
  return {
    paths: docs.map(d => ({ params: { slug: d.slug } })),
    fallback: 'blocking'
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const doc = await prisma.methodologyDocument.findUnique({
    where: { slug: params!.slug as string }
  });

  if (!doc || doc.status !== 'published') return { notFound: true };

  return {
    props: serializeJSON({ title: doc.title, content: doc.content, publishedAt: doc.publishedAt }),
    revalidate: 60
  };
};
