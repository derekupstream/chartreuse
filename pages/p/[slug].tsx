/**
 * A published composed product, live — rendered by the SAME ComposedProductRenderer the
 * UX Builder previews with (docs/CR2-PRODUCT-STUDIO-SPEC.md §7-8). Signed-in users only
 * for now; submissions store the answers plus the results shown, as a snapshot.
 */
import { Typography } from 'antd';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';

import { ComposedProductRenderer } from 'components/products/ComposedProductRenderer';
import type { SubmitResult } from 'components/products/ComposedProductRenderer';
import type { ComposedDefinition, ComposedSmartField } from 'lib/products/composed';
import { buildVariableCatalog } from 'lib/smartFields/catalogServer';
import type { SmartVariable } from 'lib/smartFields/variables';
import type { EquationToken } from 'lib/smartFields/variables';
import { getUserFromContext } from 'lib/middleware';
import { serializeJSON } from 'lib/objects';
import prisma from 'lib/prisma';

const { Title, Paragraph, Text } = Typography;

type Props = {
  product: { id: string; name: string; description: string | null; slug: string };
  definition: ComposedDefinition;
  smartFields: ComposedSmartField[];
  variables: SmartVariable[];
};

export const getServerSideProps: GetServerSideProps = async context => {
  const { user } = await getUserFromContext(context);
  if (!user) return { redirect: { destination: '/', permanent: false } };

  const slug = String(context.params?.slug ?? '');
  const product = await prisma.dataProductDefinition.findUnique({ where: { slug } });
  if (!product || product.status !== 'published' || !product.screensJson) return { notFound: true };

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
      definition,
      smartFields,
      variables
    })
  };
};

export default function ComposedProductPage({ product, definition, smartFields, variables }: Props) {
  async function handleSubmit(values: Record<string, number>, results: SubmitResult) {
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
