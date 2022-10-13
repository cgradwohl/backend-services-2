import { putToken } from "~/lib/token-storage";
import { IUsersPutTokenData } from "~/types.public";
import { usersTokenBodyToWritableRecipientToken } from "../lib";
import { usersPutTokenHandler } from "../put-token";

jest.mock("~/lib/get-environment-variable");
jest.mock("~/lib/token-storage");
jest.mock("~/lib/sentry");

const mockPutToken = putToken as jest.Mock;

describe("usersPutTokenHandler", () => {
  const tenantId = "tenant";
  const token = "token";
  const recipientId = "recipientId";
  const body: IUsersPutTokenData = {
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

  it("should call putToken", async () => {
    mockPutToken.mockResolvedValueOnce(undefined);

    const response = await usersPutTokenHandler({
      tenantId,
      event: {
        pathParameters: { token, id: recipientId },
        body: JSON.stringify(body),
      },
    } as any);

    expect(response).toEqual({ status: 204 });
    expect(mockPutToken).toHaveBeenCalledWith(
      usersTokenBodyToWritableRecipientToken({
        ...body,
        tenantId,
        recipientId,
        token,
      })
    );
  });
});
