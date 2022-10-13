import getApiKey from "~/lib/tenant-service/get-api-key";
import listApiKeys from "~/lib/tenant-service/list-api-keys";

jest.mock("~/lib/tenant-service/list-api-keys", () => {
  return jest.fn();
});

const mockListApiKeys = listApiKeys as jest.Mock;
const tokens = [
  { scope: "published/production", authToken: "published/production" },
  { scope: "published/test", authToken: "published/test" },
];

describe("when getting api key", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("will throw if no keys found for tenant id", async () => {
    mockListApiKeys.mockResolvedValue([]);

    await expect(getApiKey("tenantId")).rejects.toThrowError();
  });

  it("will return published production if normal tenant id", async () => {
    mockListApiKeys.mockResolvedValue(tokens);

    const result = await getApiKey("1234");

    expect(result).toBe(tokens[0].authToken);
  });

  it("will return published test if test tenant id", async () => {
    mockListApiKeys.mockResolvedValue(tokens);

    const result = await getApiKey("1234/test");

    expect(result).toBe(tokens[1].authToken);
  });
});
