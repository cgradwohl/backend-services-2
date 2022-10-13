import { FilterConfig } from "~/audiences/stores/dynamo/types";
import { SingleFilterConfig } from "~/audiences/stores/dynamo/types";
import isAfter from "date-fns/isAfter";
import isBefore from "date-fns/isBefore";
import isValid from "date-fns/isValid";
import makeError from "make-error";

export type ComparisonOperator =
  | "ENDS_WITH"
  | "EQ"
  | "EXISTS"
  | "GT"
  | "GTE"
  | "INCLUDES"
  | "IS_AFTER"
  | "IS_BEFORE"
  | "LT"
  | "LTE"
  | "NEQ"
  | "OMIT"
  | "STARTS_WITH";

export type LogicalOperator = "AND" | "OR";

export type Operator = ComparisonOperator | LogicalOperator;

export const AudienceInvalidRuleError = makeError("AudienceInvalidRuleError");

type OperatorFn = (a, b, profileContext?: Record<string, unknown>) => boolean;

type Operators = {
  [key in Operator]: OperatorFn;
};

const operators: Operators = {
  ENDS_WITH: (a, b) => (typeof a === "string" ? a.endsWith(b) : false),
  EQ: (a, b) => a === b,
  EXISTS: (a, b, profileContext) => profileContext && Boolean(a) === Boolean(b),
  GT: (a, b) => parseInt(a) > parseInt(b),
  GTE: (a, b) => parseInt(a) >= parseInt(b),
  INCLUDES: (a, b) =>
    Array.isArray(a) || typeof a === "string" ? a.includes(b) : false,
  LT: (a, b) => parseInt(a) < parseInt(b),
  LTE: (a, b) => parseInt(a) <= parseInt(b),
  NEQ: (a, b) => a !== b,
  OMIT: (a, b) =>
    Array.isArray(a) || typeof a === "string" ? !a.includes(b) : true,
  AND: (...values) => values.every(Boolean),
  OR: (...values) => values.some(Boolean),
  STARTS_WITH: (a, b) => (typeof a === "string" ? a.startsWith(b) : false),
  IS_AFTER: (a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    if (isValid(dateA) && isValid(dateB)) {
      return isAfter(dateA, dateB);
    }
    return false;
  },
  IS_BEFORE: (a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    if (isValid(dateA) && isValid(dateB)) {
      return isBefore(dateA, dateB);
    }
    return false;
  },
};

class OperatorNode {
  public readonly operator: Operator;
  public readonly value: SingleFilterConfig["value"];
  public readonly path: string;

  constructor(
    operator: Operator,
    value: SingleFilterConfig["value"],
    path: string
  ) {
    this.operator = operator;
    this.value = value;
    this.path = path;
  }

  private getValue<T>(profile: Record<string, any>, path: string): T {
    const parts = path.split(".");

    let value = profile;

    for (const part of parts) {
      value = value?.[part] ?? null;
    }

    return value as T;
  }

  public evaluate(profile: Record<string, any>): boolean {
    const value = this.getValue<string>(profile, this.path);
    return operators[this.operator](value, this.value, profile);
  }
}

/*
 * Evaluates the audience rule, returning true if the rule is satisfied, false otherwise.
 * @param {object} context - The context to evaluate the audience rule against.
 * @param {AudienceRule} rule - The audience rule to evaluate.
 * @returns {boolean} - True if the audience rule is satisfied, false otherwise.
 * Implements DFS (Depth First Search) over FilterConfig objects.
 */
export function evaluateAudienceMembership(
  filter: FilterConfig,
  profileContext: Record<string, any>
): [boolean, string[]] {
  const evaluationPath = [];

  const evaluate = (subTree: FilterConfig): boolean => {
    const isSubtree = "filters" in subTree;
    const operation = subTree.operator;

    if (isSubtree) {
      const { filters } = subTree;
      return filters.reduce((acc: boolean, current) => {
        const currentResult = evaluate(current);
        if (acc !== null) {
          return operators[operation](acc, currentResult, profileContext);
        }
        return currentResult;
      }, null);
    }

    const node = new OperatorNode(operation, subTree.value, subTree.path);

    const evaluationResult = node.evaluate(profileContext);

    evaluationPath.push(
      `${operation}('${subTree.path}', '${subTree.value}') => ${evaluationResult}`
    );
    return evaluationResult;
  };

  return [evaluate(filter), evaluationPath];
}
