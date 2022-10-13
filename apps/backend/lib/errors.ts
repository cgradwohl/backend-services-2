import makeError, { BaseError } from "make-error";

export const PreparationError = makeError("PreparationError");
export const RoutingError = makeError("RoutingError");
export const InvalidSequenceTableNameError = makeError(
  "InvalidSequenceTableNameError"
);
export const PartialBatchProcessingError = makeError(
  "PartialBatchProcessingError"
);

export class InternalCourierError extends BaseError {
  public static isInternalCourierError = (
    err: Error | InternalCourierError
  ) => {
    return (
      err instanceof InternalCourierError ||
      err.toString() === "Internal Courier Error"
    );
  };
}
