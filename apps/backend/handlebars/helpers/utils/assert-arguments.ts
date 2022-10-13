import { Exception } from "handlebars";

/**
 * Helper that moves options to the first argument (so you can use the
 * spread operator when destructuring), assigns types, and validates the
 * existence of the required props.
 *
 * For each argName, an argument must be present or we throw an exception.
 * So, a call with `assertHandlebarsArguments(args, "a", "b")` requires two
 * props (a and b) to exist in args. If args.length() is less than 3 (two
 * arguments + options), it will throw an exception that lists the missing
 * required props.
 */
const assertHandlebarsArguments = <T extends ReadonlyArray<any>>(
  args: any[],
  ...argNames: string[]
): T => {
  const argsCopy = [...args];
  const missing = argNames.slice(argsCopy.length);
  const options = argsCopy.pop();

  if (missing.length) {
    throw new Exception(
      `#${(options as any).name} requires ${missing.join(", ")}`
    );
  }

  // moving options to the first argument so we can use the spread operator
  // when destructuring.
  return ([options, ...argsCopy] as unknown) as T;
};

export default assertHandlebarsArguments;
