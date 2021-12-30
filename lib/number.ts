export function changeValue(number: number, { preUnit = '' }: { preUnit?: string } = {}) {
  const isPositive = number > 0
  return `${isPositive ? '' : number < 0 ? '-' : ''} ${preUnit}${Math.abs(number).toLocaleString()}`
}
