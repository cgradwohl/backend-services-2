import { putToken, getToken, RecipientToken } from "~/lib/token-storage";
import { usersPatchTokenHandler } from "../patch-token";

jest.mock("~/lib/get-environment-variable");
jest.mock("~/lib/token-storage");
jest.mock("~/lib/sentry");

const mockPutToken = putToken as jest.Mock;
const mockGetToken = getToken as jest.Mock;

describe("usersPatchTokenHandler", () => {
  const tenantId = "tenant";
  const token = "token";
  const recipientId = "recipientId";
  const body = {
    patch: [
      { op: "replace", path: "/status", value: "revoked" },
      { op: "replace", path: "/status_reason", value: "idk" },
      { op: "add", path: "/device/platform", value: "macOS" },
      { op: "add", path: "/device/os", value: "macOS" },
      { op: "replace", path: "/created", value: "😈" },
      { op: "replace", path: "/updated", value: "😈" },
    ],
  };
  const mockRecipientToken: RecipientToken = {
    tenantId,
    recipientId,
    token,
    providerKey: "providerKey",
    status: "unknown",
    statusReason: "checked",
    created: "2020-01-01T00:00:00.000Z",
    updated: "2020-01-01T00:00:00.000Z",
  };

  it("should call putToken", async () => {
    mockGetToken.mockResolvedValue(mockRecipientToken);

    const response = await usersPatchTokenHandler({
      tenantId,
      event: {
        pathParameters: { token, id: recipientId },
        body: JSON.stringify(body),
      },
    } as any);

    expect(response).toEqual({ status: 204 });
    expect(mockPutToken).toHaveBeenCalledWith({
      tenantId,
      recipientId,
      token,
      status: "revoked",
      statusReason: "idk",
      created: mockRecipientToken.created,
      providerKey: "providerKey",
      device: {
        platform: "macOS",
      },
    });
  });
});
