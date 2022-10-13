import { hasUserId } from "../has-user-id";

const unauthorized = () => {
  throw new Error("Unauthorized");
};
const event: any = {};

describe("hasScopes", () => {
  const middleware = hasUserId(() => "a-user-id");

  it("returns JwtMiddleware", () => {
    expect(middleware instanceof Function).toBeTruthy();
  });

  it("middleware should throw if JWT payload does not have correct user", () => {
    expect.assertions(1);
    const prom = middleware({
      event,
      jwtPayload: { scope: "user_id:foo" },
    });
    expect(prom).rejects.toThrow("Unauthorized");
  });

  it("middleware should not throw if JWT payload has correct user_id", () => {
    expect.assertions(1);
    const prom = middleware({
      event,
      jwtPayload: { scope: "user_id:a-user-id" },
    });
    expect(prom).resolves.not.toThrow("Unauthorized");
  });
});
