import prisma from 'lib/prisma';
import { v4 as uuidv4 } from 'uuid';

async function seedFactorLibrary() {
  console.log('🌱 Seeding Factor Library...');

  const systemUserId = uuidv4(); // Generate a valid UUID for system user

  // Create categories (using upsert to avoid duplicates)
  const categories = await Promise.all([
    prisma.factorCategory.upsert({
      where: { name: 'Emission Factors' },
      update: {},
      create: { name: 'Emission Factors', description: 'GHG emission factors from EPA WARM and other sources' }
    }),
    prisma.factorCategory.upsert({
      where: { name: 'Utility Rates' },
      update: {},
      create: { name: 'Utility Rates', description: 'Electricity and natural gas rates by state' }
    }),
    prisma.factorCategory.upsert({
      where: { name: 'Transport Factors' },
      update: {},
      create: { name: 'Transport Factors', description: 'Ocean and land transportation emissions' }
    }),
    prisma.factorCategory.upsert({
      where: { name: 'Material Properties' },
      update: {},
      create: { name: 'Material Properties', description: 'Material weights, densities, and properties' }
    }),
    prisma.factorCategory.upsert({
      where: { name: 'Conversion Factors' },
      update: {},
      create: { name: 'Conversion Factors', description: 'Unit conversions and calculation factors' }
    })
  ]);

  // Create sources (using upsert to avoid duplicates)
  const sources = await Promise.all([
    prisma.factorSource.upsert({
      where: { name: 'EPA WARM' },
      update: {},
      create: {
        name: 'EPA WARM',
        version: '15',
        description: 'EPA Waste Reduction Model',
        url: 'https://www.epa.gov/warm'
      }
    }),
    prisma.factorSource.upsert({
      where: { name: 'DOE EIA' },
      update: {},
      create: {
        name: 'DOE EIA',
        version: '2023',
        description: 'Department of Energy Energy Information Administration',
        url: 'https://www.eia.gov'
      }
    }),
    prisma.factorSource.upsert({
      where: { name: 'EPA eGRID' },
      update: {},
      create: {
        name: 'EPA eGRID',
        version: '2022',
        description: 'EPA Emissions & Generation Resource Integrated Database',
        url: 'https://www.epa.gov/egrid'
      }
    })
  ]);

  // Create sample factors
  const factors = await Promise.all([
    // Emission Factors
    prisma.factor.create({
      data: {
        name: 'PET Bottle Disposal Emission Factor',
        description: 'CO2 equivalent emissions per kg of PET bottle disposed in landfill',
        currentValue: 2.43,
        unit: 'kg CO2e/kg',
        categoryId: categories[0].id,
        sourceId: sources[0].id,
        region: 'US',
        createdBy: systemUserId
      }
    }),
    prisma.factor.create({
      data: {
        name: 'Glass Bottle Disposal Emission Factor',
        description: 'CO2 equivalent emissions per kg of glass bottle disposed in landfill',
        currentValue: 0.31,
        unit: 'kg CO2e/kg',
        categoryId: categories[0].id,
        sourceId: sources[0].id,
        region: 'US',
        createdBy: systemUserId
      }
    }),
    prisma.factor.create({
      data: {
        name: 'California Electricity Grid Emission Factor',
        description: 'CO2 emissions per kWh of electricity in California',
        currentValue: 0.209,
        unit: 'kg CO2e/kWh',
        categoryId: categories[0].id,
        sourceId: sources[2].id,
        region: 'CA',
        createdBy: systemUserId
      }
    }),
    // Utility Rates
    prisma.factor.create({
      data: {
        name: 'California Commercial Electricity Rate',
        description: 'Average commercial electricity rate in California',
        currentValue: 0.168,
        unit: '$/kWh',
        categoryId: categories[1].id,
        sourceId: sources[1].id,
        region: 'CA',
        createdBy: systemUserId
      }
    }),
    prisma.factor.create({
      data: {
        name: 'California Commercial Natural Gas Rate',
        description: 'Average commercial natural gas rate in California',
        currentValue: 1.24,
        unit: '$/therm',
        categoryId: categories[1].id,
        sourceId: sources[1].id,
        region: 'CA',
        createdBy: systemUserId
      }
    }),
    // Transport Factors
    prisma.factor.create({
      data: {
        name: 'Ocean Transport Emission Factor',
        description: 'CO2 emissions per ton-mile for ocean freight',
        currentValue: 0.040,
        unit: 'kg CO2e/ton-mile',
        categoryId: categories[2].id,
        sourceId: sources[0].id,
        region: 'Global',
        createdBy: systemUserId
      }
    }),
    // Material Properties
    prisma.factor.create({
      data: {
        name: 'PET Bottle Weight',
        description: 'Average weight of a 16oz PET bottle',
        currentValue: 0.05,
        unit: 'kg/bottle',
        categoryId: categories[3].id,
        sourceId: sources[0].id,
        region: 'US',
        createdBy: systemUserId
      }
    }),
    prisma.factor.create({
      data: {
        name: 'Glass Bottle Weight',
        description: 'Average weight of a 16oz glass bottle',
        currentValue: 0.35,
        unit: 'kg/bottle',
        categoryId: categories[3].id,
        sourceId: sources[0].id,
        region: 'US',
        createdBy: systemUserId
      }
    })
  ]);

  console.log(`✅ Created ${categories.length} categories, ${sources.length} sources, ${factors.length} factors`);
}

async function main() {
  try {
    await seedFactorLibrary();
    console.log('🎉 Factor library seeding complete!');
  } catch (error) {
    console.error('❌ Error seeding factor library:', error);
    process.exit(1);
  }
}

main();
