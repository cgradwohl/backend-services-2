import { Utils } from "handlebars";
import jsonpath from "jsonpath";

import variablePattern from "~/lib/variable-pattern";

const isRootPath = /^\$(?:\.|\[)/; // begins with "$." or "$["
const isScopedPath = /^@(?:\.|\[)/; // begins with "@." or "@["

type JsonPathFn = "nodes" | "query";

interface IJsonPathNode {
  path: string[];
  value: any;
}

interface IGetValueFn {
  (
    scope: IScopedValue,
    path: string,
    count: number,
    returnPathValue: boolean
  ): any[];
  (
    scope: IScopedValue,
    path: string,
    count: number,
    returnPathValue: true
  ): IJsonPathNode[];
}

interface IResolveValueFn {
  (
    scope: IScopedValue,
    path: string,
    count: number | undefined,
    returnPathValue: true
  ): IJsonPathNode[];
  (
    scope: IScopedValue,
    path: string,
    count: number | undefined,
    returnPathValue?: false
  ): any[];
}

export interface IScopedValue {
  parent?: IScopedValue;
  value: any;
}

export interface IVariableHandler {
  getContext: () => IScopedValue;
  getParent: () => IVariableHandler;
  getRoot: () => IVariableHandler;
  getRootValue: () => IScopedValue["value"];
  getScoped: (field: string) => IVariableHandler;
  repeat: (path: string) => IVariableHandler[];
  replace: (str: string, encode?: boolean) => string;
  resolve: (path: string, defaultValue?: any) => any;
  resolveV2: (path: string, defaultValue?: any) => any; // will be deprecating resolve() after Handlebars is live
}

const createVariableHandler = (context: IScopedValue): IVariableHandler => {
  /** Return true if more than one item can be returned by the json path */
  const expectedMany = (path: string): boolean => {
    if (path === "$") {
      return false;
    }

    const components = jsonpath.parse(path);
    return components.some(({ expression }) => {
      return [
        "wildcard", // *
        "slice", // [-1:]
        "union", // [0,1]
        "filter_expression", // [?(@.isbn)]
      ].includes(expression.type);
    });
  };

  /**
   * Given an array of values, create linked list of parents.
   * @returns the last parent of the chain (not the root parent).
   */
  const generateParentsFromPath = (path: string[]): IScopedValue => {
    let parent: IScopedValue = context;

    // don't be destructive
    const p = path.slice();

    while (p.length) {
      const parentKey = p.shift();
      parent = {
        parent,
        value: parent.value[parentKey],
      };
    }

    // return the last parent of the chain, not the root parent
    return parent;
  };

  /** get the current context */
  const getContext = () => context;

  /** get the parent scope (if any) */
  const getParent = () => {
    return createVariableHandler(context.parent || context);
  };

  /** Find the parent node that does not have a parent value */
  const getRootContext = (scope: IScopedValue) => {
    let scopeRoot = scope;
    while (scopeRoot.parent) {
      scopeRoot = scopeRoot.parent;
    }
    return scopeRoot;
  };

  /** get a new variable handler scoped to the root */
  const getRoot = (): IVariableHandler => {
    const rootContext = getRootContext(context);
    return createVariableHandler(rootContext);
  };

  const getRootValue = () => {
    const rootContext = getRootContext(context);
    return rootContext.value;
  };

  const getScoped = (field: string): IVariableHandler => {
    const value =
      typeof context.value === "object" && context.value !== null
        ? context.value[field]
        : undefined;

    return createVariableHandler({ value, parent: context });
  };

  const getValue: IGetValueFn = (scope, path, count, returnPathValue) => {
    return returnPathValue
      ? jsonpath.nodes(scope.value, path, count)
      : jsonpath.query(scope.value, path, count);
  };

  /** Get an array of variable handlers */
  const repeat = (path: string): IVariableHandler[] => {
    let resolved;
    try {
      resolved = resolveValue(context, path, undefined, true);
    } catch (err) {
      // most likey malformed json path, just return no results
      return [];
    }

    // our default value?
    if (resolved.length === 0) {
      return [];
    }

    // check for one item
    if (resolved.length === 1) {
      const arrayValue = resolved[0].value;
      const repeatPath = isScopedPath.test(path) ? `$${path.substr(1)}` : path;

      // check for direct selection of an array
      if (Array.isArray(arrayValue) && !expectedMany(repeatPath)) {
        const parent = generateParentsFromPath(resolved[0].path.slice(1));

        // return an array of variable handlers
        return arrayValue.map((scopedValue) =>
          createVariableHandler({
            parent,
            value: scopedValue,
          })
        );
      }
    }

    // return an array of variable handlers
    return resolved.map(({ path: itemPath, value }) =>
      createVariableHandler({
        parent: generateParentsFromPath(itemPath.slice(1)),
        value,
      })
    );
  };

  /**
   * Scan a string for variables and resolve/replace each. If not found,
   * keep the string as-is.
   */
  const replace: IVariableHandler["replace"] = (
    str = "",
    encode: boolean = false
  ) => {
    let isVariable = true;
    return (
      str
        // split using a regex with groups will give us variables in every odd index of the
        // resulting array
        .split(variablePattern)
        .reduce((result, value) => {
          // toggle the isVariable flag
          isVariable = !isVariable;

          if (!isVariable) {
            return result + value;
          }

          try {
            const values = resolveValue(context, value, undefined);

            if (values.length > 0) {
              return (
                result +
                values
                  .map((v) => (Array.isArray(v) ? v.join(", ") : v))
                  .map((v) => (encode ? Utils.escapeExpression(v) : v))
                  .join(", ")
              );
            }

            // no value found so return the placeholder
            return result + `{${value}}`;
          } catch (err) {
            // probably a jsonpath parse error
            return result + `[Error]`;
          }
        }, "")
    );
  };

  /**
   * Internal resolve function.
   * This function handles resolving a path and always returns an array of values found.
   * @param scope - the current scope
   * @param path - JSON path string
   * @param count - limit the number of values returned
   * @param returnPathValue - wrap the value in an object with path and value keys
   */
  const resolveValue: IResolveValueFn = (
    scope,
    path,
    count,
    returnPathValue = false
  ) => {
    // bad value
    if (path === "") {
      return [];
    }

    // just want the current value?
    if (path === "@") {
      return returnPathValue
        ? [{ path: ["$"], value: scope.value }]
        : [scope.value];
    }

    if (typeof scope.value !== "object") {
      // can't pass non-objects to jsonpath so we need to handle tricky cases ourselves

      if (isScopedPath.test(path)) {
        // no other valid scoped paths since we already tested for "@"
        return [];
      }

      // should never have a non-object root value... but just in case
      if (!scope.parent) {
        // just want the current value?
        if (path === "$") {
          return returnPathValue
            ? [{ path: ["$"], value: scope.value }]
            : [scope.value];
        }

        // nothing else is valid
        return [];
      } else {
        // go up a level so jsonpath has a valid object to work with
        // it's ok to do this because we ruled out a scoped (@) path and
        // root ($) paths with start with the root and lazy paths (no $ or @)
        // will go up the parents anyway
        scope = scope.parent;
      }
    }

    // easy case: a json path expression
    if (isRootPath.test(path)) {
      const scopeRoot = getRootContext(scope);
      return getValue(scopeRoot, path, count, returnPathValue);
    }

    // easy case: a scoped json path expression
    if (isScopedPath.test(path)) {
      return getValue(
        scope,
        `$${path.substr(1)}`, // change from "@" to "$"
        count,
        returnPathValue
      );
    }

    // hard case: try the local scope and then try each parent until a match is found

    // convert the path value to a valid jsonpath
    const scopedPath =
      path.charAt(0) === "[" || path.charAt(0) === "."
        ? `$${path}` // just place a dollar sign in front
        : `$.${path}`; // assume a member name and prefix with $.

    for (
      let currentScope = scope;
      currentScope;
      currentScope = currentScope.parent
    ) {
      const results = getValue(
        currentScope,
        scopedPath,
        count,
        returnPathValue
      );

      if (results.length) {
        return results;
      }
    }

    // didn't find a value
    return [];
  };

  /**
   * Resolves a path and returns an array of values. If nothing was found, returns
   * the default value.
   */
  const resolve: IVariableHandler["resolve"] = (path, defaultValue) => {
    let values;
    try {
      values = resolveValue(context, path, undefined);
    } catch (err) {
      values = [];
    }

    if (values.length === 0) {
      return defaultValue;
    }

    return values;
  };

  const resolveV2: IVariableHandler["resolveV2"] = (path, defaultValue) => {
    let values: IJsonPathNode[];

    try {
      values = resolveValue(context, path, undefined, true);
    } catch (err) {
      values = [];
    }

    if (values.length === 0) {
      return defaultValue;
    }

    // json-path is obnoxious in that the result you get back is always an array
    // which obfuscates wether or not you targed an array directly ($.arrayValue)
    // or meant to select a range of items ($.books[:10]). If we get a single
    // value back, we probably targeted a value directly... but we may have targeted
    // a range of items and only got one value back, in which case, we expect an
    // array of length 1 as our response.
    if (
      values.length === 1 &&
      !expectedMany(
        path === "@" || isScopedPath.test(path) ? `$${path.substr(1)}` : path
      )
    ) {
      return values[0].value;
    }

    return values.map(({ value }) => value);
  };

  return {
    getContext,
    getParent,
    getRoot,
    getRootValue,
    getScoped,
    repeat,
    replace,
    resolve,
    resolveV2,
  };
};

export default createVariableHandler;
