import { HelperOptions } from "handlebars";

import assertIsNumber from "~/lib/assertions/is-number";
import assertHandlebarsArguments from "../../utils/assert-arguments";

/**
 * usage: {{ range 5 }} => [0,1,2,3,4]
 * usage: {{ range 1 5 }} => [1,2,3,4]
 * usage: {{ range 0 20 5 }} => [0,5,10,15]
 *
 * should:
 *   - generate a range of numbers given an end value
 *   - generate a range of numbers given a start and end value
 *   - generate a range of numbers given a start, end, and step value
 */

function range(start: number, end: number, step: number) {
  if (start === end || end === 0) {
    return [];
  }

  if (step > 0 && start >= end) {
    return [];
  }

  if (step < 0 && start <= end) {
    return [];
  }

  return [start, ...range(start + step, end, step)];
}

function rangeHandlebarsHelper(...args): number[] {
  const [options, ...params] = assertHandlebarsArguments<
    [HelperOptions, number?, number?, number?]
  >(args);

  let start: number = 0;
  let step: number = 1;
  let stop: number;

  switch (params.length) {
    case 0:
      throw new Error("range expects at least one input");

    case 1:
      stop = params[0];
      break;

    case 2:
      start = params[0];
      stop = params[1];
      break;

    default:
      start = params[0];
      stop = params[1];
      step = params[2];
      break;
  }

  assertIsNumber(start);
  assertIsNumber(stop);
  assertIsNumber(step);

  return range(start, stop, step);
}

export default rangeHandlebarsHelper;
