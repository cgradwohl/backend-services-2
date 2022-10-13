import fromUnixTime from "date-fns/fromUnixTime";
import isValid from "date-fns/isValid";
import { Exception } from "handlebars";

/**
 * usage: {{swu_timestamp_to_time "2020-06-24T19:17:47.010Z")}}
 *
 * should:
 *   - parse a Unix epoch timestamp and return the time value
 *   - throw if it encounters an Invalid Date
 */
function helper(timestamp: number) {
  if (!Number.isInteger(timestamp)) {
    throw new Exception(
      "swu_timestamp_to_time expects a valid UNIX epoch timestamp"
    );
  }

  const date = fromUnixTime(timestamp);

  if (!isValid(date)) {
    throw new Exception(
      "swu_timestamp_to_time expects a valid UNIX epoch timestamp"
    );
  }

  return date.getTime();
}

export default helper;
