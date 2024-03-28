export const isTruthy = <T>(t: T | false | undefined | null | void): t is T => Boolean(t);
