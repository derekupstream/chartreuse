/* eslint-disable no-console */
/**
 * Seeds a golden dataset by running the real engine against an existing project.
 * Works for any category (default, event, eugene).
 *
 * Usage:
 *   npx tsx scripts/seed-golden-dataset-from-project.ts <projectId> [name]
 */
import prisma from '../lib/prisma';
import { getProjectInventory } from '../lib/inventory/getProjectInventory';
import { getProjectionsFromInventory } from '../lib/calculator/getProjections';

async function main() {
  const projectId = process.argv[2];
  const name = process.argv[3];

  if (!projectId) {
    console.error('Usage: npx tsx scripts/seed-golden-dataset-from-project.ts <projectId> [name]');
    process.exit(1);
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, category: true }
  });
  if (!project) {
    console.error(`Project ${projectId} not found`);
    process.exit(1);
  }

  const datasetName = name ?? `${project.name || 'Untitled'} (${project.category} snapshot)`;

  console.log(`Loading inventory from project "${project.name}" (${project.category})...`);
  const inventory = await getProjectInventory(projectId);

  console.log('Running real engine to compute expected outputs...');
  const expectedOutputs = getProjectionsFromInventory(inventory);

  const tagPrefix = project.category === 'event' ? 'actuals-event-model' : 'projections-model';

  const dataset = await prisma.goldenDataset.create({
    data: {
      name: datasetName,
      description: `Snapshot from project "${project.name}" — captured by seed-golden-dataset-from-project script`,
      category: project.category,
      inputs: inventory as any,
      expectedOutputs: expectedOutputs as any,
      tolerance: 0.02,
      tags: [tagPrefix, 'seeded'],
      sourceProjectId: projectId
    }
  });

  console.log(`Created golden dataset: ${dataset.id}`);
  console.log(`  Name: ${dataset.name}`);
  console.log(`  Category: ${dataset.category}`);
  console.log(`  Tags: ${dataset.tags.join(', ')}`);
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
