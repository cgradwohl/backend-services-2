import isNil from "../is-nil";

it("should return true if input is undefined", () => {
  expect(isNil(undefined)).toBe(true);
});

it("should return true if item is null", () => {
  expect(isNil(null)).toBe(true);
});

it("should return false for non-nullish types", () => {
  expect(isNil(true)).toBe(false);
  expect(isNil(false)).toBe(false);
  expect(isNil(0)).toBe(false);
  expect(isNil(1.0)).toBe(false);
  expect(isNil([])).toBe(false);
  expect(isNil({})).toBe(false);
  expect(isNil("")).toBe(false);
});
