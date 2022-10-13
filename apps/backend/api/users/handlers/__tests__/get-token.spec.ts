import { getToken, RecipientToken } from "~/lib/token-storage";
import { usersGetTokenHandler } from "../get-token";
import { recipientTokenToUsersTokenBody } from "../lib";

jest.mock("~/lib/get-environment-variable");
jest.mock("~/lib/token-storage");
jest.mock("~/lib/sentry");

const mockGetToken = getToken as jest.Mock;

describe("usersGetTokenHandler", () => {
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
    mockGetToken.mockResolvedValueOnce(recipientToken);

    const response = await usersGetTokenHandler({
      tenantId,
      event: {
        pathParameters: { token, id: recipientId },
      },
    } as any);

    expect(response).toEqual({
      status: 200,
      body: recipientTokenToUsersTokenBody(recipientToken),
    });

    expect(mockGetToken).toHaveBeenCalledWith({
      tenantId,
      token,
    });
  });

  it("should throw not found if token does not exist", () => {
    mockGetToken.mockResolvedValueOnce(undefined);

    return expect(
      usersGetTokenHandler({
        tenantId,
        event: {
          pathParameters: { token, id: recipientId },
        },
      } as any)
    ).rejects.toThrow("Not Found");
  });
});
