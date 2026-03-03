import type { NextApiResponse } from 'next';
import { handlerWithUser } from 'lib/middleware/handler';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import prisma from 'lib/prisma';

export type ShareSettings = {
  bannerImageUrl?: string | null;
  showTooltips?: boolean;
  sliderType?: 'timeline' | 'customers' | null;
  customerLabel?: 'customers' | 'students';
};

export default handlerWithUser()
  .get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const { id } = req.query as { id: string };

    const project = await prisma.project.findFirst({
      where: { id, orgId: req.user.orgId },
      select: { shareSettings: true }
    });

    if (!project) return res.status(404).json({ error: 'Not found' });
    return res.json({ shareSettings: project.shareSettings ?? {} });
  })
  .put(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const { id } = req.query as { id: string };

    const existing = await prisma.project.findFirst({
      where: { id, orgId: req.user.orgId },
      select: { shareSettings: true }
    });

    if (!existing) return res.status(404).json({ error: 'Not found' });

    const current = (existing.shareSettings ?? {}) as ShareSettings;
    const updated: ShareSettings = { ...current, ...(req.body as ShareSettings) };

    await prisma.project.update({
      where: { id },
      data: { shareSettings: updated as any }
    });

    return res.json({ shareSettings: updated });
  });
