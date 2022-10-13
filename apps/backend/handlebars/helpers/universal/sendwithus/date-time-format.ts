import addMilliseconds from "date-fns/addMilliseconds";
import format from "date-fns/format";
import parseISO from "date-fns/parseISO";
import { Exception } from "handlebars";

const MS_MIN = 60000;
const MS_HOUR = MS_MIN * 60;

const mappings = {
  "%A": "eeee", // "Weekday as locale’s full name. Sunday, Monday,... Saturday"
  "%B": "MMMM", // "Month as locale’s full name. January, February, ... December"
  "%H": "HH", // "Hour (24-hour clock) as a zero-padded decimal number. 18, 23"
  "%I": "hh", // "Hour (12-hour clock) as a zero-padded decimal number. 06, 11"
  "%M": "mm", // "Minute as a zero-padded decimal number. 00, 01, ... 59"
  "%S": "ss", // "Second as a zero-padded decimal number. 00, 01, ... 59  "
  "%Y": "yyyy", // "Year with century as a decimal number. 1970, 1988, 2001, 2013"
  "%a": "eee", // "Weekday as locale’s abbreviated name. Sun, Mon, ... Sat"
  "%b": "MMM", // "Month as locale’s abbreviated name. Jan, Feb, ... Dec"
  "%d": "dd", // "Day of the month as a decimal number 01, 11, ... 31"
  "%m": "MM", // "Month as a decimal number. 01, 08, 12",
  "%y": "yy", // "Year without century as a zero-padded decimal number. 00, 01, ... 99"
};

// https://stackoverflow.com/questions/3143070/javascript-regex-iso-datetime
const isISOString = (isoString: string) => {
  // complete
  // /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+/
  // no milliseconds
  // /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d/
  // no seconds
  // /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d/

  return !!isoString.match(
    /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+)|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d)|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d)/
  );
};

/**
 * usage: {{swu_datetimeformat 1593031220882}}
 *
 * should:
 *   - parse an milliseconds since epoch number and return a value based on the provided format
 *   - throw if a number is not provided
 */
function helper(time: number | string, input: string) {
  const replaced = Object.keys(mappings).reduce(
    (acc, mapping) => acc.replace(mapping, mappings[mapping]),
    input
  );

  if (typeof time === "number") {
    if (!Number.isInteger(time)) {
      throw new Exception(
        "swu_datetimeformat expects milliseconds since epoch as an input"
      );
    }

    return format(time, replaced);
  }

  if (!isISOString(time)) {
    throw new Exception(
      "swu_datetimeformat expects string values to be ISO-8601 formatted"
    );
  }

  // when an iso8601 date time string is converted to a javascript object
  // the timezone information is effectively lost and it's converted to UTC.
  // upon formatting, the date then takes on the locale of the executing code.
  // the following code extracts any offsets from the ISO string along with the
  // executing runtime and reapplies them to the date object for formatting
  const match = time.match(/([\+-])(\d\d)(\d\d)/) ?? [];
  const tzOp = match[1] ?? "+";
  const tzHours = match[2] ? parseInt(match[2], 10) : 0;
  const tzMins = match[3] ? parseInt(match[3], 10) : 0;

  const localOffsetMs = new Date().getTimezoneOffset() * MS_MIN;
  const op = tzOp === "-" ? -1 : 1;
  // calculate total offset in ms from the provided ISO string
  // and multiple it by 1 or -1 in order to affect add/subtract
  const offsetMs = (tzHours * MS_HOUR + tzMins * MS_MIN) * op;
  // reapply local offset and tz offset
  const date = addMilliseconds(parseISO(time), localOffsetMs + offsetMs);

  return format(date, replaced);
}

export default helper;
