import { putTokens, getTokensByRecipient } from "~/lib/token-storage";
import { IUsersPutTokenData } from "~/types.public";
import { usersTokenBodyToWritableRecipientToken } from "../lib";
import { usersPutTokensHandler } from "../put-tokens";

jest.mock("~/lib/get-environment-variable");
jest.mock("~/lib/token-storage");
jest.mock("~/lib/sentry");

const mockPutTokens = putTokens as jest.Mock;
const mockGetTokensByRecipient = getTokensByRecipient as jest.Mock;

describe("usersPutTokensHandler", () => {
  const tenantId = "tenant";
  const recipientId = "recipientId";
  const data: IUsersPutTokenData = {
    properties: {},
    provider_key: "providerKey",
    device: {
      app_id: "deviceClient",
      platform: "deviceOS",
      model: "deviceModel",
    },
    tracking: {
      ip: "trackingIp",
      lat: "trackingLat",
      long: "trackingLon",
    },
    status: "unknown",
    status_reason: "statusReason",
  };

  const body = {
    tokens: [
      { token: "token2", ...data },
      { token: "token3", ...data },
      { token: "token4", ...data },
    ],
  };

  it("should call putTokens", async () => {
    mockGetTokensByRecipient.mockResolvedValue([]);

    const response = await usersPutTokensHandler({
      tenantId,
      event: {
        pathParameters: { id: recipientId },
        body: JSON.stringify(body),
      },
    } as any);

    const formattedTokens = body.tokens.map((item) =>
      usersTokenBodyToWritableRecipientToken({
        tenantId,
        recipientId,
        ...item,
      })
    );

    expect(response).toEqual({ status: 204 });
    expect(mockPutTokens).toHaveBeenCalledWith({
      tenantId,
      recipientId,
      tokens: formattedTokens,
    });
  });
});
