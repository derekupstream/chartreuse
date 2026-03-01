import Anthropic from '@anthropic-ai/sdk';
import type { NextApiResponse } from 'next';

import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import prisma from 'lib/prisma';

export type InsightCard = {
  category: string;
  title: string;
  insight: string;
  dataPoints: string[];
};

export default handlerWithUser()
  .get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const isUpstream = await checkIsUpstream(req.user.orgId);
    if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

    const latest = await prisma.adminInsight.findFirst({ orderBy: { generatedAt: 'desc' } });
    return res.status(200).json({ insight: latest });
  })
  .post(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const isUpstream = await checkIsUpstream(req.user.orgId);
    if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

    try {
      const [
        orgCount,
        rspOrgCount,
        projectCount,
        eventProjectCount,
        defaultProjectCount,
        rspPeriodStats,
        milestoneStats,
        journeyStageGroups,
        orgTypeGroups,
        dishwasherCount
      ] = await Promise.all([
        prisma.org.count({ where: { isUpstream: false } }),
        prisma.org.count({ where: { orgType: 'reuse-service-provider' } }),
        prisma.project.count({ where: { isTemplate: false } }),
        prisma.project.count({ where: { isTemplate: false, category: 'event' } }),
        prisma.project.count({ where: { isTemplate: false, category: 'default' } }),
        prisma.usageTimePeriod.aggregate({
          where: { status: 'active' },
          _count: { id: true },
          _sum: { co2AvoidedKg: true, waterSavedGallons: true, wasteDivertedLbs: true }
        }),
        prisma.projectMilestone.aggregate({
          _count: { id: true },
          _avg: { co2AvoidedMtco2e: true, annualCostSavings: true, paybackMonths: true, returnRatePct: true }
        }),
        prisma.org.groupBy({ by: ['reuseJourneyStage'], where: { isUpstream: false }, _count: { id: true } }),
        prisma.org.groupBy({
          by: ['orgType'],
          where: { isUpstream: false, orgType: { not: null } },
          _count: { id: true }
        }),
        prisma.dishwasher.count()
      ]);

      const stats = {
        orgs: {
          total: orgCount,
          rspCount: rspOrgCount,
          byJourneyStage: journeyStageGroups
            .filter(g => g.reuseJourneyStage)
            .map(g => ({ stage: g.reuseJourneyStage, count: g._count.id })),
          byType: orgTypeGroups.map(g => ({ type: g.orgType, count: g._count.id }))
        },
        projects: {
          total: projectCount,
          actuals: eventProjectCount,
          projections: defaultProjectCount
        },
        rspActivity: {
          activePeriods: rspPeriodStats._count.id,
          totalCo2Kg: rspPeriodStats._sum.co2AvoidedKg ?? 0,
          totalWaterGal: rspPeriodStats._sum.waterSavedGallons ?? 0,
          totalWasteLbs: rspPeriodStats._sum.wasteDivertedLbs ?? 0
        },
        milestones: {
          total: milestoneStats._count.id,
          avgCo2AvoidedMtco2e: milestoneStats._avg.co2AvoidedMtco2e ?? 0,
          avgAnnualCostSavings: milestoneStats._avg.annualCostSavings ?? 0,
          avgPaybackMonths: milestoneStats._avg.paybackMonths ?? 0,
          avgReturnRatePct: milestoneStats._avg.returnRatePct ?? 0
        },
        dishwasherCount
      };

      const prompt = `You are a sustainability analyst for ChartReuse, a SaaS platform that helps organizations track and optimize reusable foodware programs (replacing single-use cups, plates, bowls, utensils, etc.).

Here is anonymized aggregate data from our platform:
${JSON.stringify(stats, null, 2)}

Generate 8–12 actionable insights that would be valuable for:
- Reuse Service Providers (RSPs) wanting to grow their business
- Organizations considering or running reuse programs
- The ChartReuse team improving the product

Be specific, reference actual numbers from the data, and create logical categories. Focus on: program performance benchmarks, environmental impact patterns, financial outcomes, operational trends, and opportunities for growth.

Return ONLY a valid JSON array with this exact structure (no markdown, no explanation):
[{"category": "string", "title": "string", "insight": "string", "dataPoints": ["string"]}]`;

      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }]
      });

      const rawText = message.content[0].type === 'text' ? message.content[0].text : '';

      let insights: InsightCard[] = [];
      try {
        insights = JSON.parse(rawText);
      } catch {
        const match = rawText.match(/\[[\s\S]*\]/);
        if (match) {
          try {
            insights = JSON.parse(match[0]);
          } catch {
            return res.status(500).json({ error: 'Failed to parse AI response', raw: rawText });
          }
        }
      }

      // Keep only latest 10 records
      const oldRecords = await prisma.adminInsight.findMany({
        orderBy: { generatedAt: 'desc' },
        skip: 9,
        select: { id: true }
      });
      if (oldRecords.length > 0) {
        await prisma.adminInsight.deleteMany({ where: { id: { in: oldRecords.map(r => r.id) } } });
      }

      const saved = await prisma.adminInsight.create({
        data: { content: insights as any, modelUsed: 'claude-haiku-4-5-20251001' }
      });

      return res.status(200).json({ insight: saved });
    } catch (err: any) {
      console.error('[insights POST]', err);
      return res.status(500).json({ error: err?.message ?? 'Internal server error' });
    }
  });
