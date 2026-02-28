import prisma from 'lib/prisma';
import { MATERIALS, REUSABLE_MATERIALS } from 'lib/calculator/constants/materials';
import { STATES } from 'lib/calculator/constants/utilities';
import {
  ELECTRIC_CO2_EMISSIONS_FACTOR,
  NATURAL_GAS_CO2_EMISSIONS_FACTOR,
  TRANSPORTATION_CO2_EMISSIONS_FACTOR
} from 'lib/calculator/constants/carbon-dioxide-emissions';

// A stable system-level user UUID used for seeded records
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001';

async function seedFactorLibrary() {
  console.log('🌱 Seeding Factor Library...');

  // ── Categories ────────────────────────────────────────────────────────────
  const [emissionCat, utilityCat, transportCat, materialCat, conversionCat] = await Promise.all([
    prisma.factorCategory.upsert({
      where: { name: 'Emission Factors' },
      update: {},
      create: { name: 'Emission Factors', description: 'GHG emission factors from EPA WARM and EPA eGRID' }
    }),
    prisma.factorCategory.upsert({
      where: { name: 'Utility Rates' },
      update: {},
      create: { name: 'Utility Rates', description: 'Commercial electricity and natural gas rates by state (DOE EIA)' }
    }),
    prisma.factorCategory.upsert({
      where: { name: 'Transport Factors' },
      update: {},
      create: { name: 'Transport Factors', description: 'Ocean and land transportation emission factors' }
    }),
    prisma.factorCategory.upsert({
      where: { name: 'Material Properties' },
      update: {},
      create: { name: 'Material Properties', description: 'Water usage per lb for each material (EPA WARM)' }
    }),
    prisma.factorCategory.upsert({
      where: { name: 'Conversion Factors' },
      update: {},
      create: { name: 'Conversion Factors', description: 'Unit conversion constants' }
    })
  ]);

  // ── Sources ───────────────────────────────────────────────────────────────
  const [epaWarm, doeEia, epaEgrid] = await Promise.all([
    prisma.factorSource.upsert({
      where: { name: 'EPA WARM' },
      update: {},
      create: {
        name: 'EPA WARM',
        version: '15',
        description: 'EPA Waste Reduction Model — Hidden: EPA WARM Assumptions sheet',
        url: 'https://www.epa.gov/warm'
      }
    }),
    prisma.factorSource.upsert({
      where: { name: 'DOE EIA' },
      update: {},
      create: {
        name: 'DOE EIA',
        version: '2023',
        description: 'Department of Energy Energy Information Administration — commercial rates',
        url: 'https://www.eia.gov/electricity/state/'
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

  let factorCount = 0;

  // ── Emission factors for electricity and natural gas ──────────────────────
  await upsertFactor({
    name: 'Electric CO₂ Emissions Factor',
    description: 'CO₂ emissions per kWh of electricity consumed',
    currentValue: ELECTRIC_CO2_EMISSIONS_FACTOR,
    unit: 'lbs CO₂/kWh',
    categoryId: emissionCat.id,
    sourceId: epaEgrid.id,
    region: 'US',
    calculatorConstantKey: 'ELECTRIC_CO2_EMISSIONS_FACTOR',
    notes: 'Used in dishwasher utility calculations'
  });
  factorCount++;

  await upsertFactor({
    name: 'Natural Gas CO₂ Emissions Factor',
    description: 'CO₂ emissions per therm of natural gas consumed',
    currentValue: NATURAL_GAS_CO2_EMISSIONS_FACTOR,
    unit: 'lbs CO₂/therm',
    categoryId: emissionCat.id,
    sourceId: epaWarm.id,
    region: 'US',
    calculatorConstantKey: 'NATURAL_GAS_CO2_EMISSIONS_FACTOR',
    notes: 'Used in dishwasher gas calculations'
  });
  factorCount++;

  await upsertFactor({
    name: 'Ocean Transport Emission Factor',
    description: 'GHG emissions for standard ocean shipment (19,270 nautical miles)',
    currentValue: TRANSPORTATION_CO2_EMISSIONS_FACTOR,
    unit: 'MTCO₂e/lb',
    categoryId: transportCat.id,
    sourceId: epaWarm.id,
    region: 'Global',
    calculatorConstantKey: 'TRANSPORTATION_CO2_EMISSIONS_FACTOR',
    notes: 'Waterborne craft factor × 19,270 nautical miles standard shipment distance'
  });
  factorCount++;

  // ── Single-use material emission + water factors ──────────────────────────
  for (const mat of MATERIALS) {
    await upsertFactor({
      name: `${mat.name} — Emission Factor`,
      description: `GHG emission factor for single-use ${mat.name} disposal`,
      currentValue: mat.mtco2ePerLb,
      unit: 'MTCO₂e/lb',
      categoryId: emissionCat.id,
      sourceId: epaWarm.id,
      region: 'US',
      calculatorConstantKey: `MATERIALS[${mat.id}].mtco2ePerLb`,
      notes: 'Source: EPA WARM Model Assumptions, !$B$4:$D$15'
    });
    factorCount++;

    if (mat.waterUsageGalPerLb != null) {
      await upsertFactor({
        name: `${mat.name} — Water Usage`,
        description: `Annual water usage per lb for single-use ${mat.name}`,
        currentValue: mat.waterUsageGalPerLb,
        unit: 'gal/lb',
        categoryId: materialCat.id,
        sourceId: epaWarm.id,
        region: 'US',
        calculatorConstantKey: `MATERIALS[${mat.id}].waterUsageGalPerLb`,
        notes: 'Source: EPA WARM Model'
      });
      factorCount++;
    }
  }

  // ── Reusable material emission + water factors ────────────────────────────
  for (const mat of REUSABLE_MATERIALS) {
    await upsertFactor({
      name: `${mat.name} (Reusable) — Emission Factor`,
      description: `GHG emission factor for reusable ${mat.name} production`,
      currentValue: mat.mtco2ePerLb,
      unit: 'MTCO₂e/lb',
      categoryId: emissionCat.id,
      sourceId: epaWarm.id,
      region: 'US',
      calculatorConstantKey: `REUSABLE_MATERIALS[${mat.id}].mtco2ePerLb`,
      notes: 'Source: EPA WARM Model'
    });
    factorCount++;

    await upsertFactor({
      name: `${mat.name} (Reusable) — Water Usage`,
      description: `Annual water usage per lb for reusable ${mat.name}`,
      currentValue: mat.waterUsageGalPerLb,
      unit: 'gal/lb',
      categoryId: materialCat.id,
      sourceId: epaWarm.id,
      region: 'US',
      calculatorConstantKey: `REUSABLE_MATERIALS[${mat.id}].waterUsageGalPerLb`,
      notes: 'Source: EPA WARM Model'
    });
    factorCount++;
  }

  // ── State utility rates ───────────────────────────────────────────────────
  for (const state of STATES) {
    await upsertFactor({
      name: `${state.name} — Commercial Electric Rate`,
      description: `Commercial electricity rate for ${state.name}`,
      currentValue: state.electric,
      unit: '$/kWh',
      categoryId: utilityCat.id,
      sourceId: doeEia.id,
      region: state.name,
      calculatorConstantKey: `STATES[${state.name}].electric`,
      notes: 'DOE EIA commercial electric rates'
    });
    factorCount++;

    await upsertFactor({
      name: `${state.name} — Commercial Gas Rate`,
      description: `Commercial natural gas rate for ${state.name}`,
      currentValue: state.gas,
      unit: '$/therm',
      categoryId: utilityCat.id,
      sourceId: doeEia.id,
      region: state.name,
      calculatorConstantKey: `STATES[${state.name}].gas`,
      notes: 'DOE EIA commercial natural gas rates'
    });
    factorCount++;
  }

  console.log(`✅ Created/updated ${factorCount} factors across ${5} categories and ${3} sources`);
}

async function upsertFactor(data: {
  name: string;
  description?: string;
  currentValue: number;
  unit: string;
  categoryId: string;
  sourceId: string;
  region?: string;
  calculatorConstantKey?: string;
  notes?: string;
}) {
  await prisma.factor.upsert({
    where: { name_categoryId: { name: data.name, categoryId: data.categoryId } } as any,
    update: {
      currentValue: data.currentValue,
      unit: data.unit,
      calculatorConstantKey: data.calculatorConstantKey ?? null,
      notes: data.notes ?? null
    },
    create: {
      ...data,
      createdBy: SYSTEM_USER_ID,
      isActive: true
    }
  });
}

async function main() {
  try {
    await seedFactorLibrary();
    console.log('🎉 Factor library seeding complete!');
  } catch (error) {
    console.error('❌ Error seeding factor library:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
