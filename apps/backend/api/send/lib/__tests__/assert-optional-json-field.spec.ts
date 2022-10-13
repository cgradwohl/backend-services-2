import { BadRequest } from "~/lib/http-errors";
import { assertOptionalJsonField } from "../assert-optional-json-field";

jest.mock("~/lib/sentry");

describe("assertOptionalJsonField", () => {
  it("should allow null", () => {
    const result = assertOptionalJsonField({ foo: null }, "foo");
    expect(result).toBeUndefined();
  });

  it("should return a parsed JSON object, given a JSON string", () => {
    const foo = { foo: { bar: "baz" } };
    const result = assertOptionalJsonField({ foo: JSON.stringify(foo) }, "foo");
    expect(result).toEqual(foo);
  });

  it("should return a parsed JSON object, given a JSON object", () => {
    const foo = { foo: { bar: "baz" } };
    const result = assertOptionalJsonField({ foo }, "foo");
    expect(result).toEqual(foo);
  });

  it("should not throw if the field is undefined", () => {
    expect(() => assertOptionalJsonField({} as any, "foo")).not.toThrow();
  });

  it("should throw if the field is not valid json", () => {
    expect(() => assertOptionalJsonField({ foo: "{ h" }, "foo")).toThrowError(
      BadRequest
    );
  });

  it("should throw if the field is not an object type", () => {
    expect(() => assertOptionalJsonField({ foo: 5 }, "foo")).toThrowError(
      BadRequest
    );

    expect(() => assertOptionalJsonField({ foo: true }, "foo")).toThrowError(
      BadRequest
    );

    expect(() => assertOptionalJsonField({ foo: [] }, "foo")).not.toThrow();
  });
});
