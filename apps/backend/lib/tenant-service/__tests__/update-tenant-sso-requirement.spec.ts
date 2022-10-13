import { updateTenantSsoRequirement } from "../update-tenant-sso-requirement";

const mockUpdate = jest.fn();
jest.mock("../../dynamo/store-service", () => (_tableName: string) => {
  return {
    update: mockUpdate,
  };
});

describe("Update tenant requireSso", () => {
  beforeEach(jest.resetAllMocks);

  it("should throw when given invalid sso provider", async () => {
    expect.assertions(1);
    return expect(
      updateTenantSsoRequirement("tenantId", "OktaCourier" as any)
    ).rejects.toThrowError();
  });

  it("should add custom sso requirement", async () => {
    await updateTenantSsoRequirement("tenantId", "custom:OktaCourier");
    expect(mockUpdate).toHaveBeenCalledWith(
      { tenantId: "tenantId" },
      { requireSso: "custom:OktaCourier" }
    );
  });

  it("should remove custom sso requirement is ssoProvider field is empty", async () => {
    await updateTenantSsoRequirement("tenantId");
    expect(mockUpdate).toHaveBeenCalledWith(
      { tenantId: "tenantId" },
      { requireSso: undefined }
    );
  });
});
