import { error } from "~/lib/log";
import { IVariableHandler } from "~/lib/variable-handler";
import {
  ConditionalFilterOperator,
  IConditionalConfig,
  IConditionalFilter,
} from "~/types.api";

export const filterOperationWithTypeMatch = (
  a: any,
  operator: ConditionalFilterOperator,
  b?: string
) => {
  // in another PR
  return filterOperation(a, operator, b);
};

export const filterOperation = (
  a: any,
  operator: ConditionalFilterOperator,
  b: any
) => {
  switch (operator) {
    case "EQUALS": {
      return String(a) === b;
    }

    case "NOT_EQUALS": {
      return String(a) !== b;
    }

    case "GREATER_THAN": {
      return Number(a) > Number(b);
    }

    case "LESS_THAN": {
      return Number(a) < Number(b);
    }

    case "GREATER_THAN_EQUALS": {
      return Number(a) >= Number(b);
    }

    case "LESS_THAN_EQUALS": {
      return Number(a) <= Number(b);
    }

    case "CONTAINS": {
      return a?.includes(b);
    }

    case "NOT_CONTAINS": {
      return !a?.includes(b);
    }

    case "IS_EMPTY": {
      if (a === undefined || a === null) {
        return true;
      }

      if (typeof a === "object") {
        if (Array.isArray(a) && a.length === 0) {
          return true;
        }

        return Object.keys(a).length === 0;
      }

      return a === "";
    }

    case "NOT_EMPTY": {
      if (a === undefined || a === null) {
        return false;
      }

      if (typeof a === "object") {
        if (Array.isArray(a) && a.length === 0) {
          return false;
        }

        return Object.keys(a).length !== 0;
      }

      return a !== "";
    }

    default:
      const exhaustiveCheck: never = operator;
      throw new Error(`Invalid Operator: ${exhaustiveCheck}`);
  }
};

export default (
  variableHandler: IVariableHandler,
  conditional: IConditionalConfig
) => {
  if (!conditional || !conditional.filters || !conditional.filters.length) {
    return false;
  }

  let conditionalResult = false;
  const operatorFunction =
    conditional.logicalOperator === "or"
      ? Array.prototype.some
      : Array.prototype.every;

  try {
    conditionalResult = operatorFunction.call(
      conditional.filters,
      (filter: IConditionalFilter) => {
        const scopeForA = variableHandler.getRoot().getScoped(filter.source);

        const scopeForB = variableHandler.getRoot().getScoped(filter.value);

        const [resolvedValueForA]: any = scopeForA.resolve(filter.property) || [
          "",
        ];

        const [resolveValueForB]: any = scopeForB.resolve(filter?.value) ?? [
          "",
        ];

        return filterOperationWithTypeMatch(
          resolvedValueForA,
          filter.operator,
          // Check if other operand of condition starts with lookup syntax
          filter.value?.includes("$") ? resolveValueForB : filter.value
        );
      }
    );
  } catch (ex) {
    error("Filtering failed", ex);
    conditionalResult = false;
  }

  const behavior = conditional.behavior || "hide";
  if (behavior === "show") {
    return !conditionalResult;
  }

  return conditionalResult;
};
