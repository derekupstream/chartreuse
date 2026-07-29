/**
 * Calculation trace for single-use line items — shows every input, factor, formula and
 * intermediate value Chart-Reuse uses to produce mass / GHG / water, so the methodology
 * can be reviewed against source spreadsheets without reading TypeScript.
 *
 * Defaults to the three items from Madhavi's new-cr-test.xlsx (2026-07-21).
 *
 * Usage: npx tsx scripts/trace-single-use-calc.ts
 *        npx tsx scripts/trace-single-use-calc.ts 12:400:1000 9:100:1000    (id:unitsPerCase:cases)
 */
import { getSingleUseProducts } from '../lib/inventory/getSingleUseProducts';
import { MATERIAL_MAP, CORRUGATED_CARDBOARD_GAS, CORRUGATED_CARDBOARD_NAME } from '../lib/calculator/constants/materials';
import { TRANSPORTATION_CO2_EMISSIONS_FACTOR } from '../lib/calculator/constants/carbon-dioxide-emissions';
import { getAnnualOccurrence } from '../lib/calculator/constants/frequency';

const UPSTREAM_ORG_ID = '79cb54a3-8b75-4841-93d4-a23fd1c07553';
const DEFAULT_ROWS = ['12:400:1000', '9:100:1000', '115:100:1000'];

const n = (v: number, d = 4) => v.toLocaleString(undefined, { maximumFractionDigits: d });

