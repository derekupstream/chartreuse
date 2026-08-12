/**
 * Public, shareable page explaining the RSP data ingestion model.
 *
 * Deliberately requires no login: a provider evaluating the integration sends this link to
 * their engineers and their customers before anyone has an account. Contains nothing
 * sensitive — it describes the pipeline, not any org's data.
 */
import Head from 'next/head';
import { Typography } from 'antd';

import { IngestionModelDiagram } from 'components/rsp/IngestionModelDiagram';

const { Title, Paragraph } = Typography;

export default function IngestionModelPage() {
  return (
    <>
      <Head>
        <title>Data Ingestion Model — Chart-Reuse</title>
        <meta
          name='description'
          content='How reuse service provider data flows into Chart-Reuse: what is sent, how impact is calculated, what is stored, and what is never collected.'
        />
      </Head>
      <div style={{ background: '#14532d', padding: '36px 24px', textAlign: 'center' }}>
        <Title style={{ color: '#fff', margin: 0 }} level={2}>
          Chart-Reuse · Data Ingestion Model
        </Title>
        <Paragraph style={{ color: '#d1e7dc', marginTop: 8, marginBottom: 0 }}>
          What happens to your operational data, from the moment your system sends it to the moment it appears on your
          customer&apos;s dashboard.
        </Paragraph>
      </div>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
        <IngestionModelDiagram />
        <Paragraph type='secondary' style={{ textAlign: 'center', fontSize: 12, marginTop: 24 }}>
          Chart-Reuse by Upstream Solutions · Questions about integrating? Contact your Upstream partner manager.
        </Paragraph>
      </div>
    </>
  );
}
