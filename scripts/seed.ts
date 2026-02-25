/**
 * Seed script: imports exported production JSON data into local database.
 * Run with: npx tsx scripts/seed.ts
 *
 * Insert order respects foreign key dependencies:
 * Org → Account → User → Project → line items
 */

import { PrismaClient, ProjectCategory } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const DATA_DIR = '/Users/derekalanrowe/Documents/Upstream/Chart-Reuse/Download/Firebase';

function loadJson<T>(filename: string): T[] {
  const filePath = path.join(DATA_DIR, filename);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T[];
}

// The Upstream org that owns templates — we'll create a local admin user here
const UPSTREAM_ORG_ID = '79cb54a3-8b75-4841-93d4-a23fd1c07553';
const LOCAL_ADMIN_USER_ID = 'local-seed-admin';
const LOCAL_ADMIN_EMAIL = 'admin@chartreuse.local';

async function seedOrgs() {
  const orgs = loadJson<any>('orgs.json');
  console.log(`Seeding ${orgs.length} orgs...`);

  for (const org of orgs) {
    await prisma.org.upsert({
      where: { id: org.id },
      update: {},
      create: {
        id: org.id,
        name: org.name,
        metadata: org.metadata ?? undefined,
        currency: org.currency ?? 'USD',
        useMetricSystem: org.useMetricSystem ?? false,
        useShrinkageRate: org.useShrinkageRate ?? false,
        isUpstream: org.id === UPSTREAM_ORG_ID,
        createdAt: new Date(org.createdAt),
      },
    });
  }
  console.log('  ✓ Orgs done');
}

async function seedAccounts() {
  const accounts = loadJson<any>('accounts.json');
  console.log(`Seeding ${accounts.length} accounts...`);

  for (const account of accounts) {
    await prisma.account.upsert({
      where: { id: account.id },
      update: {},
      create: {
        id: account.id,
        name: account.name,
        metadata: account.metadata ?? undefined,
        accountContactEmail: account.accountContactEmail,
        USState: account.USState ?? 'California',
        orgId: account.orgId,
        createdAt: new Date(account.createdAt),
      },
    });
  }
  console.log('  ✓ Accounts done');
}

async function seedUsers() {
  const users = loadJson<any>('users.json');
  console.log(`Seeding ${users.length} users...`);
  await prisma.user.createMany({
    skipDuplicates: true,
    data: users.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      title: u.title ?? undefined,
      phone: u.phone ?? undefined,
      role: u.role,
      orgId: u.orgId,
      accountId: u.accountId ?? undefined,
      createdAt: new Date(u.createdAt),
    })),
  });
  console.log('  ✓ Users done');
}

async function seedLocalAdminUser() {
  console.log('Creating local admin user...');

  // Find an account in the Upstream org to link the user to
  const upstreamAccount = await prisma.account.findFirst({
    where: { orgId: UPSTREAM_ORG_ID },
  });

  await prisma.user.upsert({
    where: { id: LOCAL_ADMIN_USER_ID },
    update: {},
    create: {
      id: LOCAL_ADMIN_USER_ID,
      name: 'Local Admin',
      email: LOCAL_ADMIN_EMAIL,
      orgId: UPSTREAM_ORG_ID,
      accountId: upstreamAccount?.id ?? undefined,
      role: 'ORG_ADMIN',
    },
  });
  console.log(`  ✓ Admin user created: ${LOCAL_ADMIN_EMAIL}`);
}

async function seedProjects() {
  const projects = loadJson<any>('projects.json');
  console.log(`Seeding ${projects.length} projects...`);

  for (const project of projects) {
    await prisma.project.upsert({
      where: { id: project.id },
      update: {},
      create: {
        id: project.id,
        name: project.name,
        metadata: project.metadata ?? undefined,
        location: project.location ?? undefined,
        USState: project.USState ?? undefined,
        currency: project.currency ?? 'USD',
        budget: project.budget ?? undefined,
        category: (project.category as ProjectCategory) ?? ProjectCategory.default,
        eventGuestCount: project.eventGuestCount ?? 0,
        singleUseReductionPercentage: project.singleUseReductionPercentage ?? undefined,
        utilityRates: project.utilityRates ?? undefined,
        dateType: project.dateType ?? undefined,
        startDate: project.startDate ? new Date(project.startDate) : undefined,
        endDate: project.endDate ? new Date(project.endDate) : undefined,
        isTemplate: project.isTemplate ?? false,
        templateDescription: project.templateDescription ?? undefined,
        orgId: project.orgId,
        accountId: project.accountId,
        createdAt: new Date(project.createdAt),
      },
    });
  }
  console.log('  ✓ Projects done');
}

async function seedSingleUseLineItems() {
  const items = loadJson<any>('single-use-line-items.json');
  console.log(`Seeding ${items.length} single-use line items...`);
  await prisma.singleUseLineItem.createMany({
    skipDuplicates: true,
    data: items.map((item: any) => ({
      id: item.id,
      productId: item.productId,
      caseCost: item.caseCost,
      casesPurchased: item.casesPurchased,
      unitsPerCase: item.unitsPerCase ?? 0,
      frequency: item.frequency,
      newCaseCost: item.newCaseCost ?? item.caseCost,
      newCasesPurchased: item.newCasesPurchased ?? item.casesPurchased,
      projectId: item.projectId,
      createdAt: new Date(item.createdAt),
    })),
  });
  console.log('  ✓ Single-use line items done');
}

