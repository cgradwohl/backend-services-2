import { runJwtMiddleware } from "../index";

describe("jwt-middleware", () => {
  afterEach(jest.clearAllMocks);

  const methodArn =
    "arn:aws:execute-api:us-east-1:123456789012:qwerty/dev/GET/";

  const makeEvent = ({
    userId,
    resource,
    httpMethod,
  }: {
    userId: string;
    resource: string;
    httpMethod: string;
  }): any => ({
    methodArn,
    pathParameters: {
      id: userId,
    },
    resource,
    httpMethod,
  });

  describe("runJwtMiddleware", () => {
    it("should throw if endpoint is not defined in clientEndpointPolicies", () => {
      expect.assertions(1);
      const event = makeEvent({
        userId: "drew",
        resource: "/foo",
        httpMethod: "GET",
      });
      const jwt = { scope: "foo" };

      expect(runJwtMiddleware(event, jwt)).rejects.toThrow("Unauthorized");
    });

    it("should throw if request method does not have middleware defined", () => {
      expect.assertions(1);
      const event = makeEvent({
        userId: "drew",
        resource: "/users/{id}/tokens/{token}",
        httpMethod: "POST",
      });
      const jwt = { scope: "foo" };

      expect(runJwtMiddleware(event, jwt)).rejects.toThrow("Unauthorized");
    });

    it("should not throw given valid jwt for endpoint", () => {
      expect.assertions(1);
      const event = makeEvent({
        userId: "drew",
        resource: "/users/{id}/tokens/{token}",
        httpMethod: "GET",
      });
      const jwt = { scope: "read:user-tokens user_id:drew" };

      expect(runJwtMiddleware(event, jwt)).resolves.not.toThrow();
    });
  });
});
