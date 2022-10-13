import { Exception, HelperOptions } from "handlebars";

import assertHandlebarsArguments from "../utils/assert-arguments";
import getHandlebarsData from "../utils/get-data";
import getHandlebarsVariableHandler from "../utils/get-variable-handler";

const reservedNames = [
  "",
  "__proto__", // https://medium.com/intrinsic/javascript-prototype-poisoning-vulnerabilities-in-the-wild-7bc15347c96
  "brand",
  "data",
  "event",
  "profile",
  "recipient",
  "urls",
];

/**
 * usage: {{set "name" (default first_name "valued customer")}}
 *
 * should:
 *   - set a value on the root data using the name
 *   - set the value on the root of the variable handler context
 *   - restrict top level names (ex: `data`, `profile`, `brand`)
 */
function setHandlebarsHelper(this: any, ...args: any[]) {
  const [options, name, value] = assertHandlebarsArguments<
    [HelperOptions, string, any]
  >(args, "variable name");

  if (typeof name !== "string") {
    throw new Exception("#set name must be a string");
  }

  if (reservedNames.includes(name)) {
    throw new Exception(
      `#set cannot use reserved word [${JSON.stringify(name)}]`
    );
  }

  const data = getHandlebarsData(options);
  const variableHandler = getHandlebarsVariableHandler(options);
  const variableHandlerContext = variableHandler.getContext().value;
  const variableHandlerRoot = variableHandler.getRootValue();

  // unset?
  if (value === undefined) {
    // remove from local context
    if (typeof this === "object") {
      delete this[name];
    }
    if (typeof variableHandlerContext === "object") {
      delete variableHandlerContext[name];
    }

    // remove from root context
    if (typeof data.root === "object") {
      delete data.root[name];
    }
    if (typeof variableHandlerRoot === "object") {
      delete variableHandlerRoot[name];
    }
  } else {
    // add to local context
    if (typeof this === "object") {
      this[name] = value;
    }
    if (typeof variableHandlerContext === "object") {
      variableHandlerContext[name] = value;
    }

    // add to root
    if (typeof data.root === "object") {
      data.root[name] = value;
    }
    if (typeof variableHandlerRoot === "object") {
      variableHandlerRoot[name] = value;
    }
  }
}

export default setHandlebarsHelper;
