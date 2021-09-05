
/**
 *
 * The following tests are based on data provided as part of the spreadsheet model from Upstream
 */

import { getProjectInput } from './calculator.spreadsheet.data';
import { getAnnualSummary } from './outputs/annual-summary';
import { getEnvironmentalResults } from './outputs/environmental-results';
import { getFinancialResults } from './outputs/financial-results';
import { getSingleUseProductResults } from './outputs/single-use-product-results';
import { ProjectInput } from './types/projects';

describe('Predictions Calculator: Spreadsheet data', () => {

  let project: ProjectInput;

  beforeAll(async () => {
    project = await getProjectInput();
  });

  it('calculates Annual Summary', () => {
    const results = getAnnualSummary(project);
    console.log(results);
  });

  it('calculates Environmental Results', () => {
    const results = getEnvironmentalResults(project);
    console.log(results);
  });

  it('calculates Financial Results', () => {
    const results = getFinancialResults(project);
    console.log(results);
  });

  it('calculates Single Use Product Results', () => {
    const results = getSingleUseProductResults(project);
    console.log(results);
  });

});
