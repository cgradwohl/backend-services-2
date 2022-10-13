export default function assertIsNumber(num: number): asserts num is number {
  if (isNaN(num)) {
    throw new TypeError(`${num} is NaN`);
  }
}
