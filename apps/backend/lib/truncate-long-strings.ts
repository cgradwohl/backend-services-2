import sizeof from "object-sizeof";

/** @deprecated use "~/lib/truncate-long-strings-v2.ts" */
const truncateLargeStrings = (obj: {
  [key: string]: any;
}): { [key: string]: any } => {
  return Object.keys(obj ?? {}).reduce((acc, k) => {
    if (obj[k] instanceof Object && obj.hasOwnProperty(k)) {
      const val = truncateLargeStrings(obj[k]);
      // If the original value was an Array, grab the values off the object
      // to reconstruct it
      acc[k] = Array.isArray(obj[k]) ? Object.values(val) : val;
    } else {
      const size = sizeof(obj[k]);
      // Shrink any string values over 100 KB in size
      if (size >= 1024 * 100 && typeof obj[k] === "string") {
        acc[k] = `[Truncated] ${obj[k].slice(0, 100)}...`;
      } else {
        acc[k] = obj[k];
      }
    }

    return acc;
  }, {});
};

export default truncateLargeStrings;
