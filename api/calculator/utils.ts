// round a number to a given precision
export function round(int: number, decimals = 0): number {
  const digits = Math.pow(10, decimals);
  return Math.round(int * digits) / digits;
}

// calculate the change in percent
function calculatePercentChange(baseline: number, followup: number) {
  return baseline === 0 ? 0 : round((followup - baseline) / baseline * 100);
}

export interface ChangeSummary {
  baseline: number;
  followup: number;
  change: number;
  changePercent: number;
}

export function getChangeSummaryRow (baseline: number, followup: number): ChangeSummary {
  const change = followup - baseline;
  const changePercent = calculatePercentChange(baseline, followup);
  return { baseline, change, changePercent, followup };
}
