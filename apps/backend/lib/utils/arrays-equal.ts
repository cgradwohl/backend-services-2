/** Checks that each value of an array are equal. Does not perform deep comparison */
export const arraysEqual = <T, U extends Array<T>>(a: U, b: U) =>
  a.length === b.length && a.every((v, i) => v === b[i]);
