import getLatestBrand from "~/api/send/lib/get-latest-brand";

jest.mock("~/lib/brands", () => {
  return {
    convertBrandId: jest.fn().mockReturnValue("mock-brand-id"),
    get: jest.fn().mockResolvedValue({ name: "my-brand" }),
    getLatest: jest.fn().mockResolvedValue({ name: "my-latest-brand" }),
  };
});

jest.mock("~/objects/services/materialized-objects", () => {
  const materializedServiceMock = () => {
    return {
      get: jest.fn().mockReturnValue(undefined),
    };
  };
  return materializedServiceMock;
});

describe("get latest brand", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should invoke fallbacks", async () => {
    // feature disabled
    expect(
      await getLatestBrand("mock-tenant-id", "mock-brand-id", false)
    ).toMatchObject({
      name: "my-latest-brand",
    });

    // materialized object not available
    expect(
      await getLatestBrand("mock-tenant-id", "mock-brand-id", true)
    ).toMatchObject({
      name: "my-latest-brand",
    });
  });
});
