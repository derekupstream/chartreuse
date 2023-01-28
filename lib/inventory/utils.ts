export function csvToNumber(value: string = ''): number {
  value = value.replace(/[^0-9.]/g, '').trim()
  return value ? parseFloat(value) : 0
}
