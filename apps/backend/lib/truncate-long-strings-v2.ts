import { JSON, JSONObject } from "~/types.api";

type TruncateOptions = {
  /** at what threshold trucation is triggered */
  truncateAtKiB?: number;
  /** how many characters to return if the string is truncated */
  truncateLength?: number;
};

/** Value representing one kibibyte */
const KiB = 1024;
const DEFAULT_TRUNCATE_AT_KiB = 100;
const DEFAULT_TRUNCATE_LENGTH = 100;
const MAXIMUM_ALLOWED_SIZE_IN_KiB = 1000;
const MAXIMUM_RETURNABLE_LENGTH = MAXIMUM_ALLOWED_SIZE_IN_KiB / 5;

const truncateString = (str: string, opts?: TruncateOptions) => {
  const truncateAtKiB = Math.min(
    opts?.truncateAtKiB ?? DEFAULT_TRUNCATE_AT_KiB,
    MAXIMUM_ALLOWED_SIZE_IN_KiB
  );
  const truncateLength = Math.min(
    opts?.truncateLength ?? DEFAULT_TRUNCATE_LENGTH,
    MAXIMUM_RETURNABLE_LENGTH
  );

  // calculate the size of the string in kibibytes
  const sizeInKiB = Buffer.byteLength(str) / KiB;
  return sizeInKiB >= truncateAtKiB
    ? `[Truncated] ${str.slice(0, truncateLength)}...`
    : str;
};

const truncateArray = (arr: JSON[], opts?: TruncateOptions) => {
  const truncated = [];
  for (const item of arr) {
    truncated.push(truncate(item, opts));
  }
  return truncated;
};

const truncateObject = (obj: JSONObject, opts?: TruncateOptions) => {
  const truncated = {};
  for (const key in obj) {
    truncated[key] = truncate(obj[key], opts);
  }
  return truncated;
};

const truncate = (input: JSON, opts?: TruncateOptions): JSON => {
  if (input === null || input === undefined) {
    return input;
  }

  if (Array.isArray(input)) {
    return truncateArray(input, opts);
  } else if (typeof input === "object") {
    return truncateObject(input, opts);
  } else if (typeof input === "string") {
    return truncateString(input, opts);
  }

  return input;
};

export default truncate;
