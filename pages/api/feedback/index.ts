import type { NextApiResponse } from 'next';
import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import prisma from 'lib/prisma';

export default handlerWithUser()
  // Submit feedback (any authenticated user)
  .post(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const { category, message, pageUrl } = req.body;
    if (!category || !message) return res.status(400).json({ error: 'category and message required' });

    const submission = await prisma.feedbackSubmission.create({
      data: { userId: req.user.id, category, message, pageUrl: pageUrl ?? null }
    });

    res.status(201).json(submission);
  })
  // List all feedback (admin only)
  .get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const isUpstream = await checkIsUpstream(req.user.orgId);
    if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

    const { status } = req.query;
    const submissions = await prisma.feedbackSubmission.findMany({
      where: status ? { status: status as string } : undefined,
      orderBy: { createdAt: 'desc' }
    });

    // Enrich with user info
    const userIds = Array.from(new Set(submissions.map(s => s.userId)));
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      include: { org: { select: { name: true } } }
    });
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));

    res.json(submissions.map(s => ({ ...s, user: userMap[s.userId] ?? null })));
  });