async function seedReusableLineItems() {
  const items = loadJson<any>('reusable-line-items.json');
  console.log(`Seeding ${items.length} reusable line items...`);
  await prisma.reusableLineItem.createMany({
    skipDuplicates: true,
    data: items.map((item: any) => ({
      id: item.id,
      productId: item.productId ?? undefined,
      categoryId: item.categoryId ?? undefined,
      productName: item.productName ?? undefined,
      caseCost: item.caseCost,
      casesPurchased: item.casesPurchased,
      unitsPerCase: item.unitsPerCase ?? 0,
      annualRepurchasePercentage: item.annualRepurchasePercentage ?? 1,
      projectId: item.projectId,
      createdAt: new Date(item.createdAt),
    })),
  });
  console.log('  ✓ Reusable line items done');
}

async function seedLaborCosts() {
  const items = loadJson<any>('labor-costs.json');
  console.log(`Seeding ${items.length} labor costs...`);
  await prisma.laborCost.createMany({
    skipDuplicates: true,
    data: items.map((item: any) => ({
      id: item.id,
      categoryId: item.categoryId,
      cost: item.cost,
      description: item.description,
      frequency: item.frequency,
      projectId: item.projectId,
    })),
  });
  console.log('  ✓ Labor costs done');
}

async function seedOtherExpenses() {
  const items = loadJson<any>('other-expenses.json');
  console.log(`Seeding ${items.length} other expenses...`);
  await prisma.otherExpense.createMany({
    skipDuplicates: true,
    data: items.map((item: any) => ({
      id: item.id,
      categoryId: item.categoryId,
      cost: item.cost,
      description: item.description,
      frequency: item.frequency,
      projectId: item.projectId,
    })),
  });
  console.log('  ✓ Other expenses done');
}

async function seedWasteHaulingCosts() {
  const items = loadJson<any>('waste-hauling-costs.json');
  console.log(`Seeding ${items.length} waste hauling costs...`);
  await prisma.wasteHaulingCost.createMany({
    skipDuplicates: true,
    data: items.map((item: any) => ({
      id: item.id,
      wasteStream: item.wasteStream,
      serviceType: item.serviceType,
      description: item.description,
      monthlyCost: item.monthlyCost,
      newMonthlyCost: item.newMonthlyCost,
      projectId: item.projectId,
    })),
  });
  console.log('  ✓ Waste hauling costs done');
}

async function seedDishwashers() {
  const items = loadJson<any>('dishwashers.json');
  console.log(`Seeding ${items.length} dishwashers...`);
  await prisma.dishwasher.createMany({
    skipDuplicates: true,
    data: items.map((item: any) => ({
      id: item.id,
      type: item.type,
      temperature: item.temperature,
      energyStarCertified: item.energyStarCertified ?? false,
      boosterWaterHeaterFuelType: item.boosterWaterHeaterFuelType ?? undefined,
      buildingWaterHeaterFuelType: item.buildingWaterHeaterFuelType,
      racksPerDay: item.racksPerDay,
      newRacksPerDay: item.newRacksPerDay ?? item.racksPerDay,
      operatingDays: item.operatingDays,
      newOperatingDays: item.newOperatingDays ?? item.operatingDays,
      projectId: item.projectId,
    })),
  });
  console.log('  ✓ Dishwashers done');
}

async function seedDishwashersSimple() {
  const items = loadJson<any>('dishwashers-simple.json');
  console.log(`Seeding ${items.length} simple dishwashers...`);
  await prisma.dishwasherSimple.createMany({
    skipDuplicates: true,
    data: items.map((item: any) => ({
      id: item.id,
      waterUsage: item.waterUsage,
      electricUsage: item.electricUsage,
      fuelType: item.fuelType,
      projectId: item.projectId,
    })),
  });
  console.log('  ✓ Simple dishwashers done');
}

async function seedEventFoodwareLineItems() {
  const items = loadJson<any>('event-foodware-line-items.json');
  console.log(`Seeding ${items.length} event foodware line items...`);
  await prisma.eventFoodwareLineItem.createMany({
    skipDuplicates: true,
    data: items.map((item: any) => ({
      id: item.id,
      singleUseProductId: item.singleUseProductId,
      reusableProductId: item.reusableProductId,
      reusableItemCount: item.reusableItemCount ?? 0,
      reusableReturnPercentage: item.reusableReturnPercentage ?? 100,
      reusableReturnCount: item.reusableReturnCount ?? 0,
      waterUsageGallons: item.waterUsageGallons ?? undefined,
      projectId: item.projectId,
      createdAt: new Date(item.createdAt),
    })),
  });
  console.log('  ✓ Event foodware line items done');
}

async function main() {
  console.log('🌱 Starting seed...\n');

  await seedOrgs();
  await seedAccounts();
  await seedUsers();
  await seedLocalAdminUser();
  await seedProjects();
  await seedSingleUseLineItems();
  await seedReusableLineItems();
  await seedLaborCosts();
  await seedOtherExpenses();
  await seedWasteHaulingCosts();
  await seedDishwashers();
  await seedDishwashersSimple();
  await seedEventFoodwareLineItems();

  console.log('\n✅ Seed complete!');
  console.log(`\nLocal admin user: ${LOCAL_ADMIN_EMAIL}`);
  console.log('Note: You will need Firebase credentials in .env to log in via the UI.');
}

main()
  .catch(e => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
