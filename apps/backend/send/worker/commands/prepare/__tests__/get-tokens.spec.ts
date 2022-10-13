import { getTokensByProvider, RecipientToken } from "~/lib/token-storage";
import { getTokens } from "../get-tokens";

jest.mock("~/lib/token-storage");

const mockGetTokensByProvider = getTokensByProvider as jest.Mock;

describe("prepare context getTokens", () => {
  const tenantId = "038ba22e-e641-4a56-a1bf-463c81c65ef2";
  const userId = "userId";
  const mockTokens: RecipientToken[] = [
    {
      providerKey: "apn",
      status: "active",
      statusReason: "",
      token: "abc",
      tenantId,
      recipientId: userId,
      created: "",
      updated: "",
    },
    {
      providerKey: "apn",
      status: "active",
      statusReason: "",
      token: "def",
      tenantId,
      recipientId: userId,
      created: "",
      updated: "",
    },
    {
      providerKey: "firebase",
      status: "active",
      statusReason: "",
      token: "ghi",
      tenantId,
      recipientId: userId,
      created: "",
      updated: "",
    },
  ];

  it("should call getTokensByProvider", async () => {
    mockGetTokensByProvider.mockResolvedValue(mockTokens);
    await getTokens({ tenantId, userId });
    expect(mockGetTokensByProvider).toHaveBeenCalledWith({
      tenantId,
      recipientId: userId,
    });
  });
});
