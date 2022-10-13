import { postIssueTokenHandler } from "../post-issue-token";
import { verify, decode } from "jsonwebtoken";
import getApiKey from "~/lib/tenant-service/get-api-key";

const apiKey = "test-key";

jest.mock("~/lib/get-environment-variable");
jest.mock("~/lib/sentry");
jest.mock("~/lib/tenant-service/get-api-key");
const mockApiKey = getApiKey as jest.Mock;

describe("postIssueTokenHandler", () => {
  it("should produce a valid signed jwt", async () => {
    const context: any = {
      event: {
        httpMethod: "POST",
        resource: "/auth/issue-token",
        body: JSON.stringify({
          scope: "user_id:test-user-id",
          expires_in: "1h",
        }),
      },
      tenantId: "test-tenant-id",
      scope: "published/production",
    };
    mockApiKey.mockResolvedValue(apiKey);

    expect.assertions(5);

    const result = await postIssueTokenHandler(context);
    const decoded = decode(result.body.token) as any;

    expect(result.status).toEqual(200);
    expect(() => verify(result.body.token, apiKey)).not.toThrow();
    expect(decoded.scope).toEqual("user_id:test-user-id");
    expect(decoded.tenant_id).toEqual("test-tenant-id");
    expect(decoded.tenant_scope).toEqual("published/production");
  });
});
