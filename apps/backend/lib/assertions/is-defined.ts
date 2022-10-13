import { AssertionError } from "assert";

export default function assertIsDefined<T>(
  value: T,
  name?: string
): asserts value is NonNullable<T> {
  if (value === undefined || value === null) {
    const message = name
      ? `Expected ${name} to be defined`
      : "Expected value to be defined";
    throw new AssertionError({ message });
  }
}
