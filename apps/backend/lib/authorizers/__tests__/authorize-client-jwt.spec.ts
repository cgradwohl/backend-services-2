import { authorizeClientJwt } from "../authorize-client-jwt";
import jwt from "jsonwebtoken";
import listApiKeys from "~/lib/tenant-service/list-api-keys";

jest.mock("~/lib/tenant-service/list-api-keys");
const mockListApiKeys = listApiKeys as jest.Mock;

describe("Authorize client jwt", () => {
  afterEach(jest.clearAllMocks);
  beforeEach(() =>
    mockListApiKeys.mockResolvedValue([
      { authToken: apiKey, scope: "published/production" },
    ])
  );

  const tenantId = "me";
  const apiKey = "apiKey";
  const user_id = "userId";
  const client_key = Buffer.from(tenantId).toString("base64");
  const methodArn =
    "arn:aws:execute-api:us-east-1:123456789012:qwerty/dev/GET/";

  it("should authorize a valid jwt with a client key", async () => {
    const sig = jwt.sign(
      { client_key, scope: `user_id:${user_id} read:my-endpoint` },
      apiKey,
      { expiresIn: "1h" }
    );

    const result = await authorizeClientJwt({
      methodArn,
      jwt: sig,
    });
    expect(result?.policyDocument.Statement[0].Effect).toEqual("Allow");
  });

  it("should authorize a valid jwt with tenant_id and tenant_scope", async () => {
    const sig = jwt.sign(
      {
        tenant_id: tenantId,
        tenant_scope: "published/production",
        scope: `user_id:${user_id} read:my-endpoint`,
      },
      apiKey,
      { expiresIn: "1h" }
    );

    const result = await authorizeClientJwt({
      methodArn,
      jwt: sig,
    });
    expect(result?.policyDocument.Statement[0].Effect).toEqual("Allow");
  });

  it("should not authorize an expired jwt", async () => {
    const sig = jwt.sign({ client_key }, apiKey, { expiresIn: "-1h" });
    expect.assertions(1);
    await expect(
      authorizeClientJwt({
        methodArn,
        jwt: sig,
      })
    ).rejects.toThrow();
  });

  it("should not authorize when missing required scopes", async () => {
    const sig = jwt.sign({ scope: "read:my-endpoint" }, apiKey);
    expect.assertions(1);
    await expect(
      authorizeClientJwt({
        methodArn,
        jwt: sig,
      })
    ).rejects.toThrow();
  });
});
