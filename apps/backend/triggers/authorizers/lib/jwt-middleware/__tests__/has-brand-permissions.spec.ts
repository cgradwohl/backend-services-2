import { hasBrandsPermission } from "../has-brands-permission";

const brandId = "my-brand";
const event: any = {
  pathParameters: { id: brandId },
};
const type = "write";
describe("hasBrandsPermissions", () => {
  const middleware = hasBrandsPermission(type);

  it("returns JwtMiddleware", () => {
    expect(middleware instanceof Function).toBeTruthy();
  });

  it("middleware should throw if JWT payload does not have brands permission", () => {
    expect.assertions(1);
    const prom = middleware({
      event,
      jwtPayload: { scope: "user_id:foo" },
    });
    expect(prom).rejects.toThrow("Unauthorized");
  });

  it("middleware should throw if JWT payload has brand scope tied to different brandId", () => {
    expect.assertions(1);
    const prom = middleware({
      event,
      jwtPayload: { scope: `${type}:brands:wrong-id` },
    });
    expect(prom).rejects.toThrow("Unauthorized");
  });

  it("middleware should not throw if JWT payload has brand scope tied to correct brandId", () => {
    expect.assertions(1);
    const prom = middleware({
      event,
      jwtPayload: { scope: `${type}:brands:${brandId}` },
    });
    expect(prom).resolves.not.toThrow("Unauthorized");
  });

  it("middleware should not throw if JWT payload has untethered brands scope", () => {
    expect.assertions(1);
    const prom = middleware({
      event,
      jwtPayload: { scope: `${type}:brands` },
    });
    expect(prom).resolves.not.toThrow("Unauthorized");
  });
});
