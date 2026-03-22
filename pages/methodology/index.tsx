import { Typography } from 'antd';
import type { GetStaticProps } from 'next';
import dynamic from 'next/dynamic';
import styled from 'styled-components';

import { SharedPageLayout } from 'layouts/SharedPageLayout';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';

const TipTapEditor = dynamic(() => import('components/common/TipTapEditor'), { ssr: false });

const EnvironmentalMetricsFlow = dynamic(() => import('components/methodology/EnvironmentalMetricsFlow'), {
  ssr: false
});
const GHGCalculationFlow = dynamic(() => import('components/methodology/GHGCalculationFlow'), { ssr: false });
const CostCalculationFlow = dynamic(() => import('components/methodology/CostCalculationFlow'), { ssr: false });

const { Title, Text } = Typography;

type Section = {
  id: string;
  title: string;
  sectionNumber: string;
  content: any;
  publishedAt: string | null;
};

type Props = {
  sections: Section[];
};

const PageWrapper = styled.div`
  max-width: 860px;
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

const FlowchartLabel = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.45);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 24px;
  margin-bottom: 4px;
`;

// Map section slugs (via sectionNumber) to the flowcharts that should render after them
const SECTION_FLOWCHARTS: Record<string, React.ComponentType[]> = {
  '1': [EnvironmentalMetricsFlow],
  '1.1': [GHGCalculationFlow],
  '1.5': [CostCalculationFlow]
};

const FLOWCHART_LABELS: Record<string, string[]> = {
  '1': ['Figure 1: Environmental Metrics Overview'],
  '1.1': ['Figure 2: GHG 4-Step Calculation Process'],
  '1.5': ['Figure 3: Cost Calculation Components']
};

export default function MethodologyPage({ sections }: Props) {
  return (
    <SharedPageLayout title='Methodology'>
      <PageWrapper>
        <Title level={1} style={{ marginBottom: 8 }}>
          Methodology
        </Title>
        <Text type='secondary' style={{ display: 'block', marginBottom: 48, fontSize: 15 }}>
          Chart-Reuse Methodology Version 2.0 — the data sources, calculation methods, and assumptions behind the
          Chart-Reuse calculator.
        </Text>

        {sections.length === 0 ? (
          <Text type='secondary'>No methodology documentation has been published yet.</Text>
        ) : (
          sections.map(s => {
            const flowcharts = SECTION_FLOWCHARTS[s.sectionNumber];
            const labels = FLOWCHART_LABELS[s.sectionNumber];
            return (
              <SectionBlock key={s.id}>
                <h2>{s.sectionNumber ? `${s.sectionNumber} ${s.title}` : s.title}</h2>
                <TipTapEditor content={s.content} editable={false} />
                {flowcharts?.map((FlowChart, i) => (
                  <div key={i}>
                    {labels?.[i] && <FlowchartLabel>{labels[i]}</FlowchartLabel>}
                    <FlowChart />
                  </div>
                ))}
                {s.publishedAt && (
                  <Text type='secondary' style={{ fontSize: 12, display: 'block', marginTop: 16 }}>
                    Published {new Date(s.publishedAt).toLocaleDateString()}
                  </Text>
                )}
              </SectionBlock>
            );
          })
        )}
      </PageWrapper>
    </SharedPageLayout>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const sections = await prisma.methodologyDocument.findMany({
    where: { status: 'published' },
    orderBy: { order: 'asc' },
    select: { id: true, title: true, sectionNumber: true, content: true, publishedAt: true }
  });

  return {
    props: serializeJSON({ sections }),
    revalidate: 60
  };
};
