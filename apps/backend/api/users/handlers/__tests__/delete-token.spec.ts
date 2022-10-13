import { deleteToken } from "~/lib/token-storage";
import { usersDeleteTokenHandler } from "../delete-token";

jest.mock("~/lib/get-environment-variable");
jest.mock("~/lib/token-storage");
jest.mock("~/lib/sentry");

const mockDeleteToken = deleteToken as jest.Mock;

describe("usersDeleteTokenHandler", () => {
  const tenantId = "tenant";
  const token = "token";

  it("should call deleteToken", async () => {
    mockDeleteToken.mockResolvedValueOnce(undefined);

    const response = await usersDeleteTokenHandler({
      tenantId,
      event: {
        pathParameters: { token },
      },
    } as any);

    expect(response).toEqual({ status: 204 });
    expect(mockDeleteToken).toHaveBeenCalledWith({
      tenantId,
      token,
    });
  });
});
