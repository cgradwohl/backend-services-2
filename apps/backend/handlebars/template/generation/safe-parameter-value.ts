const SafeParameterSymbol = Symbol("safe-handlebars-parameter");

export interface ISafeParameterValue {
  [SafeParameterSymbol]: true;
  value: string;
}

export const isSafeParameterValue = (
  value: object
): value is ISafeParameterValue => {
  return SafeParameterSymbol in value;
};

const safeParameterValue = (value: string): ISafeParameterValue => {
  return {
    [SafeParameterSymbol]: true,
    value,
  };
};

export default safeParameterValue;
