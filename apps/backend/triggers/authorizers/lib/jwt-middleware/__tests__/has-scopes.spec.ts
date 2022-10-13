import { hasScopes } from "../has-scopes";

const unauthorized = () => {
  throw new Error("Unauthorized");
};
const event: any = {};

describe("hasScopes", () => {
  const middleware = hasScopes("read:everything", "write:everything");

  it("returns JwtMiddleware", () => {
    expect(middleware instanceof Function).toBeTruthy();
  });

  it("middleware should throw if JWT payload does not have correct scopes", () => {
    expect.assertions(1);
    const prom = middleware({
      event,
      jwtPayload: { scope: "boop" },
    });
    expect(prom).rejects.toThrow("Unauthorized");
  });

  it("middleware should not throw if JWT payload has correct scopes", () => {
    expect.assertions(1);
    const prom = middleware({
      event,
      jwtPayload: { scope: "read:everything write:everything" },
    });
    expect(prom).resolves.not.toThrow("Unauthorized");
  });
});
