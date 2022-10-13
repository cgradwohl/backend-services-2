import generateTenant from "~/lib/tenant-service/create/generate-tenant";
import * as kickbox from "~/lib/kickbox";
import { addTenantToDomain } from "~/lib/domains";
import listTenants from "~/lib/tenant-service/list";

jest.mock("~/lib/kickbox");
jest.mock("~/lib/domains");
jest.mock("~/lib/tenant-service/list");

const verifyEmailMock = kickbox.verifyEmail as jest.Mock;
const listTenantsMock = listTenants as jest.Mock;
const addTenantToDomainMock = addTenantToDomain as jest.Mock;

describe("generateTenant", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("will ignore gov emails", async () => {
    verifyEmailMock.mockImplementationOnce(() => {
      return {
        domain: "capital.gov",
        isCompanyEmail: false,
      };
    });

    listTenantsMock.mockImplementationOnce(() => {
      return [];
    });

    const tenant = await generateTenant(
      "mockUserId",
      "email@capital.gov",
      "Mock Tenant"
    );

    expect(tenant.discoverable).toBe("RESTRICTED");
    expect(tenant.domains).toEqual([]);
  });

  it("will ignore edu emails", async () => {
    verifyEmailMock.mockImplementationOnce(() => {
      return {
        domain: "school.edu",
        isCompanyEmail: false,
      };
    });

    listTenantsMock.mockImplementationOnce(() => {
      return [];
    });

    const tenant = await generateTenant(
      "mockUserId",
      "email@school.edu",
      "Mock Tenant"
    );

    expect(tenant.discoverable).toBe("RESTRICTED");
    expect(tenant.domains).toEqual([]);
  });

  it("will ignore gmail emails", async () => {
    verifyEmailMock.mockImplementationOnce(() => {
      return {
        domain: "gmail.com",
        isCompanyEmail: false,
      };
    });

    listTenantsMock.mockImplementationOnce(() => {
      return [];
    });

    const tenant = await generateTenant(
      "mockUserId",
      "email@gmail.com",
      "Mock Tenant"
    );

    expect(tenant.discoverable).toBe("RESTRICTED");
    expect(tenant.domains).toEqual([]);
  });

  it("will ignore mailfence emails", async () => {
    verifyEmailMock.mockImplementationOnce(() => {
      return {
        domain: "mailfence.com",
        isCompanyEmail: false,
      };
    });

    listTenantsMock.mockImplementationOnce(() => {
      return [];
    });

    const tenant = await generateTenant(
      "mockUserId",
      "email@mailfence.com",
      "Mock Tenant"
    );

    expect(tenant.discoverable).toBe("RESTRICTED");
    expect(tenant.domains).toEqual([]);
  });

  it("will make company emails available to join", async () => {
    verifyEmailMock.mockImplementationOnce(() => {
      return {
        domain: "courier.com",
        isCompanyEmail: true,
      };
    });

    listTenantsMock.mockImplementationOnce(() => {
      return [];
    });

    const tenant = await generateTenant(
      "mockUserId",
      "email@courier.com",
      "Mock Tenant"
    );

    expect(tenant.discoverable).toBe("FREE_TO_JOIN");
    expect(tenant.domains).toEqual(["courier.com"]);
  });
});
