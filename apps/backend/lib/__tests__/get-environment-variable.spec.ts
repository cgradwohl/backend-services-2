import getEnvVar, {
  EnvironmentVariableNotFoundError,
} from "../get-environment-variable";

const MockEnvironmentVariableName = "MOCK_ENVIRONMENT_VARIABLE_NAME";
const MockEnvironmentVariableValue = "MOCK_ENVIRONMENT_VALUE";

describe("lib/get-environment-variable", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = {
      [MockEnvironmentVariableName]: MockEnvironmentVariableValue,
      ...OLD_ENV,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    process.env = OLD_ENV;
  });

  it("should return the environment variable value", () => {
    expect(getEnvVar(MockEnvironmentVariableName)).toEqual(
      MockEnvironmentVariableValue
    );
  });

  it("should throw if the variable name is not found", () => {
    expect(() => getEnvVar("FOO")).toThrowError(
      EnvironmentVariableNotFoundError
    );
  });

  describe("default value", () => {
    it("should return a default value via argument", () => {
      expect(getEnvVar("FOO", MockEnvironmentVariableValue)).toEqual(
        MockEnvironmentVariableValue
      );
    });

    it("should return a default value via options", () => {
      expect(
        getEnvVar("FOO", { defaultValue: MockEnvironmentVariableValue })
      ).toEqual(MockEnvironmentVariableValue);
    });
  });

  describe("optional", () => {
    it("should not throw if the value is marked optional", () => {
      expect(getEnvVar("FOO", { optional: true })).toBeUndefined();
    });
  });
});
