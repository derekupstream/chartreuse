import { QuestionCircleOutlined } from '@ant-design/icons';
import { Collapse, Typography } from 'antd';

const { Paragraph, Text } = Typography;

type HowToContent = {
  title: string;
  purpose: string;
  whenToUse: string;
  steps: string[];
  notThis?: string;
};

/**
 * Plain-language help for each Data Science tool: what it's for, when to reach for it,
 * how to use it, and — where tools look similar — what it is NOT for.
 */
export const HOW_TO: Record<string, HowToContent> = {
  overview: {
    title: 'Data Science overview',
    purpose:
      'The landing page for the data-science tools. It shows current data-health counts and links out to each tool.',
    whenToUse: 'Start here if you are not sure which tool you need.',
    steps: [
      'Check the health numbers at the top for anything alarming.',
      'Use the section cards to jump to the tool you need.'
    ]
  },
  inputs: {
    title: 'Data Inputs',
    purpose:
      'Scans real projects for broken or implausible inputs — a project with no state selected, no line items, a units-per-case of zero, or a repurchase rate above 100%.',
    whenToUse:
      'When someone reports odd results, check here first. Bad inputs explain more strange numbers than bad math does.',
    steps: [
      'Run a scan to refresh the list.',
      'Work down the issues; each one links to the project it came from.',
      'Fix the project data, then re-scan to confirm the issue clears.'
    ],
    notThis: 'This checks the data going in, not whether the calculations are right. For that, use Test Runs.'
  },
  'data-map': {
    title: 'Data Map',
    purpose:
      'A visual map of how data moves through the system: projects and API submissions on the left, line items and factors in the middle, calculation runs and results on the right.',
    whenToUse:
      'For orientation — understanding or explaining how the pieces connect, or seeing which parts of the pipeline have health issues.',
    steps: [
      'Pick a mode: System for the whole architecture, RSP API for partner data submissions, or Actuals/Projections to follow one project.',
      'Click any node to open its details panel.',
      'Click a node to dim everything not connected to it, so you can follow one path.'
    ],
    notThis:
      'It shows structure, not arithmetic. To see the numbers behind one project, open that project and choose View as Datasheet.'
  },
  databases: {
    title: 'Databases',
    purpose:
      'Reference tables kept whole, in their own column structure — the product catalogs, material emission and water factors, utility rates. A Factor holds one number; a Database holds an entire table the way it is organised outside the app.',
    whenToUse:
      'When you want to load or review a whole dataset rather than a single value — for example the single-use product table with its materials and masses, or a new emission-factor set.',
    steps: [
      'Click "Upload a database" and drop in a CSV. The first row becomes the column headers and the columns keep their names and order.',
      'Name it, say where it came from, and pick which column identifies a row.',
      'Open any database to browse and search it, or download it back out as CSV.',
      "Uploading a file with an existing database name offers to replace that table's rows."
    ],
    notThis:
      'These tables are for review and record-keeping right now — the calculator still reads its values from code. Wiring the two together is the next step, and is why the source and key column are worth filling in.'
  },
  factors: {
    title: 'Factors',
    purpose:
      'The library of every assumption the calculator uses — emission factors, material weights, utility rates — with its value, unit, source and version history.',
    whenToUse: 'When you need to look up what value we use for something, or change one.',
    steps: [
      'Search or filter to find the factor.',
      'Open it to see its current value, its source, and every past version.',
      'Edit to create a new version; the old value is kept for the record.'
    ],
    notThis:
      'Editing a factor here does not yet change project results — most calculators still read values compiled into the code. Connecting the two is planned work.'
  },
  calculations: {
    title: 'Calculations',
    purpose:
      'A list of every calculation function in the engine, with its actual source code viewable and editable in the browser.',
    whenToUse: 'When you want to read the real formula rather than a description of it.',
    steps: [
      'Find the function by name or output metric.',
      'Open it to read the source.',
      'Use the traceability badge to see whether it is mapped to factors in the library.'
    ],
    notThis:
      'This shows the code but never runs it. To see a formula applied to real numbers, use View as Datasheet on a project.'
  },
  'data-products': {
    title: 'Data Products',
    purpose:
      'A visual builder for new calculators and dashboards, made of variables you define rather than code an engineer writes. Inputs, constants and calculations become nodes, and results update live as you change test inputs.',
    whenToUse:
      'When you want to design or prototype a new model — a schools calculator, for example — without waiting on engineering.',
    steps: [
      'Create a data product, then add variables: user inputs, constants (which can pull from the Factor library), and calculations.',
      'Build each calculation by picking variables and operators; arrows between nodes are drawn automatically from what you reference.',
      'Change the test inputs on the canvas and watch every downstream value recompute.'
    ]
  },
  'test-runs': {
    title: 'Test Runs & Golden Datasets',
    purpose:
      'Regression testing for the calculator. A golden dataset is a set of inputs plus the answers you expect; a test run puts those inputs through the real engine and reports where the result differs.',
    whenToUse:
      'Whenever you want proof the math is right — after changing a factor or a formula, and any time you find a discrepancy worth guarding against forever.',
    steps: [
      'Create a golden dataset from a project or a reviewed spreadsheet, with the expected values.',
      'Run the tests. Each metric shows expected, actual, and the percentage difference.',
      'Investigate every failure, then either fix the code or correct the expected value — and record why.'
    ],
    notThis: 'It tells you that a number is wrong, not why. For the why, use View as Datasheet on the project.'
  },
  methodology: {
    title: 'Methodology',
    purpose: 'The published methodology documents customers and funders read.',
    whenToUse: 'When the documented method needs to change, usually after a factor or formula decision.',
    steps: ['Open or create a document.', 'Edit the content and sections.', 'Publish when it is ready to be public.']
  },
  'change-requests': {
    title: 'Change Requests',
    purpose:
      'A review queue for proposed factor changes, so no assumption changes without a second pair of eyes and a recorded reason.',
    whenToUse: 'When proposing a change to a factor, or reviewing someone else’s proposal.',
    steps: [
      'Open a request to see the current value, the proposed value, and the stated rationale.',
      'Approve to apply it as a new factor version, or decline with a reason.'
    ]
  },
  import: {
    title: 'AI Data Uploader',
    purpose:
      'Bulk-imports spreadsheets. It reads your file, works out which column is which, shows you its interpretation, and creates the records once you confirm.',
    whenToUse: 'When adding many line items or records at once instead of typing them in.',
    steps: [
      'Upload the file and pick what kind of data it holds.',
      'Review the column mapping carefully — this is where mistakes get baked in.',
      'Apply the import, then spot-check a few records against the source file.'
    ]
  },
  lineage: {
    title: 'Lineage',
    purpose:
      'Maps each factor in the library to the code constant it corresponds to, the calculation that consumes it, and the outputs it ultimately affects.',
    whenToUse: 'To answer "if I change this factor, what does it touch?"',
    steps: ['Find the factor.', 'Read across to see its constant, its calculation, and the metrics it feeds.'],
    notThis:
      'The mapping is maintained by hand and covers only some factors. Treat gaps as unknown rather than as "affects nothing".'
  },
  snapshots: {
    title: 'Methodology Snapshots',
    purpose:
      'Pins a specific set of factor versions together and publishes them as a named methodology version, so a calculation done today can be reproduced later.',
    whenToUse: 'When finalising a methodology for a reporting period, a publication, or a funder deliverable.',
    steps: [
      'Create a snapshot and select the factor versions it should pin.',
      'Describe what changed and why.',
      'Publish it. Calculation runs then record which snapshot they used.'
    ]
  },
  runs: {
    title: 'Run History',
    purpose:
      'A log of calculations the system has performed — projections, scenarios, partner data ingests — with when they ran, whether they succeeded, and which methodology snapshot applied.',
    whenToUse: 'To answer "what ran, when, and against which assumptions", or to investigate a failure.',
    steps: ['Find the run by date or type.', 'Open it to see its inputs, its resulting metrics, and any error.'],
    notThis:
      'These are calculations the app performed. Test Runs, despite the similar name, are regression tests you trigger deliberately.'
  },
  impact: {
    title: 'Impact Simulator',
    purpose:
      'Intended to answer "if I changed this factor, how much would results move?" — but it does not currently recompute anything. It applies your percentage change to each affected metric and reports that same percentage back.',
    whenToUse:
      'Not yet. Treat its output as a placeholder. For a real answer, change the value in a golden dataset and run the tests, which uses the actual engine.',
    steps: ['Pending rebuild on the real calculator engine.']
  }
};

