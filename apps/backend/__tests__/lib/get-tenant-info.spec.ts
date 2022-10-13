import getTenantInfo from "~/lib/get-tenant-info";

describe("when getting tenant info", () => {
  it("will return correct info", () =>
    expect(getTenantInfo("1234/test")).toStrictEqual({
      environment: "test",
      tenantId: "1234",
    }));

  it("will return production environment for non environment tenant ids", () =>
    expect(getTenantInfo("1234")).toStrictEqual({
      environment: "production",
      tenantId: "1234",
    }));

  it("will throw if tenant using unsupported environment", () =>
    expect(() => getTenantInfo("1234/staging")).toThrowError());
});
