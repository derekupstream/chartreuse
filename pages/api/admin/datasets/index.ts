import type { NextApiResponse } from 'next';
import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import prisma from 'lib/prisma';
import { getProjectInventory } from 'lib/inventory/getProjectInventory';
import { getAnnualSummary } from 'lib/calculator/calculations/getAnnualSummary';
import { getEnvironmentalResults } from 'lib/calculator/calculations/getEnvironmentalResults';
import { getFinancialResults } from 'lib/calculator/calculations/getFinancialResults';
import { getSingleUseResults } from 'lib/calculator/calculations/foodware/getSingleUseResults';
import { getReusableResults } from 'lib/calculator/calculations/foodware/getReusableResults';
import { getBottleStationResults } from 'lib/calculator/calculations/foodware/getBottleStationResults';

export default handlerWithUser()
  .get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const isUpstream = await checkIsUpstream(req.user.orgId);
    if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

    const datasets = await prisma.goldenDataset.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        tolerance: true,
        isActive: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
        sourceProjectId: true,
        testResults: {
          orderBy: { testRun: { createdAt: 'desc' } },
          take: 1,
          select: { passed: true }
        }
      }
    });

    res.json(datasets);
  })
  .post(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    const isUpstream = await checkIsUpstream(req.user.orgId);
    if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

    const { projectId, name, description, tolerance = 0.02, tags = [] } = req.body;
    if (!projectId || !name) return res.status(400).json({ error: 'projectId and name required' });

    // Fetch the project to get its category
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, category: true }
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Snapshot the current inventory and compute expected outputs
    const inventory = await getProjectInventory(projectId);
    const expectedOutputs = {
      annualSummary: getAnnualSummary(inventory),
      environmentalResults: getEnvironmentalResults(inventory),
      financialResults: getFinancialResults(inventory),
      singleUseResults: getSingleUseResults(inventory),
      reusableResults: getReusableResults(inventory),
      bottleStationResults: getBottleStationResults(inventory)
    };

    const dataset = await prisma.goldenDataset.create({
      data: {
        name,
        description: description || null,
        category: project.category,
        inputs: inventory as any,
        expectedOutputs: expectedOutputs as any,
        tolerance,
        tags,
        sourceProjectId: projectId
      }
    });

    res.status(201).json(dataset);
  });
