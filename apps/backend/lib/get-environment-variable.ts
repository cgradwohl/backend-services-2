import makeError from "make-error";

interface IGetEnvVarOptions {
  defaultValue?: string;
  optional?: boolean;
}

export const EnvironmentVariableNotFoundError = makeError(
  "EnvironmentVariableNotFoundError"
);

function getEnvVar(name: string, defaultValue?: string): string;
function getEnvVar(name: string, options?: IGetEnvVarOptions): string;

function getEnvVar(name: string, ...args: any[]): string {
  const options: IGetEnvVarOptions = typeof args[0] === "object" ? args[0] : {};
  const value = process.env[name];

  // value found
  if (value !== null && value !== undefined) {
    return value;
  }

  const defaultValue =
    typeof args[0] === "string" ? args[0] : options?.defaultValue;

  if (defaultValue) {
    return defaultValue;
  }

  if (options?.optional === true) {
    return undefined;
  }

  throw new EnvironmentVariableNotFoundError(`process.env.${name}`);
}

export default getEnvVar;
