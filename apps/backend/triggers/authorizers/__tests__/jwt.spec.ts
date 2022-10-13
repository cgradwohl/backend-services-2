import { authorizeClientJwt, authorizeApiKey } from "~/lib/authorizers";
import { api } from "../jwt";
import { sign } from "jsonwebtoken";
import { Context } from "aws-lambda";

jest.mock("~/lib/authorizers");
jest.mock("~/lib/get-environment-variable");
jest.mock("~/lib/sentry");
const mockAuthorizeClientJwt = authorizeClientJwt as jest.Mock;
const mockAuthorizeApiKey = authorizeApiKey as jest.Mock;

describe("users authorizer", () => {
  afterEach(jest.clearAllMocks);

  const tenantId = "me";
  const apiKey = "apiKey";
  const clientKey = Buffer.from(tenantId).toString("base64");
  const methodArn =
    "arn:aws:execute-api:us-east-1:123456789012:qwerty/dev/GET/";
  const userId = "userId";

  const makeEvent = ({
    token,
    userId,
    resource,
    httpMethod,
  }: {
    token: string;
    userId: string;
    resource: string;
    httpMethod: string;
  }): any => ({
    methodArn,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    pathParameters: {
      id: userId,
    },
    resource,
    httpMethod,
  });

  it("authorizes api keys", async () => {
    mockAuthorizeApiKey.mockResolvedValue({});
    const event = makeEvent({
      token: apiKey,
      userId,
      resource: "/users/{id}/tokens/{token}",
      httpMethod: "GET",
    });
    const result = await api(event, {
      awsRequestId: "some-request-id",
    } as Context);
    expect(result).toBeDefined();
    expect(mockAuthorizeApiKey).toHaveBeenCalled();
  });

  it("authorizes client keys + signature", async () => {
    mockAuthorizeClientJwt.mockResolvedValue({});
    const scopes = ["read:user-tokens", `user_id:${userId}`];
    const sig = sign(
      { client_key: clientKey, scope: scopes.join(" ") },
      apiKey
    );

    const event = makeEvent({
      token: sig,
      userId,
      resource: "/users/{id}/tokens/{token}",
      httpMethod: "GET",
    });
    const result = await api(event, {
      awsRequestId: "some-other-request-id",
    } as Context);

    expect(result).toBeDefined();
    expect(mockAuthorizeClientJwt).toHaveBeenCalledWith({
      jwt: sig,
      methodArn,
    });
  });
});
