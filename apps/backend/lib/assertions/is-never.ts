/** Ensures exhaustive handling of discriminated union */
export function assertIsNever(_value: never, throwErr: string | Error): never {
  if (typeof throwErr === "string") {
    throw new Error(throwErr);
  }

  throw throwErr;
}
