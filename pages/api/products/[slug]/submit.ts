import type { NextApiResponse } from 'next';

import type { NextApiRequestWithUser } from 'lib/middleware';
import { handlerWithUser } from 'lib/middleware';
import prisma from 'lib/prisma';

/**
 * Store a composed-product submission: the user's answers plus the smart-field results
 * they were shown (a snapshot — later factor changes never rewrite what a user saw).
 * Signed-in users of any org.
 */
const handler = handlerWithUser();

handler.post(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const slug = String(req.query.slug ?? '');
  const product = await prisma.dataProductDefinition.findUnique({ where: { slug } });
  if (!product || product.status !== 'published' || !product.screensJson) {
    return res.status(404).json({ error: 'No published product at that address' });
  }

  const values = req.body?.values;
  const results = req.body?.results ?? null;
  if (!values || typeof values !== 'object' || Array.isArray(values)) {
    return res.status(400).json({ error: 'values must be an object of input answers' });
  }

  const submission = await prisma.productSubmission.create({
    data: {
      productId: product.id,
      productVersion: product.publishedVersion ?? product.version,
      valuesJson: values,
      resultsJson: results,
      createdByUserId: req.user.id
    }
  });
  res.json({ id: submission.id });
});

export default handler;
