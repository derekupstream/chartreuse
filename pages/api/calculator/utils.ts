// round a number to a given precision
export function round(int: number, decimals = 0): number {
  const digits = Math.pow(10, decimals);
  return Math.round(int * digits) / digits;
}
