import { getTokensByRecipient, RecipientToken } from "~/lib/token-storage";
import { usersGetTokensHandler } from "../get-tokens";
import { recipientTokenToUsersTokenBody } from "../lib";

jest.mock("~/lib/get-environment-variable");
jest.mock("~/lib/token-storage");
jest.mock("~/lib/sentry");

const mockGetTokensByRecipient = getTokensByRecipient as jest.Mock;

describe("usersGetTokensHandler", () => {
  const tenantId = "tenant";
  const token = "token";
  const recipientId = "recipientId";
  const recipientToken: RecipientToken = {
    tenantId,
    recipientId,
    token,
    lastUsed: "lastUsed",
    properties: {},
    providerKey: "providerKey",
    status: "unknown",
    statusReason: "statusReason",
    device: {
      appId: "appId",
      adId: "adId",
      deviceId: "deviceId",
      platform: "platform",
      manufacturer: "manufacturer",
      model: "model",
    },
    tracking: {
      ip: "ip",
      lat: "lat",
      long: "long",
      osVersion: "osVersion",
    },
    created: "2019-01-01T00:00:00.000Z",
    updated: "2019-01-01T00:00:00.000Z",
  };

  it("should call getToken", async () => {
    mockGetTokensByRecipient.mockResolvedValueOnce([recipientToken]);

    const response = await usersGetTokensHandler({
      tenantId,
      event: {
        pathParameters: { id: recipientId },
      },
    } as any);

    expect(response).toEqual({
      status: 200,
      body: { tokens: [recipientTokenToUsersTokenBody(recipientToken)] },
    });

    expect(mockGetTokensByRecipient).toHaveBeenCalledWith({
      tenantId,
      recipientId,
    });
  });
});
