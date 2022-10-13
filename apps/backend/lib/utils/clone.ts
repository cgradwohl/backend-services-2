import { deserialize, serialize } from "v8";

/** Performs a deep clone on the supplied type */
export const clone = <T>(item: T): T => deserialize(serialize(item));