export function HowTo({ tool }: { tool: keyof typeof HOW_TO }) {
  const content = HOW_TO[tool];
  if (!content) return null;

  return (
    <Collapse
      ghost
      style={{ marginBottom: 16, background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 8 }}
      items={[
        {
          key: 'how-to',
          label: (
            <Text strong>
              <QuestionCircleOutlined style={{ marginRight: 8 }} />
              What is {content.title} for?
            </Text>
          ),
          children: (
            <div style={{ maxWidth: 820 }}>
              <Paragraph style={{ marginBottom: 12 }}>{content.purpose}</Paragraph>
              <Paragraph style={{ marginBottom: 12 }}>
                <Text strong>When to use it: </Text>
                {content.whenToUse}
              </Paragraph>
              <Text strong>How to use it</Text>
              <ol style={{ marginTop: 6, marginBottom: content.notThis ? 12 : 0, paddingLeft: 20 }}>
                {content.steps.map(step => (
                  <li key={step} style={{ marginBottom: 4 }}>
                    {step}
                  </li>
                ))}
              </ol>
              {content.notThis && (
                <Paragraph type='secondary' style={{ marginBottom: 0 }}>
                  <Text strong type='secondary'>
                    Not this tool:{' '}
                  </Text>
                  {content.notThis}
                </Paragraph>
              )}
            </div>
          )
        }
      ]}
    />
  );
}
