import getDefaultBrand from "~/api/send/lib/get-default-brand";

jest.mock("~/lib/brands", () => {
  return {
    getDefault: jest.fn().mockResolvedValue({ name: "my-default-brand" }),
    getDefaultBrandId: jest
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce("default-brand-id"),
  };
});

jest.mock("~/api/send/lib/get-brand", () =>
  jest.fn().mockResolvedValue({
    name: "my-brand",
  })
);

describe("get default brand", () => {
  it("should return based on fallbacks", async () => {
    // feature disabled
    expect(await getDefaultBrand("mock-tenant-id", false)).toMatchObject({
      name: "my-default-brand",
    });

    // default brandId unavailable
    expect(await getDefaultBrand("mock-tenant-id", true)).toBeNull();

    // default brand available
    expect(await getDefaultBrand("mock-tenant-id", true)).toMatchObject({
      name: "my-brand",
    });
  });
});
