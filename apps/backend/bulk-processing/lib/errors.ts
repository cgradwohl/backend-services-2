import makeError from "make-error";

export const BulkJobDuplicateInvocationError = makeError(
  "BulkJobDuplicateInvocationError"
);
export const BulkJobAlreadySubmittedError = makeError(
  "BulkJobAlreadySubmittedError"
);
export const BulkJobScopeMismatchError = makeError("BulkJobScopeMismatchError");
export const BulkJobApiVersionMismatchError = makeError(
  "BulkJobApiVersionMismatchError"
);