async function main() {
  const specs = (process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_ROWS).map(s => {
    const [productId, unitsPerCase, casesPurchased] = s.split(':');
    return { productId, unitsPerCase: Number(unitsPerCase), casesPurchased: Number(casesPurchased) };
  });

  const products = await getSingleUseProducts({ orgId: UPSTREAM_ORG_ID });
  const cardboardWater = MATERIAL_MAP[1]?.waterUsageGalPerLb ?? 0;

  console.log('='.repeat(96));
  console.log('CHART-REUSE SINGLE-USE CALCULATION TRACE   (frequency: Annually, baseline only)');
  console.log('='.repeat(96));
  console.log(`\nShared factors:`);
  console.log(`  ${CORRUGATED_CARDBOARD_NAME}: GHG ${CORRUGATED_CARDBOARD_GAS} MTCO2e/lb, water ${cardboardWater} gal/lb`);
  console.log(
    `  Ocean freight: ${TRANSPORTATION_CO2_EMISSIONS_FACTOR} MTCO2e/lb  (0.000000021 MTCO2e/nautical-mile x 19,270 nm)`
  );
  console.log(`     ^ applied TWICE: once to product mass (primary + secondary), once to box mass.`);
  console.log(`       Source spreadsheets carry no freight term for single-use — see docs/DATA-REVIEW-AGENDA.md 3c`);

  let totMass = 0,
    totGhg = 0,
    totWater = 0;

  for (const spec of specs) {
    const p = products.find(x => x.id === spec.productId);
    if (!p) {
      console.log(`\n!! product ${spec.productId} not found`);
      continue;
    }
    const occ = getAnnualOccurrence('Annually');
    const items = spec.casesPurchased * spec.unitsPerCase * occ;
    const primMat = MATERIAL_MAP[p.primaryMaterial];
    const secMat = p.secondaryMaterial != null ? MATERIAL_MAP[p.secondaryMaterial] : undefined;

    console.log('\n' + '-'.repeat(96));
    console.log(`PRODUCT ${p.id} — ${p.description.trim()}`);
    console.log('-'.repeat(96));
    console.log(`INPUTS (what the user typed)`);
    console.log(`  cases purchased          ${n(spec.casesPurchased)}`);
    console.log(`  units per case           ${n(spec.unitsPerCase)}`);
    console.log(`  annual items             = cases x units/case x ${occ} = ${n(items)}`);
    console.log(`\nCATALOG DATA (assets/upstream/single-use-products-data.csv)`);
    console.log(`  primary material         ${primMat?.name} (id ${p.primaryMaterial})`);
    console.log(`  primary lb/item          ${p.primaryMaterialWeightPerUnit}`);
    if (secMat) {
      console.log(`  secondary material       ${secMat.name} (id ${p.secondaryMaterial})`);
      console.log(`  secondary lb/item        ${p.secondaryMaterialWeightPerUnit}`);
    }
    console.log(`  item weight (total)      ${p.itemWeight}`);
    console.log(`  box lb/CASE  (used)      ${n(p.boxWeight, 6)}   <- gross case wt x box %`);
    console.log(`  box lb/ITEM  (unused)    ${n(p.boxWeightPerItem ?? 0, 6)}   <- catalog column, only the event path uses it`);
    console.log(`\nFACTORS (lib/calculator/constants/materials.ts)`);
    console.log(`  ${primMat?.name}: GHG ${primMat?.mtco2ePerLb} MTCO2e/lb | water ${primMat?.waterUsageGalPerLb} gal/lb`);
    if (secMat) console.log(`  ${secMat.name}: GHG ${secMat.mtco2ePerLb} MTCO2e/lb | water ${secMat.waterUsageGalPerLb} gal/lb`);

    // ---- mass
    const primaryMass = p.primaryMaterialWeightPerUnit * items;
    const secondaryMass = (p.secondaryMaterialWeightPerUnit || 0) * items;
    const boxMass = p.boxWeight * spec.casesPurchased * occ;
    const itemWeightMass = p.itemWeight * items;
    console.log(`\nMASS`);
    console.log(`  primary       = ${p.primaryMaterialWeightPerUnit} x ${n(items)} = ${n(primaryMass, 1)} lb`);
    if (secMat) console.log(`  secondary     = ${p.secondaryMaterialWeightPerUnit} x ${n(items)} = ${n(secondaryMass, 1)} lb`);
    console.log(`  shipping box  = ${n(p.boxWeight, 6)} x ${n(spec.casesPurchased)} cases = ${n(boxMass, 1)} lb`);
    console.log(`      NOTE: units-per-case is NOT in this formula (agenda 3b).`);
    console.log(`      per-item alternative: ${n(p.boxWeightPerItem ?? 0, 6)} x ${n(items)} = ${n((p.boxWeightPerItem ?? 0) * items, 1)} lb`);
    console.log(`  waste chart uses itemWeight x items = ${p.itemWeight} x ${n(items)} = ${n(itemWeightMass, 1)} lb`);
    console.log(`  TOTAL (itemWeight + box) = ${n(itemWeightMass + boxMass, 1)} lb`);

    // ---- ghg
    const primaryGhg = primaryMass * (primMat?.mtco2ePerLb ?? 0);
    const primaryFreight = primaryMass * TRANSPORTATION_CO2_EMISSIONS_FACTOR;
    const secondaryGhg = secondaryMass * (secMat?.mtco2ePerLb ?? 0);
    const secondaryFreight = secondaryMass * TRANSPORTATION_CO2_EMISSIONS_FACTOR;
    const boxGhgCard = boxMass * CORRUGATED_CARDBOARD_GAS;
    const boxGhgFreight = boxMass * TRANSPORTATION_CO2_EMISSIONS_FACTOR;
    const ghgTotal = primaryGhg + primaryFreight + secondaryGhg + secondaryFreight + boxGhgCard + boxGhgFreight;
    console.log(`\nGHG (MTCO2e)   [calculateMaterialGas() + shippingBoxGas]`);
    console.log(`  primary material  = ${n(primaryMass, 1)} lb x ${primMat?.mtco2ePerLb} = ${n(primaryGhg, 4)}`);
    console.log(`  primary freight   = ${n(primaryMass, 1)} lb x ${TRANSPORTATION_CO2_EMISSIONS_FACTOR} = ${n(primaryFreight, 4)}`);
    if (secMat) {
      console.log(`  secondary material= ${n(secondaryMass, 1)} lb x ${secMat.mtco2ePerLb} = ${n(secondaryGhg, 4)}`);
      console.log(`  secondary freight = ${n(secondaryMass, 1)} lb x ${TRANSPORTATION_CO2_EMISSIONS_FACTOR} = ${n(secondaryFreight, 4)}`);
    }
    console.log(`  box cardboard     = ${n(boxMass, 1)} lb x ${CORRUGATED_CARDBOARD_GAS} = ${n(boxGhgCard, 4)}`);
    console.log(`  box freight       = ${n(boxMass, 1)} lb x ${TRANSPORTATION_CO2_EMISSIONS_FACTOR} = ${n(boxGhgFreight, 4)}`);
    console.log(`  TOTAL = ${n(ghgTotal, 4)}`);

    // ---- water
    const primaryWater = primaryMass * (primMat?.waterUsageGalPerLb ?? 0);
    const secondaryWater = secondaryMass * (secMat?.waterUsageGalPerLb ?? 0);
    const boxWater = boxMass * cardboardWater;
    console.log(`\nWATER (gal)`);
    console.log(`  primary       = ${n(primaryMass, 1)} lb x ${primMat?.waterUsageGalPerLb} = ${n(primaryWater, 0)}`);
    if (secMat) console.log(`  secondary     = ${n(secondaryMass, 1)} lb x ${secMat.waterUsageGalPerLb} = ${n(secondaryWater, 0)}`);
    console.log(`  box cardboard = ${n(boxMass, 1)} lb x ${cardboardWater} = ${n(boxWater, 0)}`);
    console.log(`  TOTAL = ${n(primaryWater + secondaryWater + boxWater, 0)}`);

    totMass += itemWeightMass + boxMass;
    totGhg += ghgTotal;
    totWater += primaryWater + secondaryWater + boxWater;
  }

  console.log('\n' + '='.repeat(96));
  console.log(`PROJECT TOTALS   mass ${n(totMass, 1)} lb | GHG ${n(totGhg, 4)} MTCO2e | water ${n(totWater, 0)} gal`);
  console.log('='.repeat(96));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
