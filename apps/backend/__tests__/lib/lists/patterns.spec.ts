import * as lists from "~/lib/lists";

describe("when asserting valid List Id", () => {
  const workingTestCases: readonly string[] = [
    "employees",
    "employees.sf",
    "employees.sf.engineering",
    "employees.sf.engineering.backend",
  ];

  for (const testCase of workingTestCases) {
    it(`will do nothing if List ID ${testCase} is valid`, () =>
      expect(lists.assertValidListId(testCase)).toBeUndefined());
  }

  const failingTestCases: readonly string[] = [
    "",
    "employees.*",
    "employees.#",
    ".employees",
    "employees.",
    "employees..sf",
    "employees sf",
    "employees.sf.engineering.backend.tests.jest.unit",
    "employees.sf.engineering.backend.tests.jest.unit.method",
  ];

  for (const testCase of failingTestCases) {
    it(`will throw if List ID ${testCase} is invalid`, () =>
      expect(() => lists.assertValidListId(testCase)).toThrow());
  }
});

describe("when asserting valid List Pattern", () => {
  const workingTestCases: readonly string[] = [
    null,
    undefined,
    "",
    "employees",
    "employees.sf",
    "employees.sf.*",
    "employees.**",
  ];

  for (const testCase of workingTestCases) {
    it(`will do nothing if List Pattern ${testCase} is valid`, () =>
      expect(lists.assertValidPattern(testCase)).toBeUndefined());
  }

  const failingTestCases: readonly string[] = [
    "*",
    "**",
    "*.*",
    "*.*.*",
    "*.*.*.*",
    "*.*.*.*.*",
    "*.*.*.*.*.*",
    "employees.*.**",
    "**mployees",
    "empl**oyees",
    "employees.**.**",
    "empl*yees",
    "employees*",
    "employees.",
    ".employees",
    "employees..sf",
    "employees sf",
    "employees.sf **",
    "employees.sf *",
    "employees.***",
    "employees.****",
  ];

  for (const testCase of failingTestCases) {
    it(`will throw if List Pattern ${testCase} is invalid`, () =>
      expect(() => lists.assertValidPattern(testCase)).toThrow());
  }
});
