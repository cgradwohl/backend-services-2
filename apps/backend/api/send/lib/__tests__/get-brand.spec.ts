import getBrand from "~/api/send/lib/get-brand";

jest.mock("~/lib/brands", () => {
  return {
    convertBrandId: jest.fn().mockReturnValue("mock-brand-id"),
    get: jest.fn().mockResolvedValue({ name: "my-brand" }),
    getDefaultBrandId: jest.fn(),
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

describe("get brand", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should invoke fallbacks", async () => {
    // feature disabled
    expect(
      await getBrand("mock-tenant-id", "mock-brand-id", false)
    ).toMatchObject({
      name: "my-brand",
    });

    // materialized object not available
    expect(
      await getBrand("mock-tenant-id", "mock-brand-id", true)
    ).toMatchObject({
      name: "my-brand",
    });
  });
});
