import isValid from "date-fns/isValid";
import parseISO from "date-fns/parseISO";
import { Exception } from "handlebars";

/**
 * usage: {{swu_iso8601_to_time "2020-06-24T19:17:47.010Z")}}
 *
 * should:
 *   - parse an ISO date string and return the time value
 *   - throw if it encounters an Invalid Date
 */
function helper(value: string) {
  const date = parseISO(value);

  if (!isValid(date)) {
    throw new Exception(
      "swu_iso8601_to_time expects ISO-8601 formatted string"
    );
  }

  return date.getTime();
}

export default helper;
