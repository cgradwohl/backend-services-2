import { create, createDefaultBrand } from "~/lib/brands";
import { update as updateSettings } from "~/lib/settings-service";
import { IBrand } from "~/lib/brands/types";
import * as brands from "~/lib/brands";

const mockTenantId = "MOCK_TENANT_ID";
const mockUserId = "MOCK_USER_ID";
const mockId = "MOCK_ID";

jest.spyOn(brands, "create").mockResolvedValue({ id: mockId } as IBrand);
jest.mock("aws-sdk");
jest.mock("~/lib/settings-service");

const mockUpdateSettings = updateSettings as jest.Mock;
const mockCreate = create as jest.Mock;

describe("Create default brand", () => {
  beforeEach(async () => {
    await brands.createDefaultBrand(mockTenantId, mockUserId, mockId);
  });
  it("should create defeault brand object", () => {
    expect(mockCreate).toBeCalledWith(
      mockTenantId,
      mockUserId,
      {
        id: mockId,
        name: "My First Brand",
        settings: {
          colors: {
            primary: "#9122C2",
            secondary: "#C1B6DD",
            tertiary: "#E85178",
          },
          email: { header: { barColor: "#9D3789" } },
          inapp: {
            borderRadius: "24px",
            disableMessageIcon: true,
            placement: "bottom",
          },
        },
      },
      { publish: true }
    );
  });

  it("should update settings", () => {
    expect(mockUpdateSettings).toBeCalledWith(
      {
        id: "defaultBrandId",
        tenantId: mockTenantId,
        userId: mockUserId,
      },
      mockId
    );
  });
});
