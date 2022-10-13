import { sign } from "jsonwebtoken";
import { authorizeClientJwt, authorizeClientKey } from "~/lib/authorizers";

jest.mock("~/lib/authorizers");
jest.mock("~/lib/sentry");
const mockAuthorizeClientJwt = authorizeClientJwt as jest.Mock;
const mockAuthorizeClientKey = authorizeClientKey as jest.Mock;

describe("client authorizer handler", () => {
  afterEach(jest.clearAllMocks);

  const apiKey = "apiKey";
  const methodArn =
    "arn:aws:execute-api:us-east-1:123456789012:qwerty/dev/GET/";

  const makeEvent = ({ token }: { token: string }): any => ({
    methodArn,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  it("calls jwt authorizer when passed a jwt key", async () => {
    mockAuthorizeClientJwt.mockResolvedValue({});
    const result = await authorizeClientJwt(
      makeEvent({
        token: sign({}, apiKey),
      })
    );
    expect(result).toBeDefined();
    expect(mockAuthorizeClientJwt).toHaveBeenCalled();
  });

  it("calls key authorizer when not given jwt", async () => {
    mockAuthorizeClientKey.mockResolvedValue({});
    const result = await authorizeClientKey(
      makeEvent({
        token: "",
      })
    );
    expect(result).toBeDefined();
    expect(mockAuthorizeClientKey).toHaveBeenCalled();
  });
});
