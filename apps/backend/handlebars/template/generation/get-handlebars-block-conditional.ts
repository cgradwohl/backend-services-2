import { IConditionalConfig, IConditionalFilter } from "~/types.api";

import getComplexHandlebarsParameter from "./get-complex-handlebars-parameter";
import getHandlebarsHashParameters from "./get-handlebars-hash-parameters";
import getHandlebarsParameter from "./get-handlebars-parameter";

const getHandlebarsBlockConditionalFilter = ({
  property,
  operator,
  source,
  value,
  ...options
}: IConditionalFilter): string => {
  const safeSource = getHandlebarsParameter(source);
  const safeProperty = getComplexHandlebarsParameter(property);
  const safeOperator = getHandlebarsParameter(operator);
  const safeValue = getComplexHandlebarsParameter(value);

  const optionalSafeValue =
    operator === "IS_EMPTY" || operator === "NOT_EMPTY"
      ? ""
      : ` ${safeValue.value}`;

  const filterParams = getHandlebarsHashParameters(options);

  return `(filter ${safeSource} ${safeProperty.value} ${safeOperator}${optionalSafeValue}${filterParams})`;
};

const getHandlebarsBlockConditional = (
  children: string,
  conditional?: IConditionalConfig
): string => {
  if (
    !conditional ||
    !conditional.filters ||
    !conditional.filters.length ||
    !children
  ) {
    return children;
  }

  const { logicalOperator = "and", behavior = "hide" } = conditional;

  const safeParams = conditional.filters.map(
    getHandlebarsBlockConditionalFilter
  );

  if (logicalOperator !== "and") {
    safeParams.push(
      `logicalOperator=${getHandlebarsParameter(logicalOperator)}`
    );
  }

  safeParams.push(`behavior=${getHandlebarsParameter(behavior)}`);
  return `{{#conditional ${safeParams.join(" ")}}}${children}{{/conditional}}`;
};

export default getHandlebarsBlockConditional;
