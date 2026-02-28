import { Typography } from 'antd';
import type { GetStaticProps } from 'next';
import dynamic from 'next/dynamic';
import styled from 'styled-components';

import { SharedPageLayout } from 'layouts/SharedPageLayout';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';

const TipTapEditor = dynamic(() => import('components/common/TipTapEditor'), { ssr: false });

const { Title, Text } = Typography;

type Section = {
  id: string;
  title: string;
  content: any;
  publishedAt: string | null;
};

type Props = {
  sections: Section[];
};

const PageWrapper = styled.div`
  max-width: 760px;
  margin: 0 auto;
  padding: 48px 24px 96px;
`;

const SectionBlock = styled.section`
  margin-bottom: 56px;

  h2 {
    font-size: 22px;
    font-weight: 600;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid #f0f0f0;
  }
`;

export default function MethodologyPage({ sections }: Props) {
  return (
    <SharedPageLayout title='Methodology'>
      <PageWrapper>
        <Title level={1} style={{ marginBottom: 8 }}>
          Methodology
        </Title>
        <Text type='secondary' style={{ display: 'block', marginBottom: 48, fontSize: 15 }}>
          The data sources, calculation methods, and assumptions behind the Chart-Reuse calculator.
        </Text>

        {sections.length === 0 ? (
          <Text type='secondary'>No methodology documentation has been published yet.</Text>
        ) : (
          sections.map(s => (
            <SectionBlock key={s.id}>
              <h2>{s.title}</h2>
              <TipTapEditor content={s.content} editable={false} />
              {s.publishedAt && (
                <Text type='secondary' style={{ fontSize: 12, display: 'block', marginTop: 16 }}>
                  Published {new Date(s.publishedAt).toLocaleDateString()}
                </Text>
              )}
            </SectionBlock>
          ))
        )}
      </PageWrapper>
    </SharedPageLayout>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const sections = await prisma.methodologyDocument.findMany({
    where: { status: 'published' },
    orderBy: { order: 'asc' },
    select: { id: true, title: true, content: true, publishedAt: true }
  });

  return {
    props: serializeJSON({ sections }),
    revalidate: 60
  };
};
