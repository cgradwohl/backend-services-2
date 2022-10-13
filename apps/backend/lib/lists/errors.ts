import makeError from "make-error";

export const InvalidListSearchPatternError = makeError(
  "InvalidListSearchPatternError"
);
export const ListItemAlreadyExistsError = makeError("ListAlreadyExistsError");
export const ListItemNotFoundError = makeError("ListItemNotFoundError");
export const ListItemArchivedError = makeError("ListItemArchivedError");
export const MalformedListIdError = makeError("MalformedListIdError");
