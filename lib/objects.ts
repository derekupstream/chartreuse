// a method to remove dates for Next.js
export function serializeJSON<T = any>(obj: T): T {
  return JSON.parse(JSON.stringify(obj, null, 2));
}
