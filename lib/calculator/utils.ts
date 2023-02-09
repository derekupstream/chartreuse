// round a number to a given precision
export function round(int: number, decimals = 0): number {
  const digits = Math.pow(10, decimals);
  return Math.round(int * digits) / digits;
}

// calculate the change in percent
export function calculatePercentChange(baseline: number, forecast: number) {
  return baseline === 0 ? 0 : round(((forecast - baseline) / baseline) * 100);
}

export interface ChangeSummary {
  baseline: number;
  forecast: number;
  change: number;
  changePercent: number;
}

export function getChangeSummaryRow(baseline: number, forecast: number): ChangeSummary {
  const change = forecast - baseline;
  const changePercent = calculatePercentChange(baseline, forecast);
  return { baseline, change, changePercent, forecast };
}

export function getChangeSummaryRowRounded(baseline: number, forecast: number, decimals = 0): ChangeSummary {
  const { change, changePercent } = getChangeSummaryRow(baseline, forecast);
  return {
    baseline: round(baseline, decimals),
    forecast: round(forecast, decimals),
    change: round(change, decimals),
    changePercent: round(changePercent, decimals)
  };
}

// minimumFractionDigits needs to be set or we get "RangeError: maximumFractionDigits value is out of range"
export const formatToDollar = (value: number) => removeNegativeZero(value).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0, minimumFractionDigits: 0 });

// sometimes 0 is displayed as -0, this removes the negative sign
function removeNegativeZero(value: number) {
  return value === 0 ? 0 : value;
}
