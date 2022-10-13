import { assertJwtScope } from "../assert-jwt-scopes";

describe("assertJwtScopes", () => {
  it("throws if jwt does not have scope defined", () => {
    expect(() => assertJwtScope({})).toThrow("Unauthorized");
  });

  it("it returns list of scopes", () => {
    expect(assertJwtScope({ scope: "hello world" })).toEqual([
      "hello",
      "world",
    ]);
  });
});
