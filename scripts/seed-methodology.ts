/**
 * Seed script: populates MethodologyDocument table with content from
 * Chart-Reuse Methodology Version 2.0 (chart-reuse.eco/methodology).
 *
 * Run with: npx tsx scripts/seed-methodology.ts
 * Re-run safely: upserts by slug.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function p(text: string) {
  return { type: 'paragraph', content: [{ type: 'text', text }] };
}

function bold(text: string) {
  return { type: 'text', text, marks: [{ type: 'bold' }] };
}

function heading(level: number, text: string) {
  return { type: 'heading', attrs: { level }, content: [{ type: 'text', text }] };
}

function bulletList(items: string[]) {
  return {
    type: 'bulletList',
    content: items.map(item => ({
      type: 'listItem',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: item }] }]
    }))
  };
}

function mixedParagraph(...parts: Array<{ type: 'text'; text: string; marks?: any[] }>) {
  return { type: 'paragraph', content: parts };
}

const sections = [
  {
    sectionNumber: '1',
    title: 'Introduction',
    slug: 'introduction',
    content: {
      type: 'doc',
      content: [
        p('Chart-Reuse Methodology Version 2.0 provides reasonable estimates of environmental impacts when transitioning from single-use to reusable foodware in foodservice operations.'),
        p('The tool combines publicly available environmental data, industry feedback, and practical assumptions to measure five core metrics:'),
        bulletList([
          'Greenhouse gas (GHG) emissions avoided',
          'Waste diverted (lbs)',
          'Single-use units reduced',
          'Water use savings (gallons)',
          'Cost savings and financial ROI'
        ]),
        p('This methodology is designed for directional estimates supporting operational decision-making, rather than ISO 14040/14044 certified lifecycle assessments.'),
        mixedParagraph(
          bold('Citation: '),
          { type: 'text', text: '"Chart-Reuse Methodology Version 2.0. Upstream. 2025."' }
        )
      ]
    }
  },
  {
    sectionNumber: '1.1',
    title: 'Annual Greenhouse Gas (GHG) Emissions',
    slug: 'ghg-emissions',
    content: {
      type: 'doc',
      content: [
        p('GHG emissions are calculated by comparing cradle-to-grave lifecycle emissions between single-use and reusable foodware scenarios.'),
        heading(3, 'Key Components Measured'),
        bulletList([
          'Cradle-to-grave emissions from avoided single-use items',
          'Cradle-to-grave emissions from reusable item procurement and disposal',
          'Operational dishwashing energy use (electricity and hot water)'
        ]),
        heading(3, 'Data Sources'),
        bulletList([
          'EPA WARM v16 Source Reduction pathway for material-specific emission factors (raw material extraction, manufacturing, domestic transportation)',
          'International shipping emissions based on Shanghai-to-Los Angeles port routing',
          'Dishwashing energy factors derived from U.S. EPA/DOE CFS Equipment Calculator',
          'Consultation with Oak Ridge National Laboratory (2024 Re-X Before Recycling Prize)'
        ]),
        heading(3, 'Single-Use Item Impacts'),
        p('EPA WARM provides domestic lifecycle modeling but does not account for international supply chains. The methodology supplements this with overseas transportation assumptions using standardized container shipping scenarios.'),
        heading(3, 'Reusable Item Impacts'),
        p('Includes material production, manufacturing, end-of-life disposal for annual inventory, standardized overseas transport, and calculated annual dishwashing GHG emissions (scaled by total racks required yearly).'),
        heading(3, '4-Step GHG Calculation Process'),
        p('See the interactive flowchart below for the complete calculation methodology.'),
        bulletList([
          'Step 1: Convert baseline single-use purchasing inputs to material weights (case weight split into product and cardboard components)',
          'Step 2: Convert forecasted reusable purchasing inputs to material weights (same process)',
          'Step 3: Calculate material weight differences (forecast minus baseline per material type)',
          'Step 4: Multiply weight differences by EPA WARM emission factors; sum across all materials for net annual GHG change'
        ])
      ]
    }
  },
  {
    sectionNumber: '1.2',
    title: 'Waste',
    slug: 'waste',
    content: {
      type: 'doc',
      content: [
        p('Measures the net annual change in total mass of foodware materials procured when transitioning from single-use to reusable scenarios.'),
        p('Uses a custom database of actual masses for commercially available foodware items covering various sizes and material types.'),
        p('Single-use products may appear in forecast scenarios reflecting reductions rather than complete eliminations. The methodology uses the same three-step weight conversion process as the GHG section (Steps 1-3), calculating total material mass reduction by comparing baseline and forecast scenarios.')
      ]
    }
  },
  {
    sectionNumber: '1.3',
    title: 'Single-Use Unit Reduction',
    slug: 'unit-reduction',
    content: {
      type: 'doc',
      content: [
        p('Represents the net annual decrease in total number of single-use foodware items procured.'),
        p('Calculated by multiplying units-per-case by annual cases purchased, then summing across all item types. The difference between baseline and forecast totals gives the annual unit reduction.')
      ]
    }
  },
  {
    sectionNumber: '1.4',
    title: 'Water',
    slug: 'water',
    content: {
      type: 'doc',
      content: [
        p('Water consumption factors (gallons per pound) are developed from a synthesis of published LCA studies and public datasets. Each factor reflects cradle-to-gate water use.'),
        heading(3, 'Water Use Factors by Material (gal/lb)'),
        heading(3, 'Single-Use Materials'),
        bulletList([
          'Paper: 10-13 gal/lb',
          'LDPE: 18-22 gal/lb',
          'PET: 15-19 gal/lb',
          'Polystyrene: 12-16 gal/lb',
          'Aluminum: 200-250 gal/lb'
        ]),
        heading(3, 'Reusable Materials'),
        bulletList([
          'Ceramic: 5-8 gal/lb',
          'Melamine: 8-12 gal/lb',
          'Polycarbonate: 12-16 gal/lb',
          'Stainless steel: 15-25 gal/lb'
        ]),
        p('Methodology notes accompany each factor explaining sources and system boundaries. The tool is designed for screening analysis, not ISO-compliant LCAs.')
      ]
    }
  },
  {
    sectionNumber: '1.5',
    title: 'Cost',
    slug: 'cost',
    content: {
      type: 'doc',
      content: [
        p('The cost methodology compares total operating costs between single-use and reusable scenarios, including optional capital and operating expenses.'),
        heading(3, 'Cost Components'),
        bulletList([
          'Procurement costs: User-input annual quantities and cost-per-case for baseline and forecast scenarios',
          'Capital/operating expenses: Dishwashing equipment, supplies, labor, waste hauling reductions',
          'Utility costs: State-specific commercial energy rates from U.S. Department of Energy, multiplied by estimated dishwashing electricity and water usage'
        ]),
        heading(3, 'Financial ROI Calculations'),
        mixedParagraph(
          bold('Annual Cost Savings ROI (% of Start-Up Cost): '),
          { type: 'text', text: '(Annual Single-Use Operating Costs - Annual Reuse Operating Costs) / Start-Up Cost. Expressed as percentage representing share of initial investment recovered annually.' }
        ),
        mixedParagraph(
          bold('Payback Period (Months): '),
          { type: 'text', text: '(Start-Up Cost / (Annual Single-Use Operating Costs - Annual Reuse Operating Costs)) x 12. Estimates months required for annual savings to equal initial investment.' }
        ),
        p('See the interactive Cost Calculation flowchart below for a visual breakdown of all cost components.')
      ]
    }
  },
  {
    sectionNumber: '1.6',
    title: 'Limitations',
    slug: 'limitations',
    content: {
      type: 'doc',
      content: [
        p('The methodology has several known limitations that users should be aware of:'),
        bulletList([
          'Transportation assumption: The tool assumes on-site reusable product washing; third-party provider washing (e.g., RSP service) is not currently modeled as a lifecycle variable',
          'Lacks regional variation accounting for energy mix, production technology, and waste handling differences across jurisdictions',
          'Designed for directional estimates supporting operational decision-making, not certified lifecycle assessments',
          'Does not model multi-year financial projections or account for inflation',
          'Plastic sleeve secondary packaging is excluded from calculations'
        ])
      ]
    }
  },
  {
    sectionNumber: 'A.1',
    title: 'Appendix: Single-Use Material Emission Factors',
    slug: 'appendix-single-use-factors',
    content: {
      type: 'doc',
      content: [
        p('EPA WARM v16 emission factors used for single-use material calculations:'),
        heading(3, 'Materials Covered'),
        bulletList([
          'Paper/Cardboard — kg CO₂e/lb from source reduction pathway',
          'LDPE (Low-Density Polyethylene) — used in cup linings, bags',
          'PET (Polyethylene Terephthalate) — clear containers, bottles',
          'Polystyrene — foam containers, cups',
          'Aluminum — foil containers, cups'
        ]),
        heading(3, 'WARM General Inputs'),
        bulletList([
          '70 miles to landfill (upper-range estimate)',
          'Assumes current mix of recycled material inputs for reusables',
          'International shipping: Shanghai to Port of Los Angeles standard container routing'
        ]),
        heading(3, 'EPA Energy Emission Factors'),
        bulletList([
          'Electricity: kg CO₂e/kWh (national average)',
          'Natural gas: kg CO₂e/therm (national average)'
        ])
      ]
    }
  },
  {
    sectionNumber: 'A.2',
    title: 'Appendix: Shipping Box & Lining Calculations',
    slug: 'appendix-box-lining',
    content: {
      type: 'doc',
      content: [
        p('Based on Merugula & Bakshi (2014) research on reusable vs. disposable comparisons:'),
        heading(3, 'Average Weight of Shipping Box as % of Gross Case Weight'),
        bulletList([
          'Paper/cardboard products: ~11-15%',
          'Plastic products: ~8-10%',
          'Metal products: ~6-8%'
        ]),
        heading(3, 'Average Weight of Cup Lining as % of Total Product Weight'),
        p('Applies to LDPE-lined paper cups and other multi-material products. The case weight is split into product and cardboard components, then the product weight is further split into primary and secondary materials where applicable.')
      ]
    }
  },
  {
    sectionNumber: 'A.3',
    title: 'Appendix: Data Sources',
    slug: 'appendix-data-sources',
    content: {
      type: 'doc',
      content: [
        p('The following data sources are used throughout the Chart-Reuse methodology:'),
        bulletList([
          'U.S. EPA WARM v16 tool (primary emissions database)',
          'U.S. EPA/DOE CFS Equipment Calculator (dishwashing energy estimates)',
          'U.S. Department of Energy Annual Energy Outlook and Electric Power Monthly',
          'American Water Works Association / Raftelis Financial Consultants (2010 rate survey)',
          'Oak Ridge National Laboratory (peer consultation)',
          'Merugula & Bakshi (2014) — academic research on reusable vs. disposable comparisons',
          'Custom database of commercially available foodware item weights and specifications'
        ])
      ]
    }
  }
];

async function main() {
  console.log('Seeding methodology content...\n');

  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    const existing = await prisma.methodologyDocument.findUnique({ where: { slug: s.slug } });

    if (existing) {
      await prisma.methodologyDocument.update({
        where: { slug: s.slug },
        data: {
          title: s.title,
          sectionNumber: s.sectionNumber,
          content: s.content as any,
          order: i,
          status: 'published',
          publishedAt: new Date()
        }
      });
      console.log(`  Updated: ${s.sectionNumber} ${s.title}`);
    } else {
      await prisma.methodologyDocument.create({
        data: {
          title: s.title,
          slug: s.slug,
          sectionNumber: s.sectionNumber,
          content: s.content as any,
          order: i,
          status: 'published',
          publishedAt: new Date()
        }
      });
      console.log(`  Created: ${s.sectionNumber} ${s.title}`);
    }
  }

  console.log(`\nDone! Seeded ${sections.length} methodology sections.`);
  console.log('View at: /methodology (public) or /admin/methodology (admin)');
}

main()
  .catch(e => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
