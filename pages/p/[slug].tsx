/**
 * A published composed product, live — rendered by the SAME ComposedProductRenderer the
 * UX Builder previews with (docs/CR2-PRODUCT-STUDIO-SPEC.md §7-8). Signed-in users only
 * for now; submissions store the answers plus the results shown, as a snapshot.
 */
import { Typography, message } from 'antd';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';

import { ComposedProductRenderer } from 'components/products/ComposedProductRenderer';
import type { SubmitResult } from 'components/products/ComposedProductRenderer';
import type { ComposedDefinition, ComposedSmartField } from 'lib/products/composed';
import { buildVariableCatalog } from 'lib/smartFields/catalogServer';
import type { FieldValues, SmartVariable } from 'lib/smartFields/variables';
import type { EquationToken } from 'lib/smartFields/variables';
import { getUserFromContext } from 'lib/middleware';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';

const { Title, Paragraph, Text } = Typography;

type Props = {
  product: { id: string; name: string; description: string | null; slug: string };
  isDraft: boolean;
  definition: ComposedDefinition;
  smartFields: ComposedSmartField[];
  variables: SmartVariable[];
};

export const getServerSideProps: GetServerSideProps = async context => {
  const slug = String(context.params?.slug ?? '');
  const wantsDraft = context.query.draft === '1';
  const product = await prisma.dataProductDefinition.findUnique({ where: { slug } });
  if (!product || !product.screensJson) return { notFound: true };

  // Access rules set at publish time:
  //   public   → anyone with the link, no sign-in
  //   client   → any signed-in Chart-Reuse user
  //   internal → Upstream staff only
  // ?draft=1 shows the current draft (even unpublished) to Upstream staff — that is what
  // the builder's "Preview in new tab" opens.
  const needsAuth = wantsDraft || !product.isPublic;
  if (needsAuth) {
    const { user } = await getUserFromContext(context, { org: true });
    if (!user) return { redirect: { destination: '/', permanent: false } };
    const staffOnly = wantsDraft || product.audience === 'internal';
    if (staffOnly && !user.org.isUpstream) return { notFound: true };
  }
  if (!wantsDraft && product.status !== 'published') return { notFound: true };

  const definition: ComposedDefinition = {
    screens: (product.screensJson as any).screens ?? [],
    inputFields: ((product.inputSchemaJson as any)?.fields ?? []) as ComposedDefinition['inputFields']
  };

  const fieldIds = definition.screens
    .flatMap(s => s.blocks)
    .flatMap(b => (b.kind === 'smartFieldCard' ? [b.smartFieldId] : []));
  const fields = await prisma.smartField.findMany({ where: { id: { in: fieldIds } } });
  const smartFields: ComposedSmartField[] = fields.map(f => ({
    id: f.id,
    name: f.name,
    unit: f.unit,
    description: f.description,
    equation: f.equation as unknown as EquationToken[]
  }));

  const variables = await buildVariableCatalog();

  return {
    props: serializeJSON({
      product: { id: product.id, name: product.name, description: product.description, slug: product.slug },
      isDraft: wantsDraft && product.status !== 'published',
      definition,
      smartFields,
      variables
    })
  };
};

export default function ComposedProductPage({ product, definition, smartFields, variables, isDraft }: Props) {
  async function handleSubmit(values: FieldValues, results: SubmitResult) {
    // A draft preview is for looking, not for storing — say so instead of failing
    // quietly (found 2026-09-19: a preview's "Save" hit the API and 404ed in silence).
    if (isDraft) {
      message.info('This is a draft preview — results are not saved. Publish the product to accept real submissions.');
      return;
    }
    const res = await fetch(`/api/products/${product.slug}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values, results })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Could not save');
  }

  return (
    <>
      <Head>
        <title>{`${product.name} | Chart-Reuse`}</title>
      </Head>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px 80px' }}>
        <Text type='secondary' style={{ fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
          Chart-Reuse
        </Text>
        <Title level={2} style={{ marginTop: 2, marginBottom: 4 }}>
          {product.name}
        </Title>
        {isDraft && (
          <Text
            style={{
              display: 'inline-block',
              background: '#fffbe6',
              border: '1px solid #ffe58f',
              borderRadius: 6,
              padding: '2px 10px',
              fontSize: 12,
              marginBottom: 8
            }}
          >
            Draft preview — only Upstream staff can see this page, and results are not saved.
          </Text>
        )}
        {product.description && (
          <Paragraph type='secondary' style={{ maxWidth: 640 }}>
            {product.description}
          </Paragraph>
        )}
        <div style={{ marginTop: 24 }}>
          <ComposedProductRenderer
            definition={definition}
            smartFields={smartFields}
            variables={variables}
            mode='live'
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </>
  );
}
